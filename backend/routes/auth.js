// POST /api/auth/login   GET /api/auth/eu   PUT /api/auth/senha
const express = require('express');
const bcrypt = require('bcryptjs');
const { consulta } = require('../db/conexao');
const { gerarToken, exigirLogin } = require('../middleware/autenticacao');
const { ErroApi } = require('../middleware/erros');
const { validar, regras } = require('../middleware/validar');

const routes = express.Router();

const publico = (u) => ({
    id_usuario: u.id_usuario, nome: u.nome, email: u.email, perfil: u.perfil, status: u.status,
    horas_acumuladas: u.horas_acumuladas, criado_em: u.criado_em,
});

routes.post('/login', async (req, res) => {
    validar(req.body, { email: [regras.obrigatorio, regras.email], senha: [regras.obrigatorio] });

    const [usuario] = await consulta('SELECT * FROM Usuario WHERE email = ?', [req.body.email.trim().toLowerCase()]);
    const senhaOk = usuario && (await bcrypt.compare(String(req.body.senha), usuario.senha_hash));
    if (!senhaOk) throw new ErroApi(401, 'E-mail ou senha incorretos.');
    if (usuario.status !== 'ATIVO') throw new ErroApi(403, 'Seu cadastro está inativo. Procure a gestão do projeto.');

    res.json({ token: gerarToken(usuario), usuario: publico(usuario) });
});

routes.get('/eu', exigirLogin, async (req, res) => {
    const [usuario] = await consulta('SELECT * FROM Usuario WHERE id_usuario = ?', [req.usuario.id_usuario]);
    res.json(publico(usuario));
});

routes.put('/senha', exigirLogin, async (req, res) => {
    validar(req.body, {
        senhaAtual: [regras.obrigatorio],
        novaSenha: [regras.obrigatorio, regras.minimo(6)],
    });
    const [usuario] = await consulta('SELECT senha_hash FROM Usuario WHERE id_usuario = ?', [req.usuario.id_usuario]);
    if (!(await bcrypt.compare(String(req.body.senhaAtual), usuario.senha_hash))) {
        throw new ErroApi(400, 'Senha atual incorreta.');
    }
    await consulta('UPDATE Usuario SET senha_hash = ? WHERE id_usuario = ?', [
        await bcrypt.hash(String(req.body.novaSenha), 10), req.usuario.id_usuario,
    ]);
    res.json({ status: 'OK', mensagem: 'Senha alterada com sucesso.' });
});

module.exports = { routes, publico };
