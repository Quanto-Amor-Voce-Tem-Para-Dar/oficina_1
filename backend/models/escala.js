// Escalas (RF09 a RF13): gera a PROPOSTA, permite ajustes e confirma.
// Fluxo (Figura 8): turnos + disponibilidades -> elegíveis -> distribuir() -> salva PROPOSTA
//                   -> admin revisa/ajusta -> CONFIRMADA -> e-mail aos voluntários.
const { consulta, transacao } = require('../db/conexao');
const { ErroApi } = require('../middleware/erros');
const { turnoParaBloco } = require('./bloco');
const { calcularElegiveis } = require('./disponibilidade');
const { distribuir } = require('./distribuicao');
const { recalcularHoras } = require('./horas');
const auditoria = require('../services/auditoria');
const { notificarUsuario, avisarAdministradores, enviarEmail } = require('../services/email');

const formatarData = (d) => d.split('-').reverse().join('/');
const hhmm = (h) => String(h).slice(0, 5);

async function buscarAcao(idAcao) {
    const [acao] = await consulta('SELECT * FROM Acao WHERE id_acao = ?', [idAcao]);
    if (!acao) throw new ErroApi(404, 'Ação não encontrada.');
    return acao;
}

const turnosDaAcao = (idAcao) =>
    consulta('SELECT * FROM Turno WHERE id_acao = ? ORDER BY data, hora_inicio', [idAcao]);

// Gera a PROPOSTA de escala da ação (cada escala cobre todos os turnos da ação).
// Se já existe uma proposta, ela é substituída. Se a escala já foi confirmada, não gera de novo:
// o admin ajusta a escala confirmada manualmente (e os envolvidos recebem e-mail).
async function gerarProposta(idAcao, usuario) {
    const acao = await buscarAcao(idAcao);
    if (acao.status === 'CANCELADA' || acao.status === 'CONCLUIDA') {
        throw new ErroApi(400, `Não é possível gerar escala para uma ação ${acao.status.toLowerCase()}.`);
    }
    const [confirmada] = await consulta(
        "SELECT id_escala FROM Escala WHERE id_acao = ? AND status = 'CONFIRMADA'", [idAcao]
    );
    if (confirmada) {
        throw new ErroApi(409, 'A escala desta ação já foi confirmada. Ajuste-a manualmente na tela de escalas.');
    }

    const turnos = await turnosDaAcao(idAcao);
    if (turnos.length === 0) throw new ErroApi(400, 'Cadastre os turnos da ação antes de gerar a escala.');

    const blocos = turnos.map(turnoParaBloco);
    const { voluntarios, elegiveis, avisos, usaramGoogle } = await calcularElegiveis(blocos);
    const horas = Object.fromEntries(voluntarios.map((v) => [v.id_usuario, Number(v.horas_acumuladas)]));

    distribuir(blocos, elegiveis, horas);

    const idEscala = await transacao(async (c) => {
        // Só uma proposta aberta por ação
        await consulta("DELETE FROM Escala WHERE id_acao = ? AND status = 'PROPOSTA'", [idAcao], c);
        const r = await consulta("INSERT INTO Escala (id_acao, status) VALUES (?, 'PROPOSTA')", [idAcao], c);
        for (const bloco of blocos) {
            for (const idUsuario of bloco.alocados) {
                await consulta(
                    "INSERT INTO AtribuicaoTurno (id_escala, id_turno, id_usuario, status_presenca) VALUES (?, ?, ?, 'PENDENTE')",
                    [r.insertId, bloco.id, idUsuario], c
                );
            }
        }
        await auditoria.registrar({ usuario, operacao: 'GERAR', entidade: 'Escala', idEntidade: r.insertId }, c);
        return r.insertId;
    });

    const escala = await detalharEscala(idEscala);
    if (usaramGoogle) avisos.unshift(`Google Agenda consultado para ${usaramGoogle} voluntário(s).`);
    return { ...escala, avisos };
}

