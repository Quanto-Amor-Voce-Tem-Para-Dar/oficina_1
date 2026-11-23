// Algoritmo que reparte as permanências entre os voluntários livres.
const { MAX_PERMANENCIAS } = require('../config');
const { sobrepoe } = require('./bloco');

function distribuir(blocos, disponiveis, pontosBanco) {
    // Em quantos blocos cada voluntário consegue ir (menos = mais difícil de encaixar)
    const flexibilidade = {};
    for (const bloco of blocos) {
        for (const id of disponiveis[bloco.id]) {
            flexibilidade[id] = (flexibilidade[id] || 0) + 1;
        }
    }

    // Única fonte de verdade: em quais blocos cada voluntário já foi alocado.
    // Daqui saem a quantidade de permanências, os pontos desta escala e o choque de horário.
    const blocosDe = {};
    const qtd = (id) => (blocosDe[id] || []).length;
    const pontosTotais = (id) =>
        (pontosBanco[id] || 0) + (blocosDe[id] || []).reduce((soma, b) => soma + b.pontos, 0);

    // O voluntário pode ir a este bloco? (ignorar = bloco que ele deixaria de fazer, usado nas trocas)
    const podeIr = (id, bloco, ignorar = null) => {
        const outros = (blocosDe[id] || []).filter((o) => o !== ignorar);
        return disponiveis[bloco.id].includes(id) &&
            !bloco.alocados.includes(id) &&
            outros.length < MAX_PERMANENCIAS &&
            !outros.some((o) => sobrepoe(bloco.inicio, bloco.fim, o.inicio, o.fim));
    };

    const alocar = (id, bloco) => {
        bloco.alocados.push(id);
        (blocosDe[id] = blocosDe[id] || []).push(bloco);
    };

    const desalocar = (id, bloco) => {
        bloco.alocados = bloco.alocados.filter((x) => x !== id);
        blocosDe[id] = blocosDe[id].filter((b) => b !== bloco);
    };

    // 1º menos pontos (equidade) | 2º menos opções de horário (encaixar primeiro)
    const porPrioridade = (a, b) =>
        pontosTotais(a) - pontosTotais(b) || flexibilidade[a] - flexibilidade[b];

    const folga = (b) => disponiveis[b.id].length / Math.max(1, b.vagas);

    // 1º os blocos mais pesados (quem tem menos pontos pega as permanências longas)
    // 2º em empate, o mais apertado (poucos candidatos para as vagas) primeiro
    const ordem = [...blocos].sort((a, b) =>
        b.pontos - a.pontos || folga(a) - folga(b)
    );

    // Fases 1 e 2: rodada 1 = cada voluntário no máximo 1 vez. Rodada 2 (e seguintes): só para
    // as vagas que sobraram, permitindo repetir até MAX_PERMANENCIAS.
    for (let limite = 1; limite <= MAX_PERMANENCIAS; limite++) {
        for (const bloco of ordem) {
            while (bloco.alocados.length < bloco.vagas) {
                const candidatos = disponiveis[bloco.id]
                    .filter((id) => qtd(id) < limite && podeIr(id, bloco))
                    .sort(porPrioridade);
                if (candidatos.length === 0) break;
                alocar(candidatos[0], bloco);
            }
        }
    }

    // Fase 3 (reparo): para cada vaga ainda vazia, procura alguém (v) que só não foi porque já
    // estava em outro bloco (x) onde dá para ser substituído por outra pessoa (w).
    // Move v para a vaga vazia e coloca w no lugar dele: ninguém passa do limite e a vaga é preenchida.
    for (const bloco of ordem) {
        while (bloco.alocados.length < bloco.vagas) {
            let resolveu = false;

            for (const v of [...disponiveis[bloco.id]].sort(porPrioridade)) {
                if (bloco.alocados.includes(v)) continue;

                for (const x of [...(blocosDe[v] || [])]) {
                    if (!podeIr(v, bloco, x)) continue;

                    const substitutos = disponiveis[x.id]
                        .filter((w) => w !== v && podeIr(w, x))
                        .sort(porPrioridade);
                    if (substitutos.length === 0) continue;

                    desalocar(v, x);
                    alocar(substitutos[0], x);
                    alocar(v, bloco);
                    resolveu = true;
                    break;
                }
                if (resolveu) break;
            }
            if (!resolveu) break;
        }
    }
}

module.exports = { distribuir };
