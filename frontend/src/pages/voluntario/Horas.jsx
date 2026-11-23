import React, { useMemo } from 'react'
import { Clock } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useApp } from '../../context/AppContext'
import { totalHoursFor, upcomingShiftsFor } from '../../utils/schedule'
import { formatDateBR, durationHours } from '../../utils/date'

export default function VolHoras() {
  const { currentVolunteer, actions, schedules } = useApp()
  const total = totalHoursFor(currentVolunteer.id, currentVolunteer, actions, schedules)

  const confirmedShifts = useMemo(
    () => upcomingShiftsFor(currentVolunteer.id, actions, schedules).filter((s) => s.status === 'Confirmado'),
    [currentVolunteer, actions, schedules],
  )

  return (
    <div>
      <PageHeader icon={Clock} title="Horas" subtitle="Seu histórico de horas de voluntariado." />

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <p className="text-[13px] text-slate-500">Total no semestre</p>
        <p className="text-[26px] font-bold text-navy-900">{total}h</p>
        <p className="mt-1 text-[12.5px] text-slate-400">
          Inclui {currentVolunteer.historicalHours}h registradas antes do sistema entrar em uso.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[15px] font-bold text-navy-900">Turnos confirmados</h2>
        </div>
        {confirmedShifts.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13.5px] text-slate-500">Nenhum turno confirmado ainda.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {confirmedShifts.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 text-[13.5px]">
                <div>
                  <p className="font-medium text-navy-900">{s.label}</p>
                  <p className="text-[12.5px] text-slate-500">
                    {formatDateBR(s.date)} · {s.actionTitle}
                  </p>
                </div>
                <span className="font-semibold text-navy-900">{durationHours(s.start, s.end)}h</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
