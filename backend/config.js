const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), quiet: true });

const raiz = (valor, padrao) => path.resolve(__dirname, valor || padrao);
const opcional = (nome) => process.env[nome] || undefined;

const config = {
    // SERVIDOR
    PORTA: Number(process.env.PORTA) || 3000,
    // Endereço do front-end: usado no CORS e para voltar ao sistema depois do login no Google.
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

    // BANCO DE DADOS (MySQL). Use DATABASE_URL (mysql://usuario:senha@host:porta/banco)
    // ou as variáveis separadas DB_HOST, DB_PORTA, DB_USUARIO, DB_SENHA, DB_NOME.
    DATABASE_URL: opcional('DATABASE_URL'),
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORTA: Number(process.env.DB_PORTA) || 3306,
    DB_USUARIO: process.env.DB_USUARIO || 'root',
    DB_SENHA: process.env.DB_SENHA || '',
    DB_NOME: process.env.DB_NOME || 'quanto_amor',
    // Bancos na nuvem (Aiven, TiDB Cloud...) exigem conexão segura: DB_SSL=true
    DB_SSL: process.env.DB_SSL === 'true',
    // Certificado da autoridade do banco (Aiven: baixe o "CA certificate" e cole o conteúdo aqui).
    // Aceita o texto com quebras de linha reais ou com "\n".
    DB_SSL_CA: process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined,

    // LOGIN DOS USUÁRIOS (e-mail e senha)
    JWT_SECRET: opcional('JWT_SECRET'),
    JWT_EXPIRA_EM: process.env.JWT_EXPIRA_EM || '8h',
    // Administrador criado automaticamente na primeira execução (npm run db:preparar)
    ADMIN_NOME: process.env.ADMIN_NOME || 'Administrador',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@quantoamor.com',
    ADMIN_SENHA: process.env.ADMIN_SENHA || 'admin123',

    // GOOGLE CALENDAR (conta do projeto). Opcional: sem isso, a escala usa só a
    // disponibilidade digitada pelos voluntários.
    // Pode vir das variáveis GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (bom para a Vercel)
    // ou do arquivo credentials.json baixado do Google Cloud (bom para rodar local).
    GOOGLE_CLIENT_ID: opcional('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: opcional('GOOGLE_CLIENT_SECRET'),
    GOOGLE_REDIRECT_URI: opcional('GOOGLE_REDIRECT_URI'),
    CREDENTIALS_PATH: raiz(process.env.CREDENTIALS_PATH, 'credentials.json'),
    SCOPES: ['https://www.googleapis.com/auth/calendar.readonly'],
    // Flag booleana para ignorar a agenda do projeto na geração da escala.
    IGNORAR_AGENDA_DO_PROJETO: process.env.IGNORAR_AGENDA_DO_PROJETO === 'true',

    // E-MAIL (SMTP). Opcional: sem isso, as notificações ficam registradas como FALHA.
    SMTP_HOST: opcional('SMTP_HOST'),
    SMTP_PORTA: Number(process.env.SMTP_PORTA) || 465,
    SMTP_USUARIO: opcional('SMTP_USUARIO'),
    SMTP_SENHA: opcional('SMTP_SENHA'),
    SMTP_REMETENTE: opcional('SMTP_REMETENTE'),

    // REGRAS DE MONTAGEM DE ESCALAS
    MAX_PERMANENCIAS: 5,
    TIMEZONE: 'America/Sao_Paulo',
    FUSO: '-03:00', // o Brasil não tem mais horário de verão
};

function smtpConfigurado() {
    return Boolean(config.SMTP_HOST && config.SMTP_USUARIO && config.SMTP_SENHA);
}

function googleConfigurado() {
    return Boolean(
        (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) || fs.existsSync(config.CREDENTIALS_PATH)
    );
}

// Só o essencial impede o servidor de subir. Google e SMTP são opcionais.
function validarConfig() {
    const erros = [];
    if (!config.JWT_SECRET) {
        erros.push('JWT_SECRET não definido no .env (qualquer texto longo e aleatório serve).');
    }
    if (!config.DATABASE_URL && !config.DB_HOST) {
        erros.push('Banco não configurado: defina DATABASE_URL ou DB_HOST no .env.');
    }
    return erros;
}

module.exports = { ...config, validarConfig, smtpConfigurado, googleConfigurado };
