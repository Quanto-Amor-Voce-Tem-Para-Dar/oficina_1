import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Users, CalendarDays, AlertTriangle, Clock, ArrowRight, ArrowRightLeft, ClipboardCheck } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { Carregando, Erro } from '../../components/Estado'
import { useApp } from '../../context/AppContext'
import useCarregar from '../../hooks/useCarregar'
import { get } from '../../api'
import { formatDateBR, formatHours } from '../../utils/date'

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
  const { currentUser } = useApp()
  const { dados: painel, carregando, erro, recarregar } = useCarregar(() => get('/painel'))
  const primeiroNome = currentUser.name.split(' ')[0]

  return (
    <div>
      <PageHeader icon={Home} title={`Olá, ${primeiroNome}`} subtitle="Aqui está um resumo da operação do projeto." />

      {carregando && !painel ? (
        <Carregando />
      ) : erro ? (
        <Erro erro={erro} onTentar={recarregar} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Voluntários ativos" value={painel.voluntarios_ativos} />
            <StatCard icon={CalendarDays} label="Ações em aberto" value={painel.acoes_ativas} tone="leaf" />
            <StatCard icon={AlertTriangle} label="Turnos com vagas" value={painel.turnos_pendentes.length} tone="amber" />
            <StatCard icon={Clock} label="Horas registradas" value={formatHours(painel.horas_registradas)} />
          </div>

          {(painel.escalas_para_revisar > 0 || painel.trocas_pendentes > 0) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {painel.escalas_para_revisar > 0 && (
                <Link
                  to="/admin/escalas"
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-[13px] font-medium text-amber-800 hover:bg-amber-100"
                >
                  <ClipboardCheck size={15} />
                  {painel.escalas_para_revisar} proposta(s) de escala aguardando revisão
                </Link>
              )}
              {painel.trocas_pendentes > 0 && (
                <Link
                  to="/admin/escalas#trocas"
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-[13px] font-medium text-amber-800 hover:bg-amber-100"
                >
                  <ArrowRightLeft size={15} />
                  {painel.trocas_pendentes} solicitação(ões) de troca pendente(s)
                </Link>
              )}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-3 text-[15px] font-bold text-navy-900">Turnos que ainda precisam de voluntário</h2>
              {painel.turnos_pendentes.length === 0 ? (
                <p className="py-6 text-center text-[13.5px] text-slate-500">Nenhum turno pendente no momento. Tudo escalado! 🎉</p>
              ) : (
                <ul className="space-y-3">
                  {painel.turnos_pendentes.map((t) => (
                    <li key={t.id_turno} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3.5 py-3">
                      <div>
                        <p className="text-[13.5px] font-medium text-navy-900">{t.acao}</p>
                        <p className="text-[12.5px] text-slate-500">
                          {formatDateBR(t.data)} · {t.hora_inicio}–{t.hora_fim} · {t.preenchidas}/{t.qtd_voluntarios_necessaria} vagas
                        </p>
                      </div>
                      <StatusBadge status="PENDENTE" />
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/admin/escalas" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
                Ir para Escalas <ArrowRight size={14} />
              </Link>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="mb-3 text-[15px] font-bold text-navy-900">Próximas ações</h2>
              {painel.proximas_acoes.length === 0 ? (
                <p className="py-6 text-center text-[13.5px] text-slate-500">Nenhuma ação com turnos futuros.</p>
              ) : (
                <ul className="space-y-3">
                  {painel.proximas_acoes.map((a) => (
                    <li key={a.id_acao} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3.5 py-3">
                      <div>
                        <p className="text-[13.5px] font-medium text-navy-900">{a.nome}</p>
                        <p className="text-[12.5px] text-slate-500">próxima data {formatDateBR(a.proxima_data)}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/admin/acoes" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
                Ver todas as ações <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
