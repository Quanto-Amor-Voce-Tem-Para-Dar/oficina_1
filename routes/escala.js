const express = require('express');
const { exigirLogin, loginValido } = require('../middleware/autenticacao');
const { validarPayload } = require('../middleware/validarPayload');
const { carregarPayloadDeTeste } = require('../middleware/payloadDeTeste');
const { gerarEscala } = require('../models/escala');

const routes = express.Router();

async function responderEscala(req, res, next) {
    try {
        const gravar = req.query.gravar !== 'false';
        res.json(await gerarEscala(req.calendar, req.body, gravar));
    } catch (error) {
        next(error);
    }
}

routes.get('/escala', async (req, res) => {
    if (!(await loginValido())) return res.redirect('/auth');
    res.json({
        status: 'OK',
        mensagem: 'Login ativo. Para gerar a escala, envie o payload com POST /escala (veja o README) ou utilize GET /events para usar o payload mockado.',
    });
});

routes.post('/escala', exigirLogin, validarPayload, responderEscala);

routes.get('/events', exigirLogin, carregarPayloadDeTeste, validarPayload, responderEscala);

module.exports = routes;