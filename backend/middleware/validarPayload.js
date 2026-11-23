const { MINUTOS_POR_PONTO_ACEITOS } = require('../models/bloco');

// Confere se o JSON recebido tem o formato esperado. Retorna a lista de erros (vazia = ok).
function listarErrosDoPayload(payload) {
    const erros = [];
    if (!payload || !Array.isArray(payload.cronograma) || payload.cronograma.length === 0) {
        return ['"cronograma" deve ser uma lista com pelo menos um dia.'];
    }

    if (payload.pontuacao !== undefined &&
        !MINUTOS_POR_PONTO_ACEITOS.includes(payload.pontuacao?.minutosPorPonto)) {
        erros.push('"pontuacao.minutosPorPonto" deve ser 60 (1 ponto por hora) ou 30 (1 ponto a cada 30 minutos).');
    }

    payload.cronograma.forEach((dia, d) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dia.data || '')) {
            erros.push(`cronograma[${d}].data deve estar no formato AAAA-MM-DD.`);
        }
        if (!Array.isArray(dia.horarios) || dia.horarios.length === 0) {
            erros.push(`cronograma[${d}].horarios deve ter pelo menos um horário.`);
            return;
        }
        dia.horarios.forEach((h, i) => {
            const onde = `cronograma[${d}].horarios[${i}]`;
            const inicio = new Date(`${dia.data}T${h.start}`);
            const fim = new Date(`${dia.data}T${h.end}`);
            if (isNaN(inicio) || isNaN(fim)) erros.push(`${onde}: start/end inválidos (ex.: "10:00:00-03:00").`);
            else if (fim <= inicio) erros.push(`${onde}: end deve ser depois de start.`);
            if (!Number.isInteger(Number(h.vagas)) || Number(h.vagas) < 1) {
                erros.push(`${onde}: vagas deve ser um número inteiro maior que 0.`);
            }
        });
    });
    return erros;
}

// Barra a requisição com erro 400 se o payload (req.body) estiver fora do formato.
function validarPayload(req, res, next) {
    const erros = listarErrosDoPayload(req.body);
    if (erros.length) return res.status(400).json({ status: 'ERRO', erros });
    next();
}

module.exports = { validarPayload, listarErrosDoPayload };
