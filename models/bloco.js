// Bloco = uma permanência do cronograma (dia, horário, vagas e quantos pontos vale).

// A regra de pontuação é escolhida no payload: "pontuacao": { "minutosPorPonto": 60 }
// 60 = 1 ponto por hora | 30 = 1 ponto a cada 30 minutos. Sem o campo, vale 1 ponto por hora.
const MINUTOS_POR_PONTO_PADRAO = 60;
const MINUTOS_POR_PONTO_ACEITOS = [30, 60];

function lerMinutosPorPonto(payload) {
    return payload.pontuacao?.minutosPorPonto ?? MINUTOS_POR_PONTO_PADRAO;
}

// Cada unidade começada conta (por hora: 1h50 = 2 pontos), e toda permanência vale pelo menos 1 ponto.
function calcularPontos(minutos, minutosPorPonto) {
    return Math.max(1, Math.ceil(minutos / minutosPorPonto));
}

function achatarBlocos(payload) {
    const blocos = [];
    const minutosPorPonto = lerMinutosPorPonto(payload);

    for (const dia of payload.cronograma) {
        dia.horarios.forEach((h, i) => {
            const inicio = new Date(`${dia.data}T${h.start}`);
            const fim = new Date(`${dia.data}T${h.end}`);
            const minutos = (fim - inicio) / 60000;

            blocos.push({
                id: `${dia.data}#${i}`,
                data: dia.data,
                start: h.start,
                end: h.end,
                inicio,
                fim,
                vagas: Number(h.vagas),
                pontos: calcularPontos(minutos, minutosPorPonto),
                alocados: [],
            });
        });
    }
    return blocos;
}

function sobrepoe(aIni, aFim, bIni, bFim) {
    return aIni < bFim && bIni < aFim;
}

module.exports = { MINUTOS_POR_PONTO_ACEITOS, lerMinutosPorPonto, calcularPontos, achatarBlocos, sobrepoe };