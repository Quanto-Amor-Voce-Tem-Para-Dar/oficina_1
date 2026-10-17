const express = require('express');
const { PORTA } = require('./config');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.redirect('/auth');
});

app.use('/auth', require('./routes/auth'));

app.listen(PORTA, () => {
    console.log(`Servidor iniciado em http://localhost:${PORTA}`);
});
