const fs = require('fs');
const { google } = require('googleapis');
const { CREDENTIALS_PATH, TOKEN_PATH } = require('../config');

function loadClientCredentials() {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    const keys = JSON.parse(content);
    const config = keys.installed || keys.web;

    if (!config) {
        throw new Error('Formato inválido em credentials.json (esperado "web" ou "installed").');
    }

    return new google.auth.OAuth2(
        config.client_id,
        config.client_secret,
        config.redirect_uris[0]
    );
}

function getAuthClient() {
    if (!fs.existsSync(TOKEN_PATH)) return null;

    const oAuth2Client = loadClientCredentials();
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));

    oAuth2Client.on('tokens', (novos) => {
        const atual = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        fs.writeFileSync(TOKEN_PATH, JSON.stringify({ ...atual, ...novos }, null, 2));
    });

    return oAuth2Client;
}

// O token de login vence em 1h, mas se o refresh_token ainda vale, a biblioteca renova sozinha.
// Assim: 
//      - access_token ainda válido -> responde na hora, sem requisição à API do Google;
//      - vencido -> renova com o refresh_token;
//      - refresh_token vencido/revogado ou ausente -> dá erro e precisa fazer login.
async function loginValido() {
    const auth = getAuthClient();
    if (!auth) return false;

    try {
        await auth.getAccessToken();
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = { loadClientCredentials, loginValido };