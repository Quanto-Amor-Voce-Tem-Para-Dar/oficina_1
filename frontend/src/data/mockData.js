// Dados fictícios para o protótipo. Nenhuma informação real de voluntários.

export const volunteers = [
  {
    id: 'v1',
    name: 'Lucas Alves',
    email: 'lucas.alves@email.com',
    phone: '(43) 99911-2201',
    team: 'Logística',
    joinedAt: '2024-03-11',
    historicalHours: 18,
    availability: [
      { day: 'seg', start: '08:00', end: '12:00' },
      { day: 'ter', start: '13:00', end: '17:00' },
      { day: 'qua', start: '08:00', end: '12:00' },
      { day: 'qui', start: '13:00', end: '17:00' },
      { day: 'sab', start: '08:00', end: '12:00' },
    ],
  },
  {
    id: 'v2',
    name: 'Mariana Costa',
    email: 'mariana.costa@email.com',
    phone: '(43) 99922-3312',
    team: 'Logística',
    joinedAt: '2024-03-11',
    historicalHours: 22,
    availability: [
      { day: 'seg', start: '08:00', end: '12:00' },
      { day: 'qua', start: '08:00', end: '12:00' },
      { day: 'sab', start: '08:00', end: '12:00' },
    ],
  },
  {
    id: 'v3',
    name: 'Gabriel Lima',
    email: 'gabriel.lima@email.com',
    phone: '(43) 99933-4423',
    team: 'Atendimento',
    joinedAt: '2024-05-02',
    historicalHours: 14,
    availability: [
      { day: 'ter', start: '10:00', end: '14:00' },
      { day: 'qui', start: '10:00', end: '14:00' },
      { day: 'sab', start: '10:00', end: '12:00' },
    ],
  },
  {
    id: 'v4',
    name: 'Beatriz Santos',
    email: 'beatriz.santos@email.com',
    phone: '(43) 99944-5534',
    team: 'Atendimento',
    joinedAt: '2024-05-02',
    historicalHours: 16,
    availability: [
      { day: 'seg', start: '10:00', end: '14:00' },
      { day: 'sab', start: '10:00', end: '12:00' },
    ],
  },
  {
    id: 'v5',
    name: 'Camila Rocha',
    email: 'camila.rocha@email.com',
    phone: '(43) 99955-6645',
    team: 'Atendimento',
    joinedAt: '2024-08-19',
    historicalHours: 9,
    availability: [
      { day: 'qua', start: '14:00', end: '18:00' },
      { day: 'sex', start: '14:00', end: '18:00' },
      { day: 'sab', start: '14:00', end: '16:00' },
    ],
  },
  {
    id: 'v6',
    name: 'Pedro Henrique',
    email: 'pedro.henrique@email.com',
    phone: '(43) 99966-7756',
    team: 'Atendimento',
    joinedAt: '2024-08-19',
    historicalHours: 11,
    availability: [
      { day: 'ter', start: '14:00', end: '18:00' },
      { day: 'sab', start: '14:00', end: '16:00' },
    ],
  },
  {
    id: 'v7',
    name: 'Julia Ferreira',
    email: 'julia.ferreira@email.com',
    phone: '(43) 99977-8867',
    team: 'Logística',
    joinedAt: '2025-02-10',
    historicalHours: 4,
    availability: [
      { day: 'qui', start: '16:00', end: '18:00' },
      { day: 'sab', start: '16:00', end: '18:00' },
    ],
  },
  {
    id: 'v8',
    name: 'Matheus Cardoso',
    email: 'matheus.cardoso@email.com',
    phone: '(43) 99988-9978',
    team: 'Logística',
    joinedAt: '2025-02-10',
    historicalHours: 4,
    availability: [
      { day: 'sex', start: '16:00', end: '18:00' },
      { day: 'sab', start: '16:00', end: '18:00' },
    ],
  },
  {
    id: 'v9',
    name: 'Ana Clara Rezende',
    email: 'ana.rezende@email.com',
    phone: '(43) 99900-1189',
    team: 'Apoio',
    joinedAt: '2025-03-04',
    historicalHours: 2,
    availability: [
      { day: 'ter', start: '09:00', end: '12:00' },
      { day: 'sab', start: '12:00', end: '14:00' },
    ],
  },
  {
    id: 'v10',
    name: 'Rafael Souza',
    email: 'rafael.souza@email.com',
    phone: '(43) 99900-2290',
    team: 'Apoio',
    joinedAt: '2025-03-04',
    historicalHours: 2,
    availability: [
      { day: 'qui', start: '09:00', end: '12:00' },
      { day: 'sab', start: '12:00', end: '14:00' },
    ],
  },
]

export const actions = [
  {
    id: 'feira-praca',
    title: 'Feira de Doações – Praça Central',
    location: 'Praça Central',
    dates: ['2025-09-27', '2025-10-04', '2025-10-11'],
    shiftsTemplate: [
      { id: 's1', start: '08:00', end: '10:00', label: 'Montagem do estande', color: 'blue', needed: 2 },
      { id: 's2', start: '10:00', end: '12:00', label: 'Atendimento ao público', color: 'green', needed: 2 },
      { id: 's3', start: '12:00', end: '14:00', label: 'Intervalo / Apoio', color: 'gray', needed: 1 },
      { id: 's4', start: '14:00', end: '16:00', label: 'Atendimento ao público', color: 'green', needed: 2 },
      { id: 's5', start: '16:00', end: '18:00', label: 'Desmontagem do estande', color: 'violet', needed: 2 },
    ],
  },
  {
    id: 'oficina-reciclagem',
    title: 'Oficina de Reciclagem – Escola Municipal',
    location: 'Escola Municipal',
    dates: ['2025-09-20', '2025-10-18'],
    shiftsTemplate: [
      { id: 'o1', start: '09:00', end: '12:00', label: 'Preparação de materiais', color: 'blue', needed: 1 },
      { id: 'o2', start: '10:00', end: '14:00', label: 'Oficina com turma A', color: 'green', needed: 1 },
      { id: 'o3', start: '09:00', end: '12:00', label: 'Oficina com turma B', color: 'green', needed: 1 },
    ],
  },
]

// Escalas já geradas anteriormente (estado inicial do protótipo).
// Chave: `${actionId}_${date}`
export const initialSchedules = {
  'feira-praca_2025-09-27': {
    generatedAt: '2025-09-15T14:20:00',
    shifts: [
      { shiftId: 's1', assigned: ['v1', 'v2'], status: 'Confirmado' },
      { shiftId: 's2', assigned: ['v3', 'v4'], status: 'Confirmado' },
      { shiftId: 's3', assigned: [], status: 'Pendente' },
      { shiftId: 's4', assigned: ['v5', 'v6'], status: 'Confirmado' },
      { shiftId: 's5', assigned: ['v7', 'v8'], status: 'Confirmado' },
    ],
  },
}
