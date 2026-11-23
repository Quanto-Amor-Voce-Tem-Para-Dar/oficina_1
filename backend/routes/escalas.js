// Escalas (RF09 a RF13), escala do voluntário (RF04) e presença.
//   POST   /api/acoes/:id/escala                      (admin) gera a PROPOSTA
//   GET    /api/escalas                               (admin) ?acao=&status=
//   GET    /api/escalas/:id                           (admin) escala completa
//   POST   /api/escalas/:id/confirmar                 (admin)
//   DELETE /api/escalas/:id                           (admin) descarta a proposta
//   POST   /api/escalas/:id/atribuicoes               (admin) { id_turno, id_usuario } ajuste manual
//   DELETE /api/escalas/:id/atribuicoes/:idAtribuicao (admin)
//   GET    /api/turnos/:id/elegiveis                  (admin) quem pode ir neste turno
//   PATCH  /api/atribuicoes/:id/presenca              (admin) { status_presenca }
//   GET    /api/minha-escala                          turnos confirmados do usuário logado
const express = require('express');
const { consulta } = require('../db/conexao');
const { exigirLogin, exigirAdmin } = require('../middleware/autenticacao');
const { ErroApi } = require('../middleware/erros');
const { validar, regras, idParam } = require('../middleware/validar');
const escala = require('../models/escala');
const { recalcularHoras } = require('../models/horas');
const auditoria = require('../services/auditoria');

const routes = express.Router();
routes.use(exigirLogin);

routes.post('/acoes/:id/escala', exigirAdmin, async (req, res) => {
    res.status(201).json(await escala.gerarProposta(idParam(req), req.usuario));
});

routes.get('/escalas', exigirAdmin, async (req, res) => {
    res.json(await escala.listarEscalas({
        idAcao: req.query.acao ? Number(req.query.acao) : null,
        status: req.query.status || null,
    }));
});

routes.get('/escalas/:id', exigirAdmin, async (req, res) => {
    res.json(await escala.detalharEscala(idParam(req)));
});

routes.post('/escalas/:id/confirmar', exigirAdmin, async (req, res) => {
    res.json(await escala.confirmarEscala(idParam(req), req.usuario));
});

routes.delete('/escalas/:id', exigirAdmin, async (req, res) => {
    await escala.excluirProposta(idParam(req), req.usuario);
    res.json({ status: 'OK', mensagem: 'Proposta descartada.' });
});

routes.post('/escalas/:id/atribuicoes', exigirAdmin, async (req, res) => {
    validar(req.body, {
        id_turno: [regras.obrigatorio, regras.inteiroPositivo],
        id_usuario: [regras.obrigatorio, regras.inteiroPositivo],
    });
    res.status(201).json(await escala.adicionarAtribuicao(
        idParam(req), Number(req.body.id_turno), Number(req.body.id_usuario), req.usuario
    ));
});

routes.delete('/escalas/:id/atribuicoes/:idAtribuicao', exigirAdmin, async (req, res) => {
    res.json(await escala.removerAtribuicao(idParam(req), idParam(req, 'idAtribuicao'), req.usuario));
});

routes.get('/turnos/:id/elegiveis', exigirAdmin, async (req, res) => {
    res.json(await escala.elegiveisDoTurno(idParam(req)));
});

routes.patch('/atribuicoes/:id/presenca', exigirAdmin, async (req, res) => {
    const id = idParam(req);
    validar(req.body, { status_presenca: [regras.obrigatorio, regras.umDe(['CONFIRMADO', 'PRESENTE', 'AUSENTE'])] });
    const [atrib] = await consulta(
        `SELECT a.*, e.status AS status_escala FROM AtribuicaoTurno a JOIN Escala e ON e.id_escala = a.id_escala
         WHERE a.id_atribuicao = ?`,
        [id]
    );
    if (!atrib) throw new ErroApi(404, 'Atribuição não encontrada.');
    if (atrib.status_escala !== 'CONFIRMADA') throw new ErroApi(400, 'Confirme a escala antes de registrar presença.');

    await consulta('UPDATE AtribuicaoTurno SET status_presenca = ? WHERE id_atribuicao = ?', [req.body.status_presenca, id]);
    await recalcularHoras([atrib.id_usuario]);
    await auditoria.registrar({
        usuario: req.usuario, operacao: 'PRESENCA', entidade: 'AtribuicaoTurno', idEntidade: id,
        detalhes: { de: atrib.status_presenca, para: req.body.status_presenca },
    });
    res.json({ status: 'OK', id_atribuicao: id, status_presenca: req.body.status_presenca });
});

routes.get('/minha-escala', async (req, res) => {
    res.json(await consulta(
        `SELECT a.id_atribuicao, a.status_presenca, e.id_escala, ac.id_acao, ac.nome AS acao, ac.descricao,
                t.id_turno, t.data, TIME_FORMAT(t.hora_inicio, '%H:%i') AS hora_inicio, TIME_FORMAT(t.hora_fim, '%H:%i') AS hora_fim,
                ROUND(TIME_TO_SEC(TIMEDIFF(t.hora_fim, t.hora_inicio)) / 3600, 2) AS horas,
                (SELECT s.status FROM SolicitacaoTroca s WHERE s.id_atribuicao_origem = a.id_atribuicao
                 ORDER BY s.data_solicitacao DESC LIMIT 1) AS status_troca,
                (SELECT GROUP_CONCAT(u2.nome ORDER BY u2.nome SEPARATOR ', ') FROM AtribuicaoTurno a2
                 JOIN Usuario u2 ON u2.id_usuario = a2.id_usuario
                 WHERE a2.id_escala = a.id_escala AND a2.id_turno = a.id_turno AND a2.id_usuario <> a.id_usuario
                   AND a2.status_presenca <> 'AUSENTE') AS colegas
         FROM AtribuicaoTurno a
         JOIN Escala e ON e.id_escala = a.id_escala AND e.status = 'CONFIRMADA'
         JOIN Turno t ON t.id_turno = a.id_turno
         JOIN Acao ac ON ac.id_acao = t.id_acao
         WHERE a.id_usuario = ? AND a.status_presenca <> 'AUSENTE'
         ORDER BY t.data, t.hora_inicio`,
        [req.usuario.id_usuario]
    ));
});

module.exports = routes;
