// Trocas de turno (RF14, RF15).
//   POST /api/atribuicoes/:id/trocas   (voluntário dono do turno) { motivo, id_usuario_destino? }
//   GET  /api/trocas                   admin: todas | voluntário: as suas. ?status=PENDENTE
//   GET  /api/trocas/:id               (admin vê também se o destino está disponível)
//   POST /api/trocas/:id/analisar      (admin) { aprovar: true | false }
//   GET  /api/voluntarios/opcoes       lista simples de voluntários ativos (para escolher o destino)
const express = require('express');
const { consulta } = require('../db/conexao');
const { exigirLogin, exigirAdmin } = require('../middleware/autenticacao');
const { ErroApi } = require('../middleware/erros');
const { validar, regras, idParam } = require('../middleware/validar');
const troca = require('../models/troca');

const routes = express.Router();
routes.use(exigirLogin);

routes.post('/atribuicoes/:id/trocas', async (req, res) => {
    validar(req.body || {}, { motivo: [regras.texto(2000)], id_usuario_destino: [regras.inteiroPositivo] });
    res.status(201).json(await troca.solicitarTroca(idParam(req), req.usuario, req.body || {}));
});

routes.get('/trocas', async (req, res) => {
    res.json(await troca.listarTrocas(req.usuario, { status: req.query.status || null }));
});

routes.get('/trocas/:id', async (req, res) => {
    res.json(await troca.detalharTroca(idParam(req), req.usuario));
});

routes.post('/trocas/:id/analisar', exigirAdmin, async (req, res) => {
    if (typeof req.body?.aprovar !== 'boolean') throw new ErroApi(400, '"aprovar" deve ser true ou false.');
    res.json(await troca.analisarTroca(idParam(req), req.body.aprovar, req.usuario));
});

routes.get('/voluntarios/opcoes', async (req, res) => {
    res.json(await consulta(
        "SELECT id_usuario, nome FROM Usuario WHERE perfil = 'VOLUNTARIO' AND status = 'ATIVO' AND id_usuario <> ? ORDER BY nome",
        [req.usuario.id_usuario]
    ));
});

module.exports = routes;
