// Monta a API. Separado do server.js para a Vercel poder importar (api/index.js).
const express = require('express');
const cors = require('cors');
const cfg = require('./config');
const { tratarErros, rotaNaoEncontrada } = require('./middleware/erros');

const app = express();

app.use(cors({
    origin: cfg.FRONTEND_URL.split(',').map((u) => u.trim()),
}));
app.use(express.json());

app.get('/', (req, res) => res.redirect(cfg.FRONTEND_URL));
app.get('/api/saude', (req, res) => res.json({ status: 'OK' }));

// A ordem importa: as rotas públicas (login e callback do Google) vêm primeiro.
app.use('/api/auth', require('./routes/auth').routes);
app.use('/api', require('./routes/geral'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api', require('./routes/acoes'));
app.use('/api', require('./routes/escalas'));
app.use('/api', require('./routes/trocas'));

app.use(rotaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
