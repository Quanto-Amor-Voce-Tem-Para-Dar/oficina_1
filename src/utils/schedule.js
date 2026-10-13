import { dayKeyOf, durationHours } from './date'

// Verifica se um voluntário está livre no dia/horário do turno
function isAvailable(volunteer, dayKey, shift) {
  return volunteer.availability.some(
    (a) => a.day === dayKey && a.start <= shift.start && a.end >= shift.end,
  )
}

// Gera (ou regenera) a escala de uma ação numa data, cruzando a
// disponibilidade semanal de cada voluntário com os turnos necessários.
// Retorna { shifts: [{ shiftId, assigned: [ids], status }] }
export function generateSchedule(action, date, volunteers) {
  const dayKey = dayKeyOf(date)
  const usedToday = new Set() // evita escalar a mesma pessoa em 2 turnos no mesmo dia

  const shifts = action.shiftsTemplate.map((shift) => {
    const eligible = volunteers.filter(
      (v) => !usedToday.has(v.id) && isAvailable(v, dayKey, shift),
    )
    const assigned = eligible.slice(0, shift.needed).map((v) => v.id)
    assigned.forEach((id) => usedToday.add(id))
    const status = assigned.length >= shift.needed ? 'Confirmado' : 'Pendente'
    return { shiftId: shift.id, assigned, status }
  })

  return { generatedAt: new Date().toISOString(), shifts }
}

// Calcula o total de horas confirmadas de um voluntário a partir de todas
// as escalas geradas, somado ao histórico anterior ao sistema.
export function totalHoursFor(volunteerId, volunteer, actions, schedules) {
  let hours = volunteer?.historicalHours ?? 0

  Object.entries(schedules).forEach(([key, schedule]) => {
    const [actionId] = key.split('_')
    const action = actions.find((a) => a.id === actionId)
    if (!action) return
    schedule.shifts.forEach((s) => {
      if (s.status !== 'Confirmado' || !s.assigned.includes(volunteerId)) return
      const template = action.shiftsTemplate.find((t) => t.id === s.shiftId)
      if (template) hours += durationHours(template.start, template.end)
    })
  })

  return Math.round(hours * 10) / 10
}

// Lista os próximos turnos confirmados de um voluntário, ordenados por data.
export function upcomingShiftsFor(volunteerId, actions, schedules) {
  const today = new Date().toISOString().slice(0, 10)
  const result = []

  Object.entries(schedules).forEach(([key, schedule]) => {
    const [actionId, date] = key.split('_')
    const action = actions.find((a) => a.id === actionId)
    if (!action) return
    schedule.shifts.forEach((s) => {
      if (!s.assigned.includes(volunteerId)) return
      const template = action.shiftsTemplate.find((t) => t.id === s.shiftId)
      if (!template) return
      result.push({
        date,
        actionTitle: action.title,
        location: action.location,
        start: template.start,
        end: template.end,
        label: template.label,
        status: s.status,
      })
    })
  })

  return result
    .filter((s) => s.date >= today || true) // mantém histórico visível no protótipo
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
}
