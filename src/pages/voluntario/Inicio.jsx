import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Clock, CalendarCheck, ArrowRight, MapPin } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { useApp } from '../../context/AppContext'
import { upcomingShiftsFor, totalHoursFor } from '../../utils/schedule'
import { formatDateLong } from '../../utils/date'

export default function VolInicio() {
  const { currentVolunteer, actions, schedules } = useApp()
  const shifts = upcomingShiftsFor(currentVolunteer.id, actions, schedules).slice(0, 3)
  const hours = totalHoursFor(currentVolunteer.id, currentVolunteer, actions, schedules)
  const firstName = currentVolunteer.name.split(' ')[0]

  return (
    <div>
      <PageHeader
        icon={Home}
        title={`Olá, ${firstName}`}
        subtitle="Este é o seu resumo como voluntário do projeto."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-leaf-50 text-leaf-600">
              <Clock size={18} />
            </span>
            <div>
              <p className="text-[22px] font-bold leading-none text-navy-900">{hours}h</p>
              <p className="mt-1 text-[12.5px] text-slate-500">Horas de voluntariado no semestre</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <CalendarCheck size={18} />
            </span>
            <div>
              <p className="text-[22px] font-bold leading-none text-navy-900">{shifts.length}</p>
              <p className="mt-1 text-[12.5px] text-slate-500">Próximos turnos confirmados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-navy-900">Meus próximos turnos</h2>
          <Link to="/voluntario/escala" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
            Ver todas <ArrowRight size={13} />
          </Link>
        </div>

        {shifts.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-slate-500">
            Nenhum turno atribuído ainda. Atualize sua disponibilidade para ser escalado.
          </p>
        ) : (
          <ul className="space-y-3">
            {shifts.map((s, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-slate-100 px-3.5 py-3">
                <div>
                  <p className="text-[13.5px] font-medium text-navy-900">
                    {formatDateLong(s.date)} · {s.start}–{s.end}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate-500">
                    <MapPin size={12.5} /> {s.label} · {s.actionTitle}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
