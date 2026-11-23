// Horas (RF18), painel, notificações, auditoria e conexão com o Google Calendar.
//   GET    /api/horas                    admin: todos os voluntários | voluntário: as suas
//   GET    /api/painel                   (admin) números da tela inicial
//   GET    /api/notificacoes             admin: todas | voluntário: as suas
//   GET    /api/auditoria                (admin) últimas operações
//   GET    /api/google/status            (admin) a conta do projeto está conectada?
//   GET    /api/google/conectar          (admin) devolve a URL de login do Google
//   GET    /api/google/oauth2callback    (Google redireciona para cá)
//   DELETE /api/google                   (admin) desconecta
const express = require('express');
const jwt = require('jsonwebtoken');
const { consulta } = require('../db/conexao');
const { exigirLogin, exigirAdmin, ehAdmin } = require('../middleware/autenticacao');
const { ErroApi } = require('../middleware/erros');
const { historico } = require('../models/horas');
const google = require('../services/google');
const auditoria = require('../services/auditoria');
const cfg = require('../config');

const routes = express.Router();

// ---------- Google (o callback é público: quem chega é o navegador vindo do Google) ----------
routes.get('/google/oauth2callback', async (req, res) => {
    const voltar = (resultado) => res.redirect(`${cfg.FRONTEND_URL}/admin/configuracoes?google=${resultado}`);
    const { code, state, error } = req.query;
    if (error || !code) return voltar('cancelado');

    let dados;
    try {
        dados = jwt.verify(String(state), cfg.JWT_SECRET);
    } catch {
        return voltar('expirado');
    }
    if (dados.finalidade !== 'google') return voltar('expirado');

    try {
        await google.concluirLogin(String(code));
        await auditoria.registrar({ usuario: { id_usuario: dados.id }, operacao: 'CONECTAR', entidade: 'IntegracaoGoogle' });
        return voltar('ok');
    } catch (erro) {
        console.error('Erro ao conectar o Google:', erro.message);
        return voltar('erro');
    }
});

routes.use(exigirLogin);

routes.get('/google/status', exigirAdmin, async (req, res) => {
    res.json(await google.status());
});

routes.get('/google/conectar', exigirAdmin, async (req, res) => {
    // "state" assinado: o callback sabe que o pedido veio de um admin logado (e expira em 10 min)
    const state = jwt.sign({ id: req.usuario.id_usuario, finalidade: 'google' }, cfg.JWT_SECRET, { expiresIn: '10m' });
    const url = google.gerarUrlDeLogin(state);
    if (!url) {
        throw new ErroApi(400, 'Credenciais do Google não configuradas no servidor (GOOGLE_CLIENT_ID/SECRET ou credentials.json).');
    }
    res.json({ url });
});

routes.delete('/google', exigirAdmin, async (req, res) => {
    await google.desconectar();
    await auditoria.registrar({ usuario: req.usuario, operacao: 'DESCONECTAR', entidade: 'IntegracaoGoogle' });
    res.json({ status: 'OK', mensagem: 'Google Agenda desconectado.' });
});

// ---------- Horas ----------
routes.get('/horas', async (req, res) => {
    if (!ehAdmin(req.usuario)) {
        const [eu] = await consulta('SELECT horas_acumuladas FROM Usuario WHERE id_usuario = ?', [req.usuario.id_usuario]);
        return res.json({ horas_acumuladas: eu.horas_acumuladas, participacoes: await historico(req.usuario.id_usuario) });
    }
    res.json(await consulta(
        `SELECT u.id_usuario, u.nome, u.email, u.status, u.horas_acumuladas,
                (SELECT COUNT(*) FROM AtribuicaoTurno a JOIN Escala e ON e.id_escala = a.id_escala AND e.status = 'CONFIRMADA'
                 WHERE a.id_usuario = u.id_usuario AND a.status_presenca <> 'AUSENTE') AS total_turnos,
                (SELECT COUNT(*) FROM AtribuicaoTurno a JOIN Escala e ON e.id_escala = a.id_escala AND e.status = 'CONFIRMADA'
                 WHERE a.id_usuario = u.id_usuario AND a.status_presenca = 'AUSENTE') AS total_ausencias
         FROM Usuario u WHERE u.perfil = 'VOLUNTARIO'
         ORDER BY u.status, u.horas_acumuladas DESC, u.nome`
    ));
});

// ---------- Painel do admin ----------
routes.get('/painel', exigirAdmin, async (req, res) => {
    const [[numeros], turnosPendentes, proximasAcoes] = await Promise.all([
        consulta(
            `SELECT
                (SELECT COUNT(*) FROM Usuario WHERE perfil = 'VOLUNTARIO' AND status = 'ATIVO') AS voluntarios_ativos,
                (SELECT COUNT(*) FROM Acao WHERE status IN ('PLANEJADA', 'EM_ANDAMENTO')) AS acoes_ativas,
                (SELECT COALESCE(SUM(horas_acumuladas), 0) FROM Usuario WHERE perfil = 'VOLUNTARIO') AS horas_registradas,
                (SELECT COUNT(*) FROM SolicitacaoTroca WHERE status = 'PENDENTE') AS trocas_pendentes,
                (SELECT COUNT(*) FROM Escala WHERE status = 'PROPOSTA') AS escalas_para_revisar`
        ),
        // Turnos futuros com vagas em aberto (sem escala, ou com escala sem gente suficiente)
        consulta(
            `SELECT t.id_turno, t.id_acao, ac.nome AS acao, t.data, TIME_FORMAT(t.hora_inicio, '%H:%i') AS hora_inicio,
                    TIME_FORMAT(t.hora_fim, '%H:%i') AS hora_fim, t.qtd_voluntarios_necessaria,
                    (SELECT COUNT(*) FROM AtribuicaoTurno a JOIN Escala e ON e.id_escala = a.id_escala AND e.status = 'CONFIRMADA'
                     WHERE a.id_turno = t.id_turno AND a.status_presenca <> 'AUSENTE') AS preenchidas
             FROM Turno t JOIN Acao ac ON ac.id_acao = t.id_acao
             WHERE t.data >= CURDATE() AND ac.status IN ('PLANEJADA', 'EM_ANDAMENTO')
             HAVING preenchidas < t.qtd_voluntarios_necessaria
             ORDER BY t.data, t.hora_inicio LIMIT 10`
        ),
        consulta(
            `SELECT ac.id_acao, ac.nome, ac.status, MIN(t.data) AS proxima_data
             FROM Acao ac JOIN Turno t ON t.id_acao = ac.id_acao
             WHERE t.data >= CURDATE() AND ac.status IN ('PLANEJADA', 'EM_ANDAMENTO')
             GROUP BY ac.id_acao ORDER BY proxima_data LIMIT 5`
        ),
    ]);
    res.json({ ...numeros, turnos_pendentes: turnosPendentes, proximas_acoes: proximasAcoes });
});

// ---------- Notificações e auditoria ----------
routes.get('/notificacoes', async (req, res) => {
    const admin = ehAdmin(req.usuario);
    res.json(await consulta(
        `SELECT n.*, u.nome, u.email FROM Notificacao n JOIN Usuario u ON u.id_usuario = n.id_usuario
         WHERE (? OR n.id_usuario = ?) ORDER BY n.data_envio DESC LIMIT 100`,
        [admin, req.usuario.id_usuario]
    ));
});

routes.get('/auditoria', exigirAdmin, async (req, res) => {
    res.json(await consulta(
        `SELECT l.*, u.nome FROM LogAuditoria l LEFT JOIN Usuario u ON u.id_usuario = l.id_usuario
         ORDER BY l.id_log DESC LIMIT 200`
    ));
});

// Diagnóstico rápido do servidor (útil na Vercel)
routes.get('/config/status', exigirAdmin, async (req, res) => {
    res.json({ smtp: cfg.smtpConfigurado(), google: await google.status() });
});

module.exports = routes;
