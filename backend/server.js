// Sobe o servidor local (npm run dev / npm start). Na Vercel quem entra é o api/index.js.
const { PORTA, validarConfig } = require('./config');
const { preparar } = require('./db/preparar');

const erros = validarConfig();
if (erros.length) {
    erros.forEach((erro) => console.error(`Configuração inválida: ${erro}`));
    process.exit(1);
}

// Cria as tabelas e o admin padrão (se ainda não existirem) antes de subir.
preparar()
    .then(({ admin }) => {
        if (admin) console.log('Administrador padrão criado (veja ADMIN_EMAIL / ADMIN_SENHA no .env).');
        const app = require('./app');
        app.listen(PORTA, () => console.log(`API rodando em http://localhost:${PORTA}/api`));
    })
    .catch((erro) => {
        console.error('Não consegui conectar no banco de dados:', erro.message);
        console.error('Confira as variáveis DB_* (ou DATABASE_URL) no .env e se o MySQL está rodando.');
        process.exit(1);
    });
