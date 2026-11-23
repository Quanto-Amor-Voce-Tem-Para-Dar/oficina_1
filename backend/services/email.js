// Envio de e-mails por SMTP (Gmail) e registro na tabela Notificacao (RF16).
// Se o SMTP não estiver configurado, a notificação é registrada como FALHA e o sistema segue.
const nodemailer = require('nodemailer');
const cfg = require('../config');
const { consulta } = require('../db/conexao');

let transporte;
function obterTransporte() {
    if (!transporte) {
        transporte = nodemailer.createTransport({
            host: cfg.SMTP_HOST,
            port: cfg.SMTP_PORTA,
            secure: cfg.SMTP_PORTA === 465,
            auth: { user: cfg.SMTP_USUARIO, pass: cfg.SMTP_SENHA },
        });
    }
    return transporte;
}

// Envia um e-mail. Devolve true se foi, false se falhou (nunca lança erro).
async function enviarEmail(para, assunto, texto) {
    if (!cfg.smtpConfigurado()) {
        console.warn(`[e-mail] SMTP não configurado. Não enviado para ${para}: ${assunto}`);
        return false;
    }
    try {
        await obterTransporte().sendMail({
            from: cfg.SMTP_REMETENTE || `Quanto Amor Você Tem Para Dar? <${cfg.SMTP_USUARIO}>`,
            to: para,
            subject: assunto,
            text: texto,
        });
        return true;
    } catch (erro) {
        console.error(`[e-mail] Falha ao enviar para ${para}:`, erro.message);
        return false;
    }
}

// Envia para um usuário e grava em Notificacao (tipo: ESCALA_CONFIRMADA | TROCA_ANALISADA).
async function notificarUsuario(usuario, tipoEvento, assunto, mensagem) {
    const enviado = await enviarEmail(usuario.email, assunto, mensagem);
    await consulta(
        'INSERT INTO Notificacao (id_usuario, mensagem, tipo_evento, status_envio) VALUES (?, ?, ?, ?)',
        [usuario.id_usuario, mensagem, tipoEvento, enviado ? 'ENVIADO' : 'FALHA']
    );
    return enviado;
}

// Avisa todos os administradores ativos (vagas não preenchidas, desistências...).
// Não grava em Notificacao porque o ENUM do modelo só prevê os dois eventos dos voluntários.
async function avisarAdministradores(assunto, texto) {
    const admins = await consulta(
        "SELECT email FROM Usuario WHERE perfil = 'ADMINISTRADOR' AND status = 'ATIVO'"
    );
    await Promise.all(admins.map((a) => enviarEmail(a.email, assunto, texto)));
}

module.exports = { enviarEmail, notificarUsuario, avisarAdministradores };
