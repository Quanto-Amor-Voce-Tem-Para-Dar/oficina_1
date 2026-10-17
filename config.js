const path = require('path');
require('dotenv').config();

const raiz = (valor, padrao) => path.resolve(__dirname, valor || padrao);

module.exports = {
    PORTA: Number(process.env.PORTA),
    CREDENTIALS_PATH: raiz(process.env.CREDENTIALS_PATH, 'credentials.json'),
    SCOPES: ['https://www.googleapis.com/auth/calendar.readonly'],
};