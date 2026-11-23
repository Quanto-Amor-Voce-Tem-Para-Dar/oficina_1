const fs = require('fs');
const path = require('path');
const { PAYLOAD_PATH } = require('../config');

// Só para a rota de teste GET /events: em vez de vir no corpo da requisição,
// o payload é lido do payload.json e colocado em req.body.
function carregarPayloadDeTeste(req, res, next) {
    try {
        req.body = JSON.parse(fs.readFileSync(PAYLOAD_PATH, 'utf8'));
        next();
    } catch (error) {
        res.status(500).json({
            status: 'ERRO',
            mensagem: `Não consegui ler ${path.basename(PAYLOAD_PATH)}: ${error.message}`,
        });
    }
}

module.exports = { carregarPayloadDeTeste };
