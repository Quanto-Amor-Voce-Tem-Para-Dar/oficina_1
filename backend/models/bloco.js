// Bloco = um turno pronto para a distribuição (início/fim como Date, vagas e peso em horas).
const { FUSO } = require('../config');

const DIAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

// "2026-11-28" + "08:00:00" -> Date no horário de Brasília
const paraDate = (data, hora) => new Date(`${data}T${String(hora).slice(0, 8).padEnd(8, ':00')}${FUSO}`);

// Dia da semana de uma data ("2026-11-28" -> "SAB"), sem depender do fuso do servidor.
const diaDaSemana = (data) => DIAS[new Date(`${data}T12:00:00Z`).getUTCDay()];

function turnoParaBloco(turno) {
    const inicio = paraDate(turno.data, turno.hora_inicio);
    const fim = paraDate(turno.data, turno.hora_fim);
    return {
        id: turno.id_turno,
        turno,
        data: turno.data,
        diaSemana: diaDaSemana(turno.data),
        inicio,
        fim,
        vagas: Number(turno.qtd_voluntarios_necessaria),
        // Peso do bloco = duração em horas (antes eram "pontos"; a equidade agora é por horas)
        pontos: (fim - inicio) / 3600000,
        alocados: [],
    };
}

function sobrepoe(aIni, aFim, bIni, bFim) {
    return aIni < bFim && bIni < aFim;
}

module.exports = { DIAS, paraDate, diaDaSemana, turnoParaBloco, sobrepoe };
