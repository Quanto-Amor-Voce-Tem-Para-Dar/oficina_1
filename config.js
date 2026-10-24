const path = require('path');
require('dotenv').config();

const raiz = (valor, padrao) => path.resolve(__dirname, valor || padrao);

module.exports = {
    PORTA: Number(process.env.PORTA),
    CREDENTIALS_PATH: raiz(process.env.CREDENTIALS_PATH, 'credentials.json'),
    SCOPES: ['https://www.googleapis.com/auth/calendar.readonly'],
    TOKEN_PATH: raiz(process.env.TOKEN_PATH, 'token.json'),
    PAYLOAD_PATH: raiz(process.env.PAYLOAD_PATH, 'payload.json'),
    PONTOS_PATH: raiz(process.env.PONTOS_PATH, 'database/pontos.json'), // provisório: trocar pelo BD
    MAX_PERMANENCIAS: 5,
};