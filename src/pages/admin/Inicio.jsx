import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Home, Users, CalendarDays, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { useApp } from '../../context/AppContext'
import { formatDateBR } from '../../utils/date'
import { totalHoursFor } from '../../utils/schedule'

function StatCard({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    leaf: 'bg-leaf-50 text-leaf-600',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon size={18} />
        </span>
        <div>
          <p className="text-[22px] font-bold leading-none text-navy-900">{value}</p>
          <p className="mt-1 text-[12.5px] text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function AdminInicio() {
  const { volunteers, actions, schedules } = useApp()

  const pendingShifts = useMemo(() => {
    const rows = []
    Object.entries(schedules).forEach(([key, schedule]) => {
      const [actionId, date] = key.split('_')
      const action = actions.find((a) => a.id === actionId)
      if (!action) return
      schedule.shifts
        .filter((s) => s.status === 'Pendente')
        .forEach((s) => {
          const template = action.shiftsTemplate.find((t) => t.id === s.shiftId)
          rows.push({ actionTitle: action.title, date, template })
        })
    })
    return rows
  }, [schedules, actions])

  const totalHoursThisSemester = volunteers.reduce(
    (sum, v) => sum + totalHoursFor(v.id, v, actions, schedules),
    0,
  )

  return (
    <div>
      <PageHeader
        icon={Home}
        title="Olá, Ana"
        subtitle="Aqui está um resumo da operação do projeto nesta semana."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Voluntários ativos" value={volunteers.length} />
        <StatCard icon={CalendarDays} label="Ações cadastradas" value={actions.length} tone="leaf" />
        <StatCard icon={AlertTriangle} label="Turnos pendentes" value={pendingShifts.length} tone="amber" />
        <StatCard
          icon={Clock}
          label="Horas registradas"
          value={`${Math.round(totalHoursThisSemester)}h`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-navy-900">Turnos que ainda precisam de voluntário</h2>
          </div>
          {pendingShifts.length === 0 ? (
            <p className="py-6 text-center text-[13.5px] text-slate-500">
              Nenhum turno pendente no momento. Tudo escalado! 🎉
            </p>
          ) : (
            <ul className="space-y-3">
              {pendingShifts.map((p, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-slate-100 px-3.5 py-3">
                  <div>
                    <p className="text-[13.5px] font-medium text-navy-900">{p.template.label}</p>
                    <p className="text-[12.5px] text-slate-500">
                      {p.actionTitle} · {formatDateBR(p.date)} · {p.template.start}–{p.template.end}
                    </p>
                  </div>
                  <StatusBadge status="Pendente" />
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/escalas"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
          >
            Ir para Escalas <ArrowRight size={14} />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-3 text-[15px] font-bold text-navy-900">Próximas ações</h2>
          <ul className="space-y-3">
            {actions.map((a) => (
              <li key={a.id} className="rounded-lg border border-slate-100 px-3.5 py-3">
                <p className="text-[13.5px] font-medium text-navy-900">{a.title}</p>
                <p className="text-[12.5px] text-slate-500">
                  {a.location} · próxima data {formatDateBR(a.dates[0])}
                </p>
              </li>
            ))}
          </ul>
          <Link
            to="/admin/acoes"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
          >
            Ver todas as ações <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
