const fs = require('fs');
const path = require('path');
const { PONTOS_PATH } = require('../config');

// Provisório em arquivo JSON, no formato { "email@voluntario": 3 }.
// Quando o BD estiver pronto, só o corpo destas duas funções muda.
function carregarPontos() {
    if (!fs.existsSync(PONTOS_PATH)) return {};
    return JSON.parse(fs.readFileSync(PONTOS_PATH, 'utf8'));
}

function salvarPontos(pontos) {
    fs.mkdirSync(path.dirname(PONTOS_PATH), { recursive: true });
    fs.writeFileSync(PONTOS_PATH, JSON.stringify(pontos, null, 2));
}

module.exports = { carregarPontos, salvarPontos };