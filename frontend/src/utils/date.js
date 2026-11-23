export const DAY_KEYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']

export const DAY_LABELS = {
  SEG: 'Segunda-feira',
  TER: 'Terça-feira',
  QUA: 'Quarta-feira',
  QUI: 'Quinta-feira',
  SEX: 'Sexta-feira',
  SAB: 'Sábado',
  DOM: 'Domingo',
}

export const DAYS_ORDERED = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map((key) => ({
  key,
  label: DAY_LABELS[key],
}))

// 'YYYY-MM-DD' -> 'SAB'
export function dayKeyOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return DAY_KEYS[new Date(y, m - 1, d).getDay()]
}

export function formatDateBR(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

export function formatDateLong(dateStr) {
  return `${DAY_LABELS[dayKeyOf(dateStr)]}, ${formatDateBR(dateStr)}`
}

// '2026-11-23 10:53:20' -> '23/11/2026 às 10:53'
export function formatDateTime(dt) {
  if (!dt) return '—'
  return `${formatDateBR(dt)} às ${dt.slice(11, 16)}`
}

// '08:00:00' -> '08:00'
export const hhmm = (h) => (h ? String(h).slice(0, 5) : '')

export function durationHours(start, end) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em - (sh * 60 + sm)) / 60
}

export const formatHours = (h) => `${Math.round(Number(h || 0) * 10) / 10}h`

export function hojeISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const iniciais = (nome = '') =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
