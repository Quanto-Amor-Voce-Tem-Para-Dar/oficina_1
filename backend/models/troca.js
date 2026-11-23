// Solicitações de troca ou desistência de turno (RF14, RF15) — Figura 7.
//   Voluntário pede (com ou sem voluntário de destino) -> PENDENTE -> admin analisa ->
//   APROVADA (atribuição passa para o destino, ou vira AUSENTE se for desistência) ou REJEITADA
//   -> e-mail para os envolvidos.
const { consulta, transacao } = require('../db/conexao');
const { ErroApi } = require('../middleware/erros');
const { turnoParaBloco } = require('./bloco');
const { calcularElegiveis } = require('./disponibilidade');
const { recalcularHoras } = require('./horas');
const { dadosDoTurno } = require('./escala');
const auditoria = require('../services/auditoria');
const { notificarUsuario, avisarAdministradores } = require('../services/email');

const SELECT_TROCA = `
    SELECT s.*, a.id_usuario AS id_usuario_origem, a.id_turno, a.id_escala,
           uo.nome AS nome_origem, uo.email AS email_origem,
           ud.nome AS nome_destino, ud.email AS email_destino,
           ua.nome AS nome_admin, t.data, t.hora_inicio, t.hora_fim, ac.id_acao, ac.nome AS acao_nome
    FROM SolicitacaoTroca s
    JOIN AtribuicaoTurno a ON a.id_atribuicao = s.id_atribuicao_origem
    JOIN Usuario uo ON uo.id_usuario = a.id_usuario
    LEFT JOIN Usuario ud ON ud.id_usuario = s.id_usuario_destino
    LEFT JOIN Usuario ua ON ua.id_usuario = s.id_admin_analise
    JOIN Turno t ON t.id_turno = a.id_turno
    JOIN Acao ac ON ac.id_acao = t.id_acao`;

async function buscarTroca(idSolicitacao) {
    const [troca] = await consulta(`${SELECT_TROCA} WHERE s.id_solicitacao = ?`, [idSolicitacao]);
    if (!troca) throw new ErroApi(404, 'Solicitação não encontrada.');
    return troca;
}

// Admin vê todas; voluntário vê as que pediu e as em que foi indicado como destino.
async function listarTrocas(usuario, { status } = {}) {
    const admin = usuario.perfil === 'ADMINISTRADOR';
    return consulta(
        `${SELECT_TROCA}
         WHERE (? IS NULL OR s.status = ?) AND (? OR a.id_usuario = ? OR s.id_usuario_destino = ?)
         ORDER BY s.status = 'PENDENTE' DESC, s.data_solicitacao DESC`,
        [status ?? null, status ?? null, admin, usuario.id_usuario, usuario.id_usuario]
    );
}

async function solicitarTroca(idAtribuicao, usuario, { motivo, id_usuario_destino: idDestino }) {
    const [atrib] = await consulta(
        `SELECT a.*, e.status AS status_escala, t.data, t.hora_inicio, t.hora_fim
         FROM AtribuicaoTurno a JOIN Escala e ON e.id_escala = a.id_escala JOIN Turno t ON t.id_turno = a.id_turno
         WHERE a.id_atribuicao = ?`,
        [idAtribuicao]
    );
    if (!atrib || atrib.id_usuario !== usuario.id_usuario) throw new ErroApi(404, 'Turno não encontrado na sua escala.');
    if (atrib.status_escala !== 'CONFIRMADA') throw new ErroApi(400, 'Só é possível pedir troca de escalas confirmadas.');
    if (atrib.status_presenca === 'AUSENTE' || atrib.status_presenca === 'PRESENTE') {
        throw new ErroApi(400, 'Este turno não pode mais ser trocado.');
    }
    if (turnoParaBloco(atrib).inicio < new Date()) throw new ErroApi(400, 'Este turno já começou ou já passou.');

    const [pendente] = await consulta(
        "SELECT id_solicitacao FROM SolicitacaoTroca WHERE id_atribuicao_origem = ? AND status = 'PENDENTE'", [idAtribuicao]
    );
    if (pendente) throw new ErroApi(409, 'Já existe uma solicitação pendente para este turno.');

    if (idDestino) {
        if (Number(idDestino) === usuario.id_usuario) throw new ErroApi(400, 'Escolha outro voluntário como destino.');
        const [destino] = await consulta(
            "SELECT id_usuario FROM Usuario WHERE id_usuario = ? AND perfil = 'VOLUNTARIO' AND status = 'ATIVO'", [idDestino]
        );
        if (!destino) throw new ErroApi(400, 'Voluntário de destino não encontrado ou inativo.');
    }

    const r = await consulta(
        'INSERT INTO SolicitacaoTroca (id_atribuicao_origem, id_usuario_destino, motivo) VALUES (?, ?, ?)',
        [idAtribuicao, idDestino || null, motivo || null]
    );
    await auditoria.registrar({ usuario, operacao: 'SOLICITAR', entidade: 'SolicitacaoTroca', idEntidade: r.insertId });

    const troca = await buscarTroca(r.insertId);
    // RF16: a gestão é avisada quando um voluntário informa que não poderá comparecer
    await avisarAdministradores(
        `Nova solicitação de ${idDestino ? 'troca' : 'desistência'} – ${troca.acao_nome}`,
        `${troca.nome_origem} pediu ${idDestino ? `troca com ${troca.nome_destino}` : 'para sair'} do turno de ` +
        `${dadosDoTurno(troca)} ("${troca.acao_nome}").\nMotivo: ${motivo || '(não informado)'}\n\nAnalise no sistema.`
    );
    return troca;
}

