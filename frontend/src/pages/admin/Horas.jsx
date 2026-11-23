import React, { useMemo } from 'react'
import { Clock } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useApp } from '../../context/AppContext'
import { totalHoursFor } from '../../utils/schedule'

export default function AdminHoras() {
  const { volunteers, actions, schedules } = useApp()

  const rows = useMemo(
    () =>
      volunteers
        .map((v) => ({ v, hours: totalHoursFor(v.id, v, actions, schedules) }))
        .sort((a, b) => b.hours - a.hours),
    [volunteers, actions, schedules],
  )

  const maxHours = Math.max(...rows.map((r) => r.hours), 1)
  const total = rows.reduce((sum, r) => sum + r.hours, 0)

  return (
    <div>
      <PageHeader
        icon={Clock}
        title="Horas"
        subtitle="Total de horas de voluntariado registradas por membro no semestre."
      />

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <p className="text-[13px] text-slate-500">Total acumulado pela equipe</p>
        <p className="text-[26px] font-bold text-navy-900">{Math.round(total * 10) / 10}h</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="divide-y divide-slate-100">
          {rows.map(({ v, hours }) => (
            <div key={v.id} className="flex items-center gap-4 px-5 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-[12px] font-semibold text-brand-700">
                {v.name
                  .split(' ')
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')}
              </span>
              <div className="w-40 shrink-0 text-[13.5px] font-medium text-navy-900">{v.name}</div>
              <div className="hidden flex-1 sm:block">
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-leaf-500"
                    style={{ width: `${(hours / maxHours) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-16 shrink-0 text-right text-[13.5px] font-semibold text-navy-900">
                {hours}h
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
