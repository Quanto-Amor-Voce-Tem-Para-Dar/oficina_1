const { PORTA } = require('../config');

// Padronização dos erros de todas as rotas.
function tratarErros(error, req, res, next) {
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ status: 'ERRO', mensagem: 'O corpo da requisição não é um JSON válido.' });
    }

    console.error('Erro ao gerar escala:', error);
    if (String(error.message).includes('invalid_grant')) {
        return res.status(401).json({
            status: 'ERRO',
            mensagem: `Login expirado. Acesse http://localhost:${PORTA}/auth para autenticar de novo.`,
        });
    }
    return res.status(500).json({ status: 'ERRO', mensagem: 'Erro ao buscar eventos do calendário.' });
}

module.exports = tratarErros;
