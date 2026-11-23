import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Clock, CalendarCheck, ArrowRight, CalendarDays, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { Carregando, Erro } from '../../components/Estado'
import { useApp } from '../../context/AppContext'
import useCarregar from '../../hooks/useCarregar'
import { get } from '../../api'
import { formatDateLong, formatHours, hojeISO } from '../../utils/date'

export default function VolInicio() {
  const { usuario } = useApp()
  const { dados, carregando, erro, recarregar } = useCarregar(() =>
    Promise.all([get('/minha-escala'), get('/auth/eu'), get(`/usuarios/${usuario.id_usuario}/disponibilidade`)]),
  )
  const [turnos, eu, disponibilidade] = dados || [[], usuario, []]
  const proximos = turnos.filter((t) => t.data >= hojeISO())

  return (
    <div>
      <PageHeader icon={Home} title={`Olá, ${usuario.nome.split(' ')[0]}`} subtitle="Este é o seu resumo como voluntário(a) do projeto." />

      {carregando && !dados ? (
        <Carregando />
      ) : erro ? (
        <Erro erro={erro} onTentar={recarregar} />
      ) : (
        <>
          {disponibilidade.length === 0 && (
            <Link
              to="/voluntario/disponibilidade"
              className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-800 hover:bg-amber-100"
            >
              <AlertTriangle size={16} className="shrink-0" />
              Você ainda não informou sua disponibilidade. Sem ela, você não entra nas escalas. Clique para preencher.
            </Link>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-leaf-50 text-leaf-600">
                  <Clock size={18} />
                </span>
                <div>
                  <p className="text-[22px] font-bold leading-none text-navy-900">{formatHours(eu.horas_acumuladas)}</p>
                  <p className="mt-1 text-[12.5px] text-slate-500">Horas de voluntariado</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <CalendarCheck size={18} />
                </span>
                <div>
                  <p className="text-[22px] font-bold leading-none text-navy-900">{proximos.length}</p>
                  <p className="mt-1 text-[12.5px] text-slate-500">Próximos turnos confirmados</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-navy-900">Meus próximos turnos</h2>
              <Link to="/voluntario/escala" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
                Ver todos <ArrowRight size={13} />
              </Link>
            </div>

            {proximos.length === 0 ? (
              <p className="py-6 text-center text-[13.5px] text-slate-500">
                Nenhum turno confirmado por enquanto.{' '}
                <Link to="/voluntario/disponibilidade" className="font-semibold text-brand-600">
                  Mantenha sua disponibilidade atualizada
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-3">
                {proximos.slice(0, 4).map((t) => (
                  <li key={t.id_atribuicao} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3.5 py-3">
                    <div>
                      <p className="text-[13.5px] font-medium text-navy-900">
                        {formatDateLong(t.data)} · {t.hora_inicio}–{t.hora_fim}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate-500">
                        <CalendarDays size={12.5} /> {t.acao}
                      </p>
                    </div>
                    <StatusBadge status={t.status_troca === 'PENDENTE' ? 'PENDENTE' : t.status_presenca} label={t.status_troca === 'PENDENTE' ? 'Troca pendente' : undefined} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
