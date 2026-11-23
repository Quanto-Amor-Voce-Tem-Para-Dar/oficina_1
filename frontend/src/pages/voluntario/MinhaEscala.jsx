import React, { useMemo } from 'react'
import { CalendarCheck, MapPin } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { useApp } from '../../context/AppContext'
import { upcomingShiftsFor } from '../../utils/schedule'
import { formatDateLong } from '../../utils/date'

export default function MinhaEscala() {
  const { currentVolunteer, actions, schedules } = useApp()
  const shifts = upcomingShiftsFor(currentVolunteer.id, actions, schedules)

  const grouped = useMemo(() => {
    const map = new Map()
    shifts.forEach((s) => {
      if (!map.has(s.date)) map.set(s.date, [])
      map.get(s.date).push(s)
    })
    return Array.from(map.entries())
  }, [shifts])

  return (
    <div>
      <PageHeader
        icon={CalendarCheck}
        title="Minha Escala"
        subtitle="Confira seus próximos turnos."
      />

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-soft">
          <p className="text-[13.5px] text-slate-500">
            Você ainda não está escalado em nenhum turno. Preencha sua disponibilidade para
            aparecer nas próximas escalas.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, items]) => (
            <div key={date} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <h2 className="text-[14px] font-bold text-navy-900">{formatDateLong(date)}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="text-[13.5px] font-semibold text-navy-900">
                        {s.start} – {s.end} · {s.label}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate-500">
                        <MapPin size={13} /> {s.actionTitle}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
