// Entrada da API na Vercel (função serverless). Localmente use o server.js.
// Na primeira requisição de cada instância, confere a configuração e cria as tabelas e o
// admin padrão se ainda não existirem (com DADOS_EXEMPLO=true, cria também os dados de exemplo).
const app = require('../app');
const { validarConfig } = require('../config');
const { preparar } = require('../db/preparar');

let pronto = null;

function responderErro(res, mensagem) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ status: 'ERRO', mensagem }));
}

module.exports = async (req, res) => {
    const erros = validarConfig();
    if (erros.length) return responderErro(res, `Configuração inválida: ${erros.join(' ')}`);

    try {
        pronto = pronto || preparar({ demo: process.env.DADOS_EXEMPLO === 'true' });
        await pronto;
    } catch (erro) {
        pronto = null; // tenta de novo na próxima requisição
        console.error('Erro ao preparar o banco:', erro);
        return responderErro(res, `Não consegui conectar no banco de dados: ${erro.message}`);
    }
    return app(req, res);
};