// Escala completa: turnos, quem foi atribuído e as vagas que faltam.
async function detalharEscala(idEscala) {
    const [escala] = await consulta(
        `SELECT e.*, ac.nome AS acao_nome, u.nome AS confirmada_por
         FROM Escala e JOIN Acao ac ON ac.id_acao = e.id_acao
         LEFT JOIN Usuario u ON u.id_usuario = e.id_usuario_confirmacao
         WHERE e.id_escala = ?`,
        [idEscala]
    );
    if (!escala) throw new ErroApi(404, 'Escala não encontrada.');

    const atribuicoes = await consulta(
        `SELECT a.id_atribuicao, a.id_turno, a.id_usuario, a.status_presenca, u.nome, u.email
         FROM AtribuicaoTurno a JOIN Usuario u ON u.id_usuario = a.id_usuario
         WHERE a.id_escala = ? ORDER BY u.nome`,
        [idEscala]
    );
    const turnos = await turnosDaAcao(escala.id_acao);

    const turnosDetalhados = turnos.map((t) => {
        const atribuidos = atribuicoes.filter((a) => a.id_turno === t.id_turno);
        // Quem desistiu (AUSENTE) continua no histórico, mas não ocupa a vaga
        const ocupando = atribuidos.filter((a) => a.status_presenca !== 'AUSENTE').length;
        return { ...t, atribuidos, vagas_faltando: Math.max(0, t.qtd_voluntarios_necessaria - ocupando) };
    });

    return {
        ...escala,
        turnos: turnosDetalhados,
        total_vagas_faltando: turnosDetalhados.reduce((s, t) => s + t.vagas_faltando, 0),
    };
}

async function listarEscalas({ idAcao, status } = {}) {
    return consulta(
        `SELECT e.id_escala, e.id_acao, ac.nome AS acao_nome, e.status, e.data_geracao, e.id_usuario_confirmacao,
                (SELECT COUNT(*) FROM AtribuicaoTurno a WHERE a.id_escala = e.id_escala) AS total_atribuicoes
         FROM Escala e JOIN Acao ac ON ac.id_acao = e.id_acao
         WHERE (? IS NULL OR e.id_acao = ?) AND (? IS NULL OR e.status = ?)
         ORDER BY e.data_geracao DESC`,
        [idAcao ?? null, idAcao ?? null, status ?? null, status ?? null]
    );
}

async function buscarEscala(idEscala) {
    const [escala] = await consulta('SELECT * FROM Escala WHERE id_escala = ?', [idEscala]);
    if (!escala) throw new ErroApi(404, 'Escala não encontrada.');
    return escala;
}

async function exigirProposta(idEscala) {
    const escala = await buscarEscala(idEscala);
    if (escala.status !== 'PROPOSTA') throw new ErroApi(400, 'Esta escala já foi confirmada.');
    return escala;
}

const dadosDoTurno = (t) => `${formatarData(t.data)}, das ${hhmm(t.hora_inicio)} às ${hhmm(t.hora_fim)}`;

