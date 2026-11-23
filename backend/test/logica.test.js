// Testes da lógica que não depende do banco:  npm test
const test = require('node:test');
const assert = require('node:assert');
process.env.JWT_SECRET = 'teste';
const { turnoParaBloco, diaDaSemana, sobrepoe } = require('../models/bloco');
const { distribuir } = require('../models/distribuicao');
const { normalizarHora, validar } = require('../middleware/validar');

const turno = (id, data, ini, fim, vagas) =>
    turnoParaBloco({ id_turno: id, data, hora_inicio: ini, hora_fim: fim, qtd_voluntarios_necessaria: vagas });

test('dia da semana não depende do fuso do servidor', () => {
    assert.strictEqual(diaDaSemana('2026-11-28'), 'SAB');
    assert.strictEqual(diaDaSemana('2026-11-23'), 'SEG');
});

test('bloco tem o peso em horas', () => {
    const b = turno(1, '2026-11-28', '08:00:00', '10:30:00', 2);
    assert.strictEqual(b.pontos, 2.5);
    assert.strictEqual(b.inicio.toISOString(), '2026-11-28T11:00:00.000Z'); // 08:00 em Brasília
});

test('sobreposição de horários', () => {
    const a = turno(1, '2026-11-28', '08:00', '10:00', 1);
    const b = turno(2, '2026-11-28', '10:00', '12:00', 1);
    const c = turno(3, '2026-11-28', '09:00', '11:00', 1);
    assert.strictEqual(sobrepoe(a.inicio, a.fim, b.inicio, b.fim), false);
    assert.strictEqual(sobrepoe(a.inicio, a.fim, c.inicio, c.fim), true);
});

test('distribuição prioriza quem tem menos horas e não choca horários', () => {
    const blocos = [turno(1, '2026-11-28', '08:00', '10:00', 1), turno(2, '2026-11-28', '09:00', '11:00', 1)];
    const elegiveis = { 1: [10, 20], 2: [10, 20] };
    distribuir(blocos, elegiveis, { 10: 5, 20: 0 });
    const todos = blocos.flatMap((b) => b.alocados);
    assert.strictEqual(new Set(todos).size, 2, 'ninguém em dois turnos que se cruzam');
    assert.ok(blocos.every((b) => b.alocados.length === 1));
});

test('vaga sem elegível fica em aberto', () => {
    const blocos = [turno(1, '2026-11-28', '08:00', '10:00', 2)];
    distribuir(blocos, { 1: [10] }, {});
    assert.deepStrictEqual(blocos[0].alocados, [10]);
});

test('validação de horas e mensagens', () => {
    assert.strictEqual(normalizarHora('8:00'), '08:00');
    assert.strictEqual(normalizarHora('08:00:00'), '08:00');
    assert.throws(() => validar({ hora: '25:00' }, { hora: [require('../middleware/validar').regras.hora] }), /Dados inválidos/);
});
