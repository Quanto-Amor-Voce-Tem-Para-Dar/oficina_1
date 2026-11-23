// Validação dos dados que chegam nas rotas. Junta todos os problemas numa lista só,
// para o front mostrar mensagens claras (RNF02).
const { ErroApi } = require('./erros');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const vazio = (v) => v === undefined || v === null || v === '';

// Cada regra recebe (valor) e devolve a mensagem de erro, ou null se estiver ok.
const regras = {
    obrigatorio: (v) => (vazio(v) ? 'é obrigatório' : null),
    texto: (max) => (v) => (vazio(v) ? null : typeof v !== 'string' ? 'deve ser um texto'
        : v.trim().length > max ? `deve ter no máximo ${max} caracteres` : null),
    email: (v) => (vazio(v) || REGEX_EMAIL.test(v) ? null : 'deve ser um e-mail válido'),
    data: (v) => (vazio(v) || (REGEX_DATA.test(v) && !isNaN(new Date(v))) ? null : 'deve estar no formato AAAA-MM-DD'),
    hora: (v) => (vazio(v) || REGEX_HORA.test(v) ? null : 'deve estar no formato HH:MM'),
    inteiroPositivo: (v) => (vazio(v) || (Number.isInteger(Number(v)) && Number(v) > 0) ? null : 'deve ser um número inteiro maior que 0'),
    umDe: (opcoes) => (v) => (vazio(v) || opcoes.includes(v) ? null : `deve ser um destes: ${opcoes.join(', ')}`),
    minimo: (n) => (v) => (vazio(v) || String(v).length >= n ? null : `deve ter pelo menos ${n} caracteres`),
};

// esquema = { campo: [regra, regra...] }. Lança 400 com a lista de erros.
function validar(dados, esquema) {
    const erros = [];
    for (const [campo, lista] of Object.entries(esquema)) {
        for (const regra of lista) {
            const problema = regra(dados?.[campo]);
            if (problema) {
                erros.push(`"${campo}" ${problema}.`);
                break;
            }
        }
    }
    if (erros.length) throw new ErroApi(400, 'Dados inválidos.', erros);
}

// "8:00", "08:00" ou "08:00:00" -> "08:00"
const normalizarHora = (h) => {
    const [hh, mm] = String(h).split(':');
    return `${hh.padStart(2, '0')}:${mm}`;
};

// Confere que o fim vem depois do início (horas no formato HH:MM).
function exigirIntervalo(inicio, fim, onde = '') {
    if (normalizarHora(fim) <= normalizarHora(inicio)) {
        throw new ErroApi(400, `${onde}O horário de fim deve ser depois do horário de início.`);
    }
}

function idParam(req, nome = 'id') {
    const id = Number(req.params[nome]);
    if (!Number.isInteger(id) || id <= 0) throw new ErroApi(400, `Parâmetro "${nome}" inválido.`);
    return id;
}

module.exports = { validar, regras, normalizarHora, exigirIntervalo, idParam, vazio };
