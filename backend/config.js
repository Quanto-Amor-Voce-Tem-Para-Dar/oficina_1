const fs = require('fs');
const path = require('path');
require('dotenv').config();

const raiz = (valor, padrao) => path.resolve(__dirname, valor || padrao);

const opcional = (nome) => process.env[nome] || undefined;

const config = {
    // SERVIDOR
    PORTA: Number(process.env.PORTA),
    
    // AUTENTICAÇÃO E ACESSO AO GOOGLE CLOUD
    GOOGLE_REDIRECT_URI: opcional('GOOGLE_REDIRECT_URI'),
    TOKEN_PATH: raiz(process.env.TOKEN_PATH, 'token.json'),
    CREDENTIALS_PATH: raiz(process.env.CREDENTIALS_PATH, 'credentials.json'),
    SCOPES: ['https://www.googleapis.com/auth/calendar.readonly'],

    // DADOS E REGRAS DE MONTAGEM DE ESCALAS
    PAYLOAD_PATH: raiz(process.env.PAYLOAD_PATH, 'payload.json'),
    PONTOS_PATH: raiz(process.env.PONTOS_PATH, 'data/pontos.json'), // provisório: trocar pelo BD
    MAX_PERMANENCIAS: 5,
    TIMEZONE: 'America/Sao_Paulo',
    // Flag booleana para ignorar a agenda do projeto na geração da escala.
    IGNORAR_AGENDA_DO_PROJETO: process.env.IGNORAR_AGENDA_DO_PROJETO === 'true',
};

function validarConfig() {
    const erros = [];

    if (!fs.existsSync(config.CREDENTIALS_PATH)) {
        erros.push(
            `credentials.json não encontrado em ${config.CREDENTIALS_PATH}. ` +
            'Confira GOOGLE_CREDENTIALS_PATH no .env (o valor precisa terminar em .json).'
        );
        return erros;
    }

    try {
        const credenciais = JSON.parse(fs.readFileSync(config.CREDENTIALS_PATH, 'utf8'));
        const participant = credenciais.web || credenciais.installed;
        if (!participant) {
            erros.push('O credentials.json precisa ter a chave "web" ou "installed".');
        } else if (!config.GOOGLE_REDIRECT_URI && !participant.redirect_uris?.length) {
            erros.push('Nenhum redirect URI: defina GOOGLE_REDIRECT_URI no .env ou cadastre um no credentials.json.');
        }
    } catch (error) {
        erros.push(`Não consegui ler o credentials.json: ${error.message}`);
    }

    return erros;
}

module.exports = { ...config, validarConfig };