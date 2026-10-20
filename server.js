const express = require('express');
const { PORTA } = require('./config');
const { loginValido } = require('./middleware/autenticacao');

const app = express();
app.use(express.json());

app.get('/', async (req, res) => {
    res.redirect((await loginValido()) ? '/escala' : '/auth');
});

app.use('/auth', require('./routes/auth'));
app.use(require('./routes/escala'));

app.listen(PORTA, () => {
    console.log(`Servidor iniciado em http://localhost:${PORTA}`);
});
