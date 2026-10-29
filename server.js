const express = require('express');
const { PORTA, validarConfig } = require('./config');
const { loginValido } = require('./middleware/autenticacao');

const app = express();
app.use(express.json());

app.get('/', async (req, res) => {
    res.redirect((await loginValido()) ? '/escala' : '/auth');
});

app.use(require('./routes/auth'));
app.use(require('./routes/escala'));
app.use(require('./middleware/erros'));

const erros = validarConfig();
if (erros.length) {
    erros.forEach((erro) => console.error(`Configuração inválida: ${erro}`));
    process.exit(1);
} else {
    app.listen(PORTA, () => {
        console.log(`Servidor iniciado em http://localhost:${PORTA}`);
    });
}