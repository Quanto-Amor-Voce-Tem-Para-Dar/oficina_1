// RNF12: registra operações relevantes (criação, alteração e confirmação de escalas, trocas...).
const { consulta } = require('../db/conexao');

async function registrar({ usuario, operacao, entidade, idEntidade = null, detalhes = null }, conexao = null) {
    await consulta(
        'INSERT INTO LogAuditoria (id_usuario, operacao, entidade, id_entidade, detalhes) VALUES (?, ?, ?, ?, ?)',
        [usuario?.id_usuario ?? null, operacao, entidade, idEntidade, detalhes && JSON.stringify(detalhes)],
        conexao
    );
}

module.exports = { registrar };
