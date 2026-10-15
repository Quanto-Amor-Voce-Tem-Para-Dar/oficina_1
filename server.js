require('dotenv').config();
const express = require('express');

const app = express();
const porta = Number(process.env.PORT || 3000);

app.use(express.json());

app.get('/', (req, res) => {
    res.redirect('/auth');
});

app.use('/auth', require('./routes/auth'));

app.listen(porta, () => {
    console.log(`Servidor iniciado em http://localhost:${porta}`);
});
