const fs = require('fs');
const express = require('express');
const { SCOPES, TOKEN_PATH } = require('../config');
const { loadClientCredentials } = require('../middleware/autenticacao');

const routes = express.Router();

// Rota para iniciar a autenticação (Redireciona o usuário para o Google)
routes.get('/auth', (req, res) => {
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

        res.redirect('/escala');
    } catch (error) {
        console.error('Erro ao recuperar o token:', error);
        res.status(500).send('Erro na autenticação.');
    }
});

module.exports = routes;