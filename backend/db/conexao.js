// Conexão com o MySQL. Todo acesso ao banco passa por aqui.
const mysql = require('mysql2/promise');
const cfg = require('../config');

let pool;

function criarPool() {
    const comum = {
        waitForConnections: true,
        connectionLimit: 5,
        // Datas e horários voltam como texto ("2026-11-23", "08:00:00"), sem conversão de fuso.
        dateStrings: true,
        decimalNumbers: true,
        timezone: cfg.FUSO,
        multipleStatements: true,
    };
    // Bancos na nuvem: conexão segura. O Aiven usa certificado próprio (DB_SSL_CA, o conteúdo do ca.pem).
    const ssl = cfg.DB_SSL || cfg.DB_SSL_CA
        ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true, ...(cfg.DB_SSL_CA ? { ca: cfg.DB_SSL_CA } : {}) } }
        : {};

    // Tira parâmetros como "?ssl-mode=REQUIRED" que vêm na URL copiada do painel (o SSL é configurado acima)
    const url = cfg.DATABASE_URL?.split('?')[0];

    const novo = url
        ? mysql.createPool({ uri: url, ...comum, ...ssl })
        : mysql.createPool({
            host: cfg.DB_HOST,
            port: cfg.DB_PORTA,
            user: cfg.DB_USUARIO,
            password: cfg.DB_SENHA,
            database: cfg.DB_NOME,
            ...comum,
            ...ssl,
        });

    // Horário de Brasília em todas as conexões (CURRENT_TIMESTAMP, NOW()...)
    novo.pool.on('connection', (conexao) => conexao.query(`SET time_zone = '${cfg.FUSO}'`));
    return novo;
}

function obterPool() {
    if (!pool) pool = criarPool();
    return pool;
}

// Executa um SQL e devolve só as linhas (ou o resultado do INSERT/UPDATE).
async function consulta(sql, params = [], conexao = null) {
    const [linhas] = await (conexao || obterPool()).query(sql, params);
    return linhas;
}

// Executa várias operações como uma só: se alguma falhar, nada é gravado (RNF06).
async function transacao(fn) {
    const conexao = await obterPool().getConnection();
    try {
        await conexao.beginTransaction();
        const resultado = await fn(conexao);
        await conexao.commit();
        return resultado;
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        conexao.release();
    }
}

async function encerrar() {
    if (pool) await pool.end();
    pool = null;
}

module.exports = { consulta, transacao, obterPool, encerrar };
