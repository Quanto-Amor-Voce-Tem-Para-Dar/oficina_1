// Usuários e voluntários (RF01), disponibilidade (RF05) e histórico (RF17).
//   GET    /api/usuarios                     (admin) lista, ?perfil=VOLUNTARIO&status=ATIVO&busca=
//   POST   /api/usuarios                     (admin) cadastra
//   GET    /api/usuarios/:id                 (admin ou o próprio)
//   PUT    /api/usuarios/:id                 (admin) altera dados, perfil, status ou senha
//   DELETE /api/usuarios/:id                 (admin) desativa (não apaga: mantém o histórico)
//   GET    /api/usuarios/:id/disponibilidade (admin ou o próprio)
//   PUT    /api/usuarios/:id/disponibilidade (admin ou o próprio) substitui a lista inteira
//   GET    /api/usuarios/:id/historico       (admin ou o próprio)
const express = require('express');
const bcrypt = require('bcryptjs');
const { consulta, transacao } = require('../db/conexao');
const { exigirLogin, exigirAdmin, exigirProprioOuAdmin } = require('../middleware/autenticacao');
const { ErroApi } = require('../middleware/erros');
const { validar, regras, normalizarHora, exigirIntervalo, idParam } = require('../middleware/validar');
const { historico } = require('../models/horas');
const { publico } = require('./auth');

const routes = express.Router();
routes.use(exigirLogin);

const PERFIS = ['ADMINISTRADOR', 'VOLUNTARIO'];
const STATUS = ['ATIVO', 'INATIVO'];
const DIAS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

async function buscarUsuario(id) {
    const [u] = await consulta('SELECT * FROM Usuario WHERE id_usuario = ?', [id]);
    if (!u) throw new ErroApi(404, 'Usuário não encontrado.');
    return u;
}

routes.get('/', exigirAdmin, async (req, res) => {
    const { perfil, status, busca } = req.query;
    const termo = busca ? `%${busca}%` : null;
    const usuarios = await consulta(
        `SELECT * FROM Usuario
         WHERE (? IS NULL OR perfil = ?) AND (? IS NULL OR status = ?) AND (? IS NULL OR nome LIKE ? OR email LIKE ?)
         ORDER BY status, nome`,
        [perfil || null, perfil || null, status || null, status || null, termo, termo, termo]
    );
    res.json(usuarios.map(publico));
});

routes.post('/', exigirAdmin, async (req, res) => {
    validar(req.body, {
        nome: [regras.obrigatorio, regras.texto(100)],
        email: [regras.obrigatorio, regras.email, regras.texto(100)],
        senha: [regras.obrigatorio, regras.minimo(6)],
        perfil: [regras.umDe(PERFIS)],
    });
    const { nome, email, senha, perfil = 'VOLUNTARIO' } = req.body;
    try {
        const r = await consulta(
            'INSERT INTO Usuario (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
            [nome.trim(), email.trim().toLowerCase(), await bcrypt.hash(String(senha), 10), perfil]
        );
        res.status(201).json(publico(await buscarUsuario(r.insertId)));
    } catch (erro) {
        if (erro.code === 'ER_DUP_ENTRY') throw new ErroApi(409, 'Já existe um usuário com este e-mail.');
        throw erro;
    }
});

routes.get('/:id', exigirProprioOuAdmin(), async (req, res) => {
    res.json(publico(await buscarUsuario(idParam(req))));
});

routes.put('/:id', exigirAdmin, async (req, res) => {
    const id = idParam(req);
    const atual = await buscarUsuario(id);
    validar(req.body, {
        nome: [regras.texto(100)],
        email: [regras.email, regras.texto(100)],
        senha: [regras.minimo(6)],
        perfil: [regras.umDe(PERFIS)],
        status: [regras.umDe(STATUS)],
    });
    const { nome, email, senha, perfil, status } = req.body;
    if (id === req.usuario.id_usuario && (status === 'INATIVO' || perfil === 'VOLUNTARIO')) {
        throw new ErroApi(400, 'Você não pode desativar nem rebaixar a sua própria conta.');
    }

    try {
        await consulta(
            'UPDATE Usuario SET nome = ?, email = ?, perfil = ?, status = ?, senha_hash = ? WHERE id_usuario = ?',
            [
                nome?.trim() || atual.nome,
                email?.trim().toLowerCase() || atual.email,
                perfil || atual.perfil,
                status || atual.status,
                senha ? await bcrypt.hash(String(senha), 10) : atual.senha_hash,
                id,
            ]
        );
    } catch (erro) {
        if (erro.code === 'ER_DUP_ENTRY') throw new ErroApi(409, 'Já existe um usuário com este e-mail.');
        throw erro;
    }
    res.json(publico(await buscarUsuario(id)));
});

routes.delete('/:id', exigirAdmin, async (req, res) => {
    const id = idParam(req);
    await buscarUsuario(id);
    if (id === req.usuario.id_usuario) throw new ErroApi(400, 'Você não pode desativar a sua própria conta.');
    await consulta("UPDATE Usuario SET status = 'INATIVO' WHERE id_usuario = ?", [id]);
    res.json(publico(await buscarUsuario(id)));
});

routes.get('/:id/disponibilidade', exigirProprioOuAdmin(), async (req, res) => {
    const id = idParam(req);
    await buscarUsuario(id);
    res.json(await consulta(
        `SELECT id_disponibilidade, dia_semana, TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
                TIME_FORMAT(hora_fim, '%H:%i') AS hora_fim
         FROM Disponibilidade WHERE id_usuario = ?
         ORDER BY FIELD(dia_semana, 'SEG','TER','QUA','QUI','SEX','SAB','DOM'), hora_inicio`,
        [id]
    ));
});

// Corpo: { "horarios": [ { "dia_semana": "SEG", "hora_inicio": "08:00", "hora_fim": "12:00" }, ... ] }
routes.put('/:id/disponibilidade', exigirProprioOuAdmin(), async (req, res) => {
    const id = idParam(req);
    await buscarUsuario(id);
    const horarios = req.body?.horarios;
    if (!Array.isArray(horarios)) throw new ErroApi(400, '"horarios" deve ser uma lista.');

    horarios.forEach((h, i) => {
        validar(h, {
            dia_semana: [regras.obrigatorio, regras.umDe(DIAS)],
            hora_inicio: [regras.obrigatorio, regras.hora],
            hora_fim: [regras.obrigatorio, regras.hora],
        });
        exigirIntervalo(h.hora_inicio, h.hora_fim, `Horário ${i + 1}: `);
    });

    await transacao(async (c) => {
        await consulta('DELETE FROM Disponibilidade WHERE id_usuario = ?', [id], c);
        for (const h of horarios) {
            await consulta(
                'INSERT INTO Disponibilidade (id_usuario, dia_semana, hora_inicio, hora_fim) VALUES (?, ?, ?, ?)',
                [id, h.dia_semana, normalizarHora(h.hora_inicio), normalizarHora(h.hora_fim)], c
            );
        }
    });
    res.json({ status: 'OK', mensagem: 'Disponibilidade salva com sucesso.', total: horarios.length });
});

routes.get('/:id/historico', exigirProprioOuAdmin(), async (req, res) => {
    const id = idParam(req);
    const usuario = await buscarUsuario(id);
    res.json({ usuario: publico(usuario), participacoes: await historico(id) });
});

module.exports = routes;
