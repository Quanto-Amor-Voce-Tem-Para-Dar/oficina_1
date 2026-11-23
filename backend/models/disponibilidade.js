// Quem pode ir em cada turno (RF05 a RF08). Junta as duas fontes de disponibilidade:
//
//   1. Disponibilidade DIGITADA pelo voluntário (tabela Disponibilidade, por dia da semana).
//   2. Google Agenda (só períodos ocupados, sem ler o conteúdo dos compromissos — RNF05),
//      quando a conta do projeto está conectada e o voluntário compartilhou a agenda.
//
// Regra para um voluntário estar ELEGÍVEL num turno:
//   - se ele digitou disponibilidade: o turno precisa caber inteiro num dos horários informados;
//   - se a agenda dele está compartilhada: não pode haver compromisso cruzando o turno;
//   - se ele não digitou nada E não compartilhou a agenda: não é elegível (não há como saber);
//   - não pode já estar em outro turno no mesmo horário numa escala CONFIRMADA.
const { consulta } = require('../db/conexao');
const { loadCalendars, buscarOcupados } = require('./agendas');
const { obterCalendar } = require('../services/google');
const { paraDate, sobrepoe } = require('./bloco');

async function voluntariosAtivos() {
    return consulta(
        `SELECT id_usuario, nome, email, horas_acumuladas FROM Usuario
         WHERE perfil = 'VOLUNTARIO' AND status = 'ATIVO' ORDER BY nome`
    );
}

async function disponibilidadesDigitadas() {
    const linhas = await consulta('SELECT id_usuario, dia_semana, hora_inicio, hora_fim FROM Disponibilidade');
    const porUsuario = {};
    for (const l of linhas) (porUsuario[l.id_usuario] = porUsuario[l.id_usuario] || []).push(l);
    return porUsuario;
}

// Turnos já atribuídos em escalas confirmadas (para não escalar a mesma pessoa em dois lugares).
async function compromissosConfirmados(idEscalaIgnorar = null) {
    const linhas = await consulta(
        `SELECT a.id_usuario, t.data, t.hora_inicio, t.hora_fim
         FROM AtribuicaoTurno a
         JOIN Escala e ON e.id_escala = a.id_escala AND e.status = 'CONFIRMADA'
         JOIN Turno t ON t.id_turno = a.id_turno
         WHERE a.status_presenca <> 'AUSENTE' AND (? IS NULL OR e.id_escala <> ?)`,
        [idEscalaIgnorar, idEscalaIgnorar]
    );
    const porUsuario = {};
    for (const l of linhas) {
        (porUsuario[l.id_usuario] = porUsuario[l.id_usuario] || []).push({
            inicio: paraDate(l.data, l.hora_inicio),
            fim: paraDate(l.data, l.hora_fim),
        });
    }
    return porUsuario;
}

// Consulta o Google Agenda. Devolve { email: [{inicio, fim}] | null } só para quem
// compartilhou a agenda, e avisos caso a consulta não seja possível.
async function ocupadosNoGoogle(voluntarios, blocos) {
    const avisos = [];
    let calendar;
    try {
        calendar = await obterCalendar();
    } catch (erro) {
        avisos.push(`Google Agenda indisponível (${erro.message}). Usando só a disponibilidade digitada.`);
        return { ocupados: {}, avisos };
    }
    if (!calendar || blocos.length === 0) return { ocupados: {}, avisos };

    try {
        const agendas = await loadCalendars(calendar);
        const emails = voluntarios.map((v) => v.email.toLowerCase());
        const compartilhadas = Object.keys(agendas).filter((id) => emails.includes(id.toLowerCase()));
        if (compartilhadas.length === 0) return { ocupados: {}, avisos };

        const timeMin = new Date(Math.min(...blocos.map((b) => b.inicio))).toISOString();
        const timeMax = new Date(Math.max(...blocos.map((b) => b.fim))).toISOString();
        const busy = await buscarOcupados(calendar, compartilhadas, timeMin, timeMax);

        const ocupados = {};
        for (const [id, periodos] of Object.entries(busy)) {
            ocupados[id.toLowerCase()] = periodos === null
                ? null
                : periodos.map((p) => ({ inicio: new Date(p.start), fim: new Date(p.end) }));
        }
        return { ocupados, avisos };
    } catch (erro) {
        if (String(erro.message).includes('invalid_grant')) {
            avisos.push('O acesso ao Google Agenda expirou. Reconecte a conta do projeto em Configurações. Usando só a disponibilidade digitada.');
        } else {
            avisos.push(`Não foi possível consultar o Google Agenda (${erro.message}). Usando só a disponibilidade digitada.`);
        }
        return { ocupados: {}, avisos };
    }
}

function cabeNaDisponibilidade(bloco, horarios) {
    return horarios.some((h) =>
        h.dia_semana === bloco.diaSemana &&
        paraDate(bloco.data, h.hora_inicio) <= bloco.inicio &&
        paraDate(bloco.data, h.hora_fim) >= bloco.fim
    );
}

// Para cada bloco, lista os ids dos voluntários elegíveis. Também devolve os motivos
// de inelegibilidade (útil para o admin entender por que uma vaga ficou vazia).
async function calcularElegiveis(blocos, { idEscalaIgnorar = null } = {}) {
    const voluntarios = await voluntariosAtivos();
    const digitadas = await disponibilidadesDigitadas();
    const confirmados = await compromissosConfirmados(idEscalaIgnorar);
    const { ocupados, avisos } = await ocupadosNoGoogle(voluntarios, blocos);

    const elegiveis = {};
    for (const bloco of blocos) {
        elegiveis[bloco.id] = voluntarios
            .filter((v) => {
                const horarios = digitadas[v.id_usuario] || [];
                const email = v.email.toLowerCase();
                const temAgenda = email in ocupados;
                const agendaLegivel = temAgenda && ocupados[email] !== null;

                if (horarios.length === 0 && !agendaLegivel) return false;
                if (horarios.length > 0 && !cabeNaDisponibilidade(bloco, horarios)) return false;
                if (agendaLegivel && ocupados[email].some((p) => sobrepoe(bloco.inicio, bloco.fim, p.inicio, p.fim))) {
                    return false;
                }
                if ((confirmados[v.id_usuario] || []).some((c) => sobrepoe(bloco.inicio, bloco.fim, c.inicio, c.fim))) {
                    return false;
                }
                return true;
            })
            .map((v) => v.id_usuario);
    }

    const usaramGoogle = Object.keys(ocupados).length;
    return { voluntarios, elegiveis, avisos, usaramGoogle };
}

module.exports = { calcularElegiveis, voluntariosAtivos };
