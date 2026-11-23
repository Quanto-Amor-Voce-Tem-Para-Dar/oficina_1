import React from 'react'
import { Clock } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { Carregando, Erro, Vazio } from '../../components/Estado'
import useCarregar from '../../hooks/useCarregar'
import { get } from '../../api'
import { formatHours, iniciais } from '../../utils/date'

export default function AdminHoras() {
  const { dados: linhas, carregando, erro, recarregar } = useCarregar(() => get('/horas'))
  const maxHoras = Math.max(...(linhas || []).map((l) => Number(l.horas_acumuladas)), 1)
  const total = (linhas || []).reduce((soma, l) => soma + Number(l.horas_acumuladas), 0)

  return (
    <div>
      <PageHeader
        icon={Clock}
        title="Horas"
        subtitle="Horas de voluntariado por membro (turnos de escalas confirmadas, sem contar ausências)."
      />

      {carregando && !linhas ? (
        <Carregando />
      ) : erro ? (
        <Erro erro={erro} onTentar={recarregar} />
      ) : (
        <>
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-[13px] text-slate-500">Total acumulado pela equipe</p>
            <p className="text-[26px] font-bold text-navy-900">{formatHours(total)}</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            {linhas.length === 0 ? (
              <Vazio>Nenhum voluntário cadastrado.</Vazio>
            ) : (
              <div className="divide-y divide-slate-100">
                {linhas.map((l) => (
                  <div key={l.id_usuario} className="flex items-center gap-4 px-5 py-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-[12px] font-semibold text-brand-700">
                      {iniciais(l.nome)}
                    </span>
                    <div className="w-44 shrink-0">
                      <p className="text-[13.5px] font-medium text-navy-900">{l.nome}</p>
                      <p className="text-[12px] text-slate-500">
                        {l.total_turnos} turno(s){l.total_ausencias ? ` · ${l.total_ausencias} ausência(s)` : ''}
                      </p>
                    </div>
                    <div className="hidden flex-1 sm:block">
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-leaf-500" style={{ width: `${(Number(l.horas_acumuladas) / maxHoras) * 100}%` }} />
                      </div>
                    </div>
                    {l.status === 'INATIVO' && <StatusBadge status="INATIVO" />}
                    <div className="w-16 shrink-0 text-right text-[13.5px] font-semibold text-navy-900">{formatHours(l.horas_acumuladas)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
