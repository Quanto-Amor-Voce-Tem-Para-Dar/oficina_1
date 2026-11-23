import React from 'react'
import { Clock } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { Carregando, Erro, Vazio } from '../../components/Estado'
import useCarregar from '../../hooks/useCarregar'
import { get } from '../../api'
import { formatDateBR, formatHours, hhmm } from '../../utils/date'

export default function VolHoras() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => get('/horas'))

  return (
    <div>
      <PageHeader icon={Clock} title="Horas" subtitle="Seu histórico de participação e horas de voluntariado." />

      {carregando && !dados ? (
        <Carregando />
      ) : erro ? (
        <Erro erro={erro} onTentar={recarregar} />
      ) : (
        <>
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-[13px] text-slate-500">Total acumulado</p>
            <p className="text-[26px] font-bold text-navy-900">{formatHours(dados.horas_acumuladas)}</p>
            <p className="mt-1 text-[12.5px] text-slate-400">Soma dos turnos em escalas confirmadas (ausências não contam).</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-[15px] font-bold text-navy-900">Participações</h2>
            </div>
            {dados.participacoes.length === 0 ? (
              <Vazio>Nenhuma participação registrada ainda.</Vazio>
            ) : (
              <div className="divide-y divide-slate-100">
                {dados.participacoes.map((p) => (
                  <div key={p.id_atribuicao} className="flex items-center justify-between gap-3 px-5 py-3.5 text-[13.5px]">
                    <div>
                      <p className="font-medium text-navy-900">{p.acao}</p>
                      <p className="text-[12.5px] text-slate-500">
                        {formatDateBR(p.data)} · {hhmm(p.hora_inicio)}–{hhmm(p.hora_fim)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={p.status_presenca} />
                      <span className={`w-12 text-right font-semibold ${p.status_presenca === 'AUSENTE' ? 'text-slate-300 line-through' : 'text-navy-900'}`}>
                        {formatHours(p.horas)}
                      </span>
                    </div>
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
