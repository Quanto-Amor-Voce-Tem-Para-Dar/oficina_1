const fs = require('fs');
const express = require('express');
const routes = express.Router();
const { google } = require('googleapis');

const CREDENTIALS_PATH = 'credentials.json';
const TOKEN_PATH = 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

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

// Rota para iniciar a autenticação (Redireciona o usuário para o Google)
routes.get('/', (req, res) => {
    try {
        const oAuth2Client = loadClientCredentials();
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: SCOPES,
        });
        res.redirect(authUrl);
    } catch (error) {
        console.error('Erro ao carregar credenciais:', error);
        res.status(500).send('Erro ao configurar credenciais OAuth.');
    }
});

// Rota de Callback (Para onde o Google redireciona após o login)
routes.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('Código de autorização não encontrado.');
    }

    try {
        const oAuth2Client = loadClientCredentials();
        const { tokens } = await oAuth2Client.getToken(code);

        // Salva o token em um arquivo JSON para uso futuro
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

        res.send('Autenticação realizada com sucesso! Você já pode fechar esta aba e usar a API.');
    } catch (error) {
        console.error('Erro ao recuperar o token:', error);
        res.status(500).send('Erro na autenticação.');
    }
});

module.exports = routes;