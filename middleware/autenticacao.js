const fs = require('fs');
const { google } = require('googleapis');
const { CREDENTIALS_PATH } = require('../config');

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

module.exports = { loadClientCredentials };