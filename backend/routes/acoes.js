// Ações (RF02) e turnos (RF03).
//   GET    /api/acoes                 lista (com resumo dos turnos e da escala)
//   GET    /api/acoes/:id             ação com os turnos
//   POST   /api/acoes                 (admin)
//   PUT    /api/acoes/:id             (admin)
//   DELETE /api/acoes/:id             (admin) só se não tiver escala confirmada
//   POST   /api/acoes/:id/turnos      (admin)
//   PUT    /api/turnos/:id            (admin)
//   DELETE /api/turnos/:id            (admin)
const express = require('express');
const { consulta } = require('../db/conexao');
const { exigirLogin, exigirAdmin } = require('../middleware/autenticacao');
const { ErroApi } = require('../middleware/erros');
const { validar, regras, normalizarHora, exigirIntervalo, idParam } = require('../middleware/validar');
const auditoria = require('../services/auditoria');

const routes = express.Router();
routes.use(exigirLogin);

const STATUS_ACAO = ['PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];

const SELECT_TURNO = `SELECT id_turno, id_acao, data, TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
    TIME_FORMAT(hora_fim, '%H:%i') AS hora_fim, qtd_voluntarios_necessaria FROM Turno`;

async function buscarAcao(id) {
    const [acao] = await consulta(
        `SELECT a.*,
            (SELECT id_escala FROM Escala e WHERE e.id_acao = a.id_acao ORDER BY e.status = 'CONFIRMADA' DESC, e.data_geracao DESC LIMIT 1) AS id_escala,
            (SELECT status FROM Escala e WHERE e.id_acao = a.id_acao ORDER BY e.status = 'CONFIRMADA' DESC, e.data_geracao DESC LIMIT 1) AS status_escala
         FROM Acao a WHERE a.id_acao = ?`,
        [id]
    );
    if (!acao) throw new ErroApi(404, 'Ação não encontrada.');
    return acao;
}

async function turnosDaAcao(id) {
    return consulta(`${SELECT_TURNO} WHERE id_acao = ? ORDER BY data, hora_inicio`, [id]);
}

function validarTurno(t) {
    validar(t, {
        data: [regras.obrigatorio, regras.data],
        hora_inicio: [regras.obrigatorio, regras.hora],
        hora_fim: [regras.obrigatorio, regras.hora],
        qtd_voluntarios_necessaria: [regras.obrigatorio, regras.inteiroPositivo],
    });
    exigirIntervalo(t.hora_inicio, t.hora_fim);
}

// Turno com gente em escala confirmada não pode mudar de data/horário nem ser apagado.
async function temAtribuicaoConfirmada(idTurno) {
    const [linha] = await consulta(
        `SELECT 1 FROM AtribuicaoTurno a JOIN Escala e ON e.id_escala = a.id_escala
         WHERE a.id_turno = ? AND e.status = 'CONFIRMADA' LIMIT 1`,
        [idTurno]
    );
    return Boolean(linha);
}

routes.get('/acoes', async (req, res) => {
    const acoes = await consulta(
        `SELECT a.*,
            (SELECT COUNT(*) FROM Turno t WHERE t.id_acao = a.id_acao) AS total_turnos,
            (SELECT MIN(t.data) FROM Turno t WHERE t.id_acao = a.id_acao AND t.data >= CURDATE()) AS proxima_data,
            (SELECT MIN(t.data) FROM Turno t WHERE t.id_acao = a.id_acao) AS primeira_data,
            (SELECT MAX(t.data) FROM Turno t WHERE t.id_acao = a.id_acao) AS ultima_data,
            (SELECT status FROM Escala e WHERE e.id_acao = a.id_acao ORDER BY e.status = 'CONFIRMADA' DESC, e.data_geracao DESC LIMIT 1) AS status_escala
         FROM Acao a
         WHERE (? IS NULL OR a.status = ?)
         ORDER BY FIELD(a.status, 'EM_ANDAMENTO', 'PLANEJADA', 'CONCLUIDA', 'CANCELADA'), proxima_data IS NULL, proxima_data`,
        [req.query.status || null, req.query.status || null]
    );
    res.json(acoes);
});

routes.get('/acoes/:id', async (req, res) => {
    const id = idParam(req);
    res.json({ ...(await buscarAcao(id)), turnos: await turnosDaAcao(id) });
});

routes.post('/acoes', exigirAdmin, async (req, res) => {
    validar(req.body, {
        nome: [regras.obrigatorio, regras.texto(100)],
        descricao: [regras.texto(5000)],
        status: [regras.umDe(STATUS_ACAO)],
    });
    const { nome, descricao, status = 'PLANEJADA', turnos = [] } = req.body;
    if (!Array.isArray(turnos)) throw new ErroApi(400, '"turnos" deve ser uma lista.');
    turnos.forEach(validarTurno);

    const r = await consulta('INSERT INTO Acao (nome, descricao, status) VALUES (?, ?, ?)', [nome.trim(), descricao || null, status]);
    for (const t of turnos) {
        await consulta(
            'INSERT INTO Turno (id_acao, data, hora_inicio, hora_fim, qtd_voluntarios_necessaria) VALUES (?, ?, ?, ?, ?)',
            [r.insertId, t.data, normalizarHora(t.hora_inicio), normalizarHora(t.hora_fim), Number(t.qtd_voluntarios_necessaria)]
        );
    }
    res.status(201).json({ ...(await buscarAcao(r.insertId)), turnos: await turnosDaAcao(r.insertId) });
});

routes.put('/acoes/:id', exigirAdmin, async (req, res) => {
    const id = idParam(req);
    const atual = await buscarAcao(id);
    validar(req.body, {
        nome: [regras.texto(100)],
        descricao: [regras.texto(5000)],
        status: [regras.umDe(STATUS_ACAO)],
    });
    const { nome, descricao, status } = req.body;
    await consulta('UPDATE Acao SET nome = ?, descricao = ?, status = ? WHERE id_acao = ?', [
        nome?.trim() || atual.nome,
        descricao !== undefined ? descricao : atual.descricao,
        status || atual.status,
        id,
    ]);
    res.json({ ...(await buscarAcao(id)), turnos: await turnosDaAcao(id) });
});

routes.delete('/acoes/:id', exigirAdmin, async (req, res) => {
    const id = idParam(req);
    const acao = await buscarAcao(id);
    if (acao.status_escala === 'CONFIRMADA') {
        throw new ErroApi(409, 'Esta ação já tem escala confirmada. Em vez de excluir, mude o status para CANCELADA.');
    }
    await consulta('DELETE FROM Acao WHERE id_acao = ?', [id]);
    await auditoria.registrar({ usuario: req.usuario, operacao: 'EXCLUIR', entidade: 'Acao', idEntidade: id, detalhes: { nome: acao.nome } });
    res.json({ status: 'OK', mensagem: 'Ação excluída.' });
});

routes.post('/acoes/:id/turnos', exigirAdmin, async (req, res) => {
    const id = idParam(req);
    await buscarAcao(id);
    validarTurno(req.body);
    const t = req.body;
    const r = await consulta(
        'INSERT INTO Turno (id_acao, data, hora_inicio, hora_fim, qtd_voluntarios_necessaria) VALUES (?, ?, ?, ?, ?)',
        [id, t.data, normalizarHora(t.hora_inicio), normalizarHora(t.hora_fim), Number(t.qtd_voluntarios_necessaria)]
    );
    const [turno] = await consulta(`${SELECT_TURNO} WHERE id_turno = ?`, [r.insertId]);
    res.status(201).json(turno);
});

routes.put('/turnos/:id', exigirAdmin, async (req, res) => {
    const id = idParam(req);
    const [atual] = await consulta(`${SELECT_TURNO} WHERE id_turno = ?`, [id]);
    if (!atual) throw new ErroApi(404, 'Turno não encontrado.');

    const novo = { ...atual, ...req.body };
    validarTurno(novo);
    const mudouHorario = novo.data !== atual.data ||
        normalizarHora(novo.hora_inicio) !== atual.hora_inicio || normalizarHora(novo.hora_fim) !== atual.hora_fim;
    if (mudouHorario && (await temAtribuicaoConfirmada(id))) {
        throw new ErroApi(409, 'Este turno já tem voluntários confirmados: não dá para mudar a data ou o horário. Crie outro turno.');
    }

    await consulta(
        'UPDATE Turno SET data = ?, hora_inicio = ?, hora_fim = ?, qtd_voluntarios_necessaria = ? WHERE id_turno = ?',
        [novo.data, normalizarHora(novo.hora_inicio), normalizarHora(novo.hora_fim), Number(novo.qtd_voluntarios_necessaria), id]
    );
    const [turno] = await consulta(`${SELECT_TURNO} WHERE id_turno = ?`, [id]);
    res.json(turno);
});

routes.delete('/turnos/:id', exigirAdmin, async (req, res) => {
    const id = idParam(req);
    if (await temAtribuicaoConfirmada(id)) {
        throw new ErroApi(409, 'Este turno já tem voluntários confirmados e não pode ser excluído.');
    }
    const r = await consulta('DELETE FROM Turno WHERE id_turno = ?', [id]);
    if (!r.affectedRows) throw new ErroApi(404, 'Turno não encontrado.');
    res.json({ status: 'OK', mensagem: 'Turno excluído.' });
});

module.exports = routes;