// Ajuste manual pelo admin (Figura 8: "Ajustar escala manualmente").
// Funciona na PROPOSTA e também na escala CONFIRMADA (aí o voluntário já entra confirmado,
// as horas são recalculadas e ele recebe e-mail).
async function adicionarAtribuicao(idEscala, idTurno, idUsuario, usuario) {
    const escala = await buscarEscala(idEscala);
    const [turno] = await consulta('SELECT * FROM Turno WHERE id_turno = ? AND id_acao = ?', [idTurno, escala.id_acao]);
    if (!turno) throw new ErroApi(400, 'Este turno não pertence à ação da escala.');
    const [vol] = await consulta(
        "SELECT id_usuario, nome, email FROM Usuario WHERE id_usuario = ? AND perfil = 'VOLUNTARIO' AND status = 'ATIVO'",
        [idUsuario]
    );
    if (!vol) throw new ErroApi(400, 'Voluntário não encontrado ou inativo.');

    // Avisa (sem bloquear) se a pessoa não estava elegível: o admin tem a palavra final.
    const bloco = turnoParaBloco(turno);
    const { motivos } = await calcularElegiveis([bloco]);
    const motivo = motivos[bloco.id][idUsuario];
    const aviso = motivo ? `Atenção: ${vol.nome} não está disponível neste horário (${motivo.toLowerCase()}).` : null;

    const confirmada = escala.status === 'CONFIRMADA';
    await transacao(async (c) => {
        await consulta(
            'INSERT INTO AtribuicaoTurno (id_escala, id_turno, id_usuario, status_presenca) VALUES (?, ?, ?, ?)',
            [idEscala, idTurno, idUsuario, confirmada ? 'CONFIRMADO' : 'PENDENTE'], c
        );
        if (confirmada) await recalcularHoras([idUsuario], c);
        await auditoria.registrar({
            usuario, operacao: 'AJUSTAR_ADICIONAR', entidade: 'Escala', idEntidade: idEscala,
            detalhes: { turno: idTurno, voluntario: idUsuario },
        }, c);
    });

    const detalhe = await detalharEscala(idEscala);
    if (confirmada) {
        await notificarUsuario(vol, 'ESCALA_CONFIRMADA', `Você foi escalado(a) – ${detalhe.acao_nome}`,
            `Olá, ${vol.nome}!\n\nVocê foi incluído(a) na escala de "${detalhe.acao_nome}":\n\n- ${dadosDoTurno(turno)}\n\n` +
            'Se não puder comparecer, solicite a troca pelo sistema.\n\nQuanto Amor Você Tem Para Dar?');
    }
    return { escala: detalhe, aviso };
}

async function removerAtribuicao(idEscala, idAtribuicao, usuario) {
    const escala = await buscarEscala(idEscala);
    const [atrib] = await consulta(
        `SELECT a.*, u.nome, u.email, t.data, t.hora_inicio, t.hora_fim FROM AtribuicaoTurno a
         JOIN Usuario u ON u.id_usuario = a.id_usuario JOIN Turno t ON t.id_turno = a.id_turno
         WHERE a.id_atribuicao = ? AND a.id_escala = ?`,
        [idAtribuicao, idEscala]
    );
    if (!atrib) throw new ErroApi(404, 'Atribuição não encontrada nesta escala.');

    await transacao(async (c) => {
        await consulta('DELETE FROM AtribuicaoTurno WHERE id_atribuicao = ?', [idAtribuicao], c);
        if (escala.status === 'CONFIRMADA') await recalcularHoras([atrib.id_usuario], c);
        await auditoria.registrar({
            usuario, operacao: 'AJUSTAR_REMOVER', entidade: 'Escala', idEntidade: idEscala,
            detalhes: { turno: atrib.id_turno, voluntario: atrib.id_usuario },
        }, c);
    });

    const detalhe = await detalharEscala(idEscala);
    if (escala.status === 'CONFIRMADA') {
        await enviarEmail(atrib.email, `Alteração na escala – ${detalhe.acao_nome}`,
            `Olá, ${atrib.nome}!\n\nVocê foi retirado(a) do turno de ${dadosDoTurno(atrib)} na ação "${detalhe.acao_nome}".\n\n` +
            'Quanto Amor Você Tem Para Dar?');
    }
    return detalhe;
}