// Para o admin decidir: o destino está livre nesse horário? (Figura 7: verificar conflitos)
async function verificarDestino(troca) {
    if (!troca.id_usuario_destino) return null;
    const bloco = turnoParaBloco(troca);
    const { elegiveis } = await calcularElegiveis([bloco]);
    return elegiveis[bloco.id].includes(troca.id_usuario_destino);
}

async function detalharTroca(idSolicitacao, usuario) {
    const troca = await buscarTroca(idSolicitacao);
    const admin = usuario.perfil === 'ADMINISTRADOR';
    if (!admin && ![troca.id_usuario_origem, troca.id_usuario_destino].includes(usuario.id_usuario)) {
        throw new ErroApi(404, 'Solicitação não encontrada.');
    }
    return { ...troca, destino_disponivel: admin ? await verificarDestino(troca) : undefined };
}

async function analisarTroca(idSolicitacao, aprovar, admin) {
    const troca = await buscarTroca(idSolicitacao);
    if (troca.status !== 'PENDENTE') throw new ErroApi(400, 'Esta solicitação já foi analisada.');

    if (aprovar && troca.id_usuario_destino) {
        const [jaEsta] = await consulta(
            'SELECT 1 FROM AtribuicaoTurno WHERE id_escala = ? AND id_turno = ? AND id_usuario = ?',
            [troca.id_escala, troca.id_turno, troca.id_usuario_destino]
        );
        if (jaEsta) throw new ErroApi(409, 'O voluntário de destino já está neste turno. Rejeite ou peça outro destino.');
    }

    await transacao(async (c) => {
        await consulta(
            'UPDATE SolicitacaoTroca SET status = ?, id_admin_analise = ? WHERE id_solicitacao = ?',
            [aprovar ? 'APROVADA' : 'REJEITADA', admin.id_usuario, idSolicitacao], c
        );
        if (aprovar) {
            if (troca.id_usuario_destino) {
                await consulta(
                    "UPDATE AtribuicaoTurno SET id_usuario = ?, status_presenca = 'CONFIRMADO' WHERE id_atribuicao = ?",
                    [troca.id_usuario_destino, troca.id_atribuicao_origem], c
                );
            } else {
                await consulta(
                    "UPDATE AtribuicaoTurno SET status_presenca = 'AUSENTE' WHERE id_atribuicao = ?",
                    [troca.id_atribuicao_origem], c
                );
            }
            await recalcularHoras([troca.id_usuario_origem, troca.id_usuario_destino].filter(Boolean), c);
        }
        await auditoria.registrar({
            usuario: admin, operacao: aprovar ? 'APROVAR' : 'REJEITAR', entidade: 'SolicitacaoTroca', idEntidade: idSolicitacao,
        }, c);
    });

    // E-mails (TROCA_ANALISADA)
    const turno = `${dadosDoTurno(troca)} ("${troca.acao_nome}")`;
    const resultado = aprovar ? 'APROVADA' : 'REJEITADA';
    await notificarUsuario(
        { id_usuario: troca.id_usuario_origem, nome: troca.nome_origem, email: troca.email_origem },
        'TROCA_ANALISADA',
        `Sua solicitação foi ${resultado.toLowerCase()} – ${troca.acao_nome}`,
        `Olá, ${troca.nome_origem}!\n\nSua solicitação para o turno de ${turno} foi ${resultado}.` +
        (aprovar ? '\nVocê não está mais escalado(a) neste turno.' : '\nVocê continua escalado(a) neste turno.') +
        '\n\nQuanto Amor Você Tem Para Dar?'
    );
    if (aprovar && troca.id_usuario_destino) {
        await notificarUsuario(
            { id_usuario: troca.id_usuario_destino, nome: troca.nome_destino, email: troca.email_destino },
            'TROCA_ANALISADA',
            `Você assumiu um turno – ${troca.acao_nome}`,
            `Olá, ${troca.nome_destino}!\n\nVocê assumiu o turno de ${turno}, no lugar de ${troca.nome_origem}.` +
            '\n\nQuanto Amor Você Tem Para Dar?'
        );
    }
    return buscarTroca(idSolicitacao);
}

module.exports = { listarTrocas, solicitarTroca, detalharTroca, analisarTroca };
