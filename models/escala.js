// Junta tudo: agendas -> disponibilidade -> distribuição -> pontos -> resposta.
const { achatarBlocos, lerMinutosPorPonto } = require('./bloco');
const { loadCalendars, buscarOcupados, calcularDisponibilidade } = require('./agendas');
const { distribuir } = require('./distribuicao');
const { carregarPontos, salvarPontos } = require('../data/pontos');

// Soma os pontos de cada bloco a quem foi alocado e grava.
// Com gravar = false só calcula (pré-visualização): nada é gravado.
// Por enquanto roda a cada geração de escala (fase de teste, sem confirmação por e-mail).
// Quando o e-mail for integrado, o ponto de quem recusar deve ser removido.
function registrarPontos(blocos, gravar = true) {
    const pontos = carregarPontos();
    for (const bloco of blocos) {
        for (const id of bloco.alocados) {
            pontos[id] = (pontos[id] || 0) + bloco.pontos;
        }
    }
    if (gravar) salvarPontos(pontos);
    return pontos;
}

// Junta tudo: agendas -> disponibilidade -> distribuição -> pontos -> resposta
async function gerarEscala(calendar, payload, gravar = true) {
    const agendas = await loadCalendars(calendar);
    const ids = Object.keys(agendas);

    const blocos = achatarBlocos(payload);

    // Janela total da escala: do início do primeiro bloco ao fim do último
    const timeMin = new Date(Math.min(...blocos.map((b) => b.inicio))).toISOString();
    const timeMax = new Date(Math.max(...blocos.map((b) => b.fim))).toISOString();

    const ocupados = await buscarOcupados(calendar, ids, timeMin, timeMax);
    const disponiveis = calcularDisponibilidade(blocos, ocupados);
    distribuir(blocos, disponiveis, carregarPontos());
    const pontosAcumulados = registrarPontos(blocos, gravar);

    return {
        status: 'SUCESSO',
        pontosGravados: gravar,
        pontuacao: { minutosPorPonto: lerMinutosPorPonto(payload) },
        nomeEscala: payload.nomeEscala,
        escalaGerada: blocos.map((bloco) => ({
            data: bloco.data,
            horarioInicio: bloco.start,
            horarioFim: bloco.end,
            vagasRequeridas: bloco.vagas,
            pontos: bloco.pontos,
            voluntariosAlocados: bloco.alocados,
            alertaFaltaVagas: bloco.alocados.length < bloco.vagas,
        })),
        pontosAcumulados,
    };
}

module.exports = { gerarEscala };