// Lista quem está elegível para um turno da escala (para o admin escolher no ajuste manual).
async function elegiveisDoTurno(idTurno) {
    const [turno] = await consulta('SELECT * FROM Turno WHERE id_turno = ?', [idTurno]);
    if (!turno) throw new ErroApi(404, 'Turno não encontrado.');
    const bloco = turnoParaBloco(turno);
    const { voluntarios, elegiveis, motivos, fontes, avisos } = await calcularElegiveis([bloco]);
    const lista = voluntarios
        .map((v) => ({
            ...v,
            elegivel: elegiveis[bloco.id].includes(v.id_usuario),
            motivo: motivos[bloco.id][v.id_usuario] || null,
            ...fontes[v.id_usuario],
        }))
        .sort((a, b) => b.elegivel - a.elegivel || a.horas_acumuladas - b.horas_acumuladas);
    return { voluntarios: lista, avisos };
}

// Confirma a escala (RF12): grava, atualiza as horas e avisa todo mundo por e-mail (RF16).
async function confirmarEscala(idEscala, usuario) {
    const escala = await exigirProposta(idEscala);

    const envolvidos = await transacao(async (c) => {
        await consulta(
            "UPDATE Escala SET status = 'CONFIRMADA', id_usuario_confirmacao = ? WHERE id_escala = ?",
            [usuario.id_usuario, idEscala], c
        );
        await consulta("UPDATE AtribuicaoTurno SET status_presenca = 'CONFIRMADO' WHERE id_escala = ?", [idEscala], c);
        const ids = (await consulta('SELECT DISTINCT id_usuario FROM AtribuicaoTurno WHERE id_escala = ?', [idEscala], c))
            .map((l) => l.id_usuario);
        await recalcularHoras(ids, c);
        await auditoria.registrar({ usuario, operacao: 'CONFIRMAR', entidade: 'Escala', idEntidade: idEscala }, c);
        return ids;
    });

    const detalhe = await detalharEscala(idEscala);
    const emails = await notificarConfirmacao(detalhe, envolvidos);

    if (detalhe.total_vagas_faltando > 0) {
        const faltando = detalhe.turnos.filter((t) => t.vagas_faltando > 0)
            .map((t) => `- ${formatarData(t.data)} ${hhmm(t.hora_inicio)}–${hhmm(t.hora_fim)}: faltam ${t.vagas_faltando}`)
            .join('\n');
        await avisarAdministradores(
            `Vagas não preenchidas – ${detalhe.acao_nome}`,
            `A escala de "${detalhe.acao_nome}" foi confirmada com vagas em aberto:\n\n${faltando}`
        );
    }
    return { ...detalhe, emails };
}

async function notificarConfirmacao(escala, idsUsuarios) {
    let enviados = 0;
    let falhas = 0;
    for (const id of idsUsuarios) {
        const [usuario] = await consulta('SELECT id_usuario, nome, email FROM Usuario WHERE id_usuario = ?', [id]);
        const seus = escala.turnos.filter((t) => t.atribuidos.some((a) => a.id_usuario === id));
        const lista = seus.map((t) => `- ${dadosDoTurno(t)}`).join('\n');
        const ok = await notificarUsuario(
            usuario,
            'ESCALA_CONFIRMADA',
            `Escala confirmada – ${escala.acao_nome}`,
            `Olá, ${usuario.nome}!\n\nVocê foi escalado(a) para a ação "${escala.acao_nome}":\n\n${lista}\n\n` +
            'Se não puder comparecer, solicite a troca pelo sistema o quanto antes.\n\nQuanto Amor Você Tem Para Dar?'
        );
        ok ? enviados++ : falhas++;
    }
    return { enviados, falhas };
}

async function excluirProposta(idEscala, usuario) {
    await exigirProposta(idEscala);
    await consulta('DELETE FROM Escala WHERE id_escala = ?', [idEscala]);
    await auditoria.registrar({ usuario, operacao: 'DESCARTAR', entidade: 'Escala', idEntidade: idEscala });
}

module.exports = {
    gerarProposta, detalharEscala, listarEscalas, adicionarAtribuicao, removerAtribuicao,
    elegiveisDoTurno, confirmarEscala, excluirProposta, formatarData, hhmm, dadosDoTurno,
};
