// Agendas dos voluntários: quem existe, quando está ocupado e quando está livre para cada bloco.
const { TIMEZONE, IGNORAR_AGENDA_DO_PROJETO } = require('../config');

// Lista as agendas compartilhadas com a conta do projeto.
// Retorna { idDaAgenda: nomeDaAgenda }. O id é o e-mail do voluntário.
async function loadCalendars(calendar) {
    const response = await calendar.calendarList.list({ maxResults: 250 });
    const agendas = {};

    response.data.items.forEach((item) => {
        const summaryLower = (item.summary || '').toLowerCase();
        const idLower = item.id.toLowerCase();

        if (IGNORAR_AGENDA_DO_PROJETO && item.primary) return;

        if (idLower.includes('#holiday@group.v.calendar.google.com') ||
            idLower.includes('contacts@group.v.calendar.google.com') ||
            summaryLower.includes('feriados') ||
            summaryLower.includes('aniversários') ||
            summaryLower.includes('fases da lua')
        ) {
            return;
        }

        agendas[item.id] = item.summary;
    });

    return agendas;
}

// Uma consulta (por lote de 50 agendas) devolve todos os períodos ocupados
// de cada voluntário dentro da janela inteira da escala.
async function buscarOcupados(calendar, ids, timeMin, timeMax) {
    const ocupados = {};

    for (let i = 0; i < ids.length; i += 50) { // limite do Google: 50 agendas por consulta
        const lote = ids.slice(i, i + 50);
        const { data } = await calendar.freebusy.query({
            requestBody: {
                timeMin,
                timeMax,
                timeZone: TIMEZONE,
                items: lote.map((id) => ({ id })),
            },
        });

        for (const id of lote) {
            const c = data.calendars[id];
            // null = não deu para ler a agenda (erro/sem permissão) -> trata como indisponível
            ocupados[id] = !c || c.errors?.length ? null : c.busy;
        }
    }
    return ocupados;
}

module.exports = { loadCalendars, buscarOcupados };
