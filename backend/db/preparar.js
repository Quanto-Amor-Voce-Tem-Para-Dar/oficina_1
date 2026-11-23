// Cria as tabelas e o administrador padrão. Com --demo, também coloca dados de exemplo.
//   npm run db:preparar        -> tabelas + admin
//   npm run db:demo            -> tabelas + admin + voluntários, ações e turnos de exemplo
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const cfg = require('../config');
const { consulta, transacao, encerrar } = require('./conexao');

async function criarTabelas() {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await consulta(sql);
}

async function criarAdminPadrao() {
    const [{ total }] = await consulta(
        "SELECT COUNT(*) AS total FROM Usuario WHERE perfil = 'ADMINISTRADOR'"
    );
    if (total > 0) return false;

    await consulta(
        "INSERT INTO Usuario (nome, email, senha_hash, perfil) VALUES (?, ?, ?, 'ADMINISTRADOR')",
        [cfg.ADMIN_NOME, cfg.ADMIN_EMAIL.toLowerCase(), await bcrypt.hash(cfg.ADMIN_SENHA, 10)]
    );
    return true;
}

// Próximo dia da semana (0 = domingo ... 6 = sábado) a partir de hoje + semanas.
function proximo(diaSemana, semanas = 0) {
    const d = new Date();
    d.setDate(d.getDate() + ((diaSemana - d.getDay() + 7) % 7 || 7) + semanas * 7);
    return d.toISOString().slice(0, 10);
}

const VOLUNTARIOS_DEMO = [
    ['Lucas Alves', 'lucas.alves@email.com', [['SEG', '08:00', '12:00'], ['TER', '13:00', '17:00'], ['SAB', '08:00', '12:00']]],
    ['Mariana Costa', 'mariana.costa@email.com', [['SEG', '08:00', '12:00'], ['QUA', '08:00', '12:00'], ['SAB', '08:00', '12:00']]],
    ['Gabriel Lima', 'gabriel.lima@email.com', [['TER', '10:00', '14:00'], ['SAB', '10:00', '14:00']]],
    ['Beatriz Santos', 'beatriz.santos@email.com', [['SEG', '10:00', '14:00'], ['SAB', '10:00', '14:00']]],
    ['Camila Rocha', 'camila.rocha@email.com', [['QUA', '14:00', '18:00'], ['SAB', '14:00', '18:00']]],
    ['Pedro Henrique', 'pedro.henrique@email.com', [['TER', '14:00', '18:00'], ['SAB', '14:00', '16:00']]],
    ['Julia Ferreira', 'julia.ferreira@email.com', [['QUI', '16:00', '18:00'], ['SAB', '16:00', '18:00']]],
    ['Matheus Cardoso', 'matheus.cardoso@email.com', [['SEX', '16:00', '18:00'], ['SAB', '12:00', '18:00']]],
];

async function criarDemo() {
    const [{ total }] = await consulta("SELECT COUNT(*) AS total FROM Usuario WHERE perfil = 'VOLUNTARIO'");
    if (total > 0) return false;

    const senha = await bcrypt.hash('voluntario123', 10);
    await transacao(async (c) => {
        for (const [nome, email, horarios] of VOLUNTARIOS_DEMO) {
            const r = await consulta(
                "INSERT INTO Usuario (nome, email, senha_hash, perfil) VALUES (?, ?, ?, 'VOLUNTARIO')",
                [nome, email, senha], c
            );
            for (const [dia, ini, fim] of horarios) {
                await consulta(
                    'INSERT INTO Disponibilidade (id_usuario, dia_semana, hora_inicio, hora_fim) VALUES (?, ?, ?, ?)',
                    [r.insertId, dia, ini, fim], c
                );
            }
        }

        const feira = await consulta(
            "INSERT INTO Acao (nome, descricao, status) VALUES (?, ?, 'PLANEJADA')",
            ['Feira de Doações – Praça Central', 'Estande de arrecadação e doação na praça.'], c
        );
        const sabado = proximo(6);
        for (const [ini, fim, vagas] of [['08:00', '10:00', 2], ['10:00', '12:00', 2], ['12:00', '14:00', 1], ['14:00', '16:00', 2], ['16:00', '18:00', 2]]) {
            await consulta(
                'INSERT INTO Turno (id_acao, data, hora_inicio, hora_fim, qtd_voluntarios_necessaria) VALUES (?, ?, ?, ?, ?)',
                [feira.insertId, sabado, ini, fim, vagas], c
            );
        }

        const oficina = await consulta(
            "INSERT INTO Acao (nome, descricao, status) VALUES (?, ?, 'PLANEJADA')",
            ['Oficina de Reciclagem – Escola Municipal', 'Oficina com as turmas do ensino fundamental.'], c
        );
        const terca = proximo(2);
        for (const [ini, fim, vagas] of [['09:00', '12:00', 1], ['14:00', '17:00', 2]]) {
            await consulta(
                'INSERT INTO Turno (id_acao, data, hora_inicio, hora_fim, qtd_voluntarios_necessaria) VALUES (?, ?, ?, ?, ?)',
                [oficina.insertId, terca, ini, fim, vagas], c
            );
        }
    });
    return true;
}

async function preparar({ demo = false } = {}) {
    await criarTabelas();
    const admin = await criarAdminPadrao();
    const exemplo = demo ? await criarDemo() : false;
    return { admin, exemplo };
}

if (require.main === module) {
    preparar({ demo: process.argv.includes('--demo') })
        .then(({ admin, exemplo }) => {
            console.log('Tabelas prontas.');
            if (admin) console.log(`Administrador criado: ${cfg.ADMIN_EMAIL} / senha: ${cfg.ADMIN_SENHA} (troque depois!)`);
            if (exemplo) console.log('Dados de exemplo criados. Voluntários entram com a senha "voluntario123".');
        })
        .catch((erro) => {
            console.error('Erro ao preparar o banco:', erro.message);
            process.exitCode = 1;
        })
        .finally(encerrar);
}

module.exports = { preparar };
