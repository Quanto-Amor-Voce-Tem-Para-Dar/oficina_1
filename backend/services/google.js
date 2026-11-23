// Integração com o Google Calendar pela conta do projeto (RF06, RNF11).
// O token fica no banco (tabela IntegracaoGoogle), criptografado (RNF04), em vez do token.json.
const fs = require('fs');
const crypto = require('crypto');
const { google } = require('googleapis');
const cfg = require('../config');
const { consulta } = require('../db/conexao');

// ---------- Criptografia do token (AES-256-GCM, chave derivada do JWT_SECRET) ----------
const chave = () => crypto.createHash('sha256').update(`google-token:${cfg.JWT_SECRET}`).digest();

function cifrar(texto) {
    const iv = crypto.randomBytes(12);
    const cifra = crypto.createCipheriv('aes-256-gcm', chave(), iv);
    const dados = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()]);
    return [iv, cifra.getAuthTag(), dados].map((b) => b.toString('base64')).join('.');
}

function decifrar(guardado) {
    const [iv, tag, dados] = guardado.split('.').map((p) => Buffer.from(p, 'base64'));
    const decifra = crypto.createDecipheriv('aes-256-gcm', chave(), iv);
    decifra.setAuthTag(tag);
    return Buffer.concat([decifra.update(dados), decifra.final()]).toString('utf8');
}

// ---------- Cliente OAuth ----------
// Credenciais vêm das variáveis GOOGLE_CLIENT_ID/SECRET ou do credentials.json.
function criarClienteOAuth() {
    let id = cfg.GOOGLE_CLIENT_ID;
    let segredo = cfg.GOOGLE_CLIENT_SECRET;
    let redirect = cfg.GOOGLE_REDIRECT_URI;

    if (!id && fs.existsSync(cfg.CREDENTIALS_PATH)) {
        const chaves = JSON.parse(fs.readFileSync(cfg.CREDENTIALS_PATH, 'utf8'));
        const dados = chaves.web || chaves.installed;
        if (!dados) throw new Error('Formato inválido em credentials.json (esperado "web" ou "installed").');
        id = dados.client_id;
        segredo = dados.client_secret;
        redirect = redirect || dados.redirect_uris?.[0];
    }
    if (!id || !segredo) return null;
    if (!redirect) throw new Error('Defina GOOGLE_REDIRECT_URI no .env (ex.: http://localhost:3000/api/google/oauth2callback).');

    return new google.auth.OAuth2(id, segredo, redirect);
}

function gerarUrlDeLogin(state) {
    const cliente = criarClienteOAuth();
    if (!cliente) return null;
    return cliente.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: cfg.SCOPES, state });
}

async function lerTokens() {
    const [linha] = await consulta('SELECT tokens, conta_email, atualizado_em FROM IntegracaoGoogle WHERE id = 1');
    if (!linha) return null;
    try {
        return { tokens: JSON.parse(decifrar(linha.tokens)), contaEmail: linha.conta_email, atualizadoEm: linha.atualizado_em };
    } catch {
        return null; // JWT_SECRET mudou: precisa conectar de novo
    }
}

async function salvarTokens(tokens, contaEmail) {
    await consulta(
        `INSERT INTO IntegracaoGoogle (id, tokens, conta_email) VALUES (1, ?, ?)
         ON DUPLICATE KEY UPDATE tokens = VALUES(tokens), conta_email = COALESCE(VALUES(conta_email), conta_email)`,
        [cifrar(JSON.stringify(tokens)), contaEmail ?? null]
    );
}

// Troca o código do callback pelo token e guarda no banco.
async function concluirLogin(code) {
    const cliente = criarClienteOAuth();
    const { tokens } = await cliente.getToken(code);
    cliente.setCredentials(tokens);

    // Descobre qual conta foi conectada (a agenda principal tem o id = e-mail da conta)
    let contaEmail = null;
    try {
        const { data } = await google.calendar({ version: 'v3', auth: cliente }).calendars.get({ calendarId: 'primary' });
        contaEmail = data.id;
    } catch { /* não é essencial */ }

    await salvarTokens(tokens, contaEmail);
}

// Devolve o cliente do Calendar pronto para uso, ou null se o Google não estiver conectado.
// O token vence em 1h, mas com o refresh_token a biblioteca renova sozinha (e salvamos o novo).
async function obterCalendar() {
    const salvo = await lerTokens();
    if (!salvo) return null;
    const cliente = criarClienteOAuth();
    if (!cliente) return null;

    cliente.setCredentials(salvo.tokens);
    cliente.on('tokens', (novos) => {
        salvarTokens({ ...salvo.tokens, ...novos }).catch((e) => console.error('Erro ao salvar token renovado:', e.message));
    });
    return google.calendar({ version: 'v3', auth: cliente });
}

async function status() {
    const salvo = await lerTokens();
    let conectado = false;
    if (salvo) {
        try {
            const cliente = criarClienteOAuth();
            if (cliente) {
                cliente.setCredentials(salvo.tokens);
                await cliente.getAccessToken();
                conectado = true;
            }
        } catch { /* refresh_token vencido ou revogado */ }
    }
    return {
        configurado: cfg.googleConfigurado(),
        conectado,
        contaEmail: salvo?.contaEmail || null,
        atualizadoEm: salvo?.atualizadoEm || null,
    };
}

async function desconectar() {
    await consulta('DELETE FROM IntegracaoGoogle WHERE id = 1');
}

module.exports = { gerarUrlDeLogin, concluirLogin, obterCalendar, status, desconectar };
