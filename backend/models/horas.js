// Horas acumuladas (RF17, RF18). Também são a base da distribuição equilibrada das escalas
// (no lugar dos "pontos" do protótipo): quem tem menos horas tem prioridade.
//
// Regra: horas_acumuladas = soma das horas dos turnos em escalas CONFIRMADAS,
// exceto quando a presença foi marcada como AUSENTE.
// É sempre recalculada a partir das atribuições, então nunca fica fora de sincronia.
const { consulta } = require('../db/conexao');

const SQL_SOMA = `
    SELECT COALESCE(SUM(TIME_TO_SEC(TIMEDIFF(t.hora_fim, t.hora_inicio))) / 3600, 0)
    FROM AtribuicaoTurno a
    JOIN Escala e ON e.id_escala = a.id_escala AND e.status = 'CONFIRMADA'
    JOIN Turno t ON t.id_turno = a.id_turno
    WHERE a.id_usuario = u.id_usuario AND a.status_presenca <> 'AUSENTE'`;

// Recalcula para os usuários informados (ou para todos, se a lista vier vazia/nula).
async function recalcularHoras(idsUsuarios = null, conexao = null) {
    if (Array.isArray(idsUsuarios) && idsUsuarios.length === 0) return;
    const filtro = idsUsuarios ? 'WHERE u.id_usuario IN (?)' : '';
    await consulta(
        `UPDATE Usuario u SET horas_acumuladas = (${SQL_SOMA}) ${filtro}`,
        idsUsuarios ? [idsUsuarios] : [],
        conexao
    );
}

// Histórico de participação de um voluntário (RF17).
async function historico(idUsuario) {
    return consulta(
        `SELECT a.id_atribuicao, a.status_presenca, e.id_escala, e.status AS status_escala,
                ac.id_acao, ac.nome AS acao, t.id_turno, t.data, t.hora_inicio, t.hora_fim,
                ROUND(TIME_TO_SEC(TIMEDIFF(t.hora_fim, t.hora_inicio)) / 3600, 2) AS horas
         FROM AtribuicaoTurno a
         JOIN Escala e ON e.id_escala = a.id_escala AND e.status = 'CONFIRMADA'
         JOIN Turno t ON t.id_turno = a.id_turno
         JOIN Acao ac ON ac.id_acao = t.id_acao
         WHERE a.id_usuario = ?
         ORDER BY t.data DESC, t.hora_inicio DESC`,
        [idUsuario]
    );
}

module.exports = { recalcularHoras, historico };
