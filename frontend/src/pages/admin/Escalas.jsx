import React, { useMemo, useState } from 'react'
import { CalendarCheck, Users, Sparkles, Download, Check, AlertTriangle, ArrowRightLeft } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import ShiftChip from '../../components/ShiftChip'
import { useApp } from '../../context/AppContext'
import { formatDateBR } from '../../utils/date'

export default function Escalas() {
  const { actions, schedules, volunteers, regenerateSchedule, showToast } = useApp()
  const [actionId, setActionId] = useState(actions[0].id)
  const [date, setDate] = useState(actions[0].dates[0])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [exchangeData, setExchangeData] = useState({ shiftId: null, currentVolunteer: '', newVolunteer: '' })

  const action = actions.find((a) => a.id === actionId)
  const scheduleKey = `${actionId}_${date}`
  const schedule = schedules[scheduleKey]

  const rows = useMemo(() => {
    if (!schedule) return []
    return action.shiftsTemplate.map((template) => {
      const entry = schedule.shifts.find((s) => s.shiftId === template.id)
      const assignedVolunteers = (entry?.assigned ?? []).map(
        (id) => volunteers.find((v) => v.id === id) || { id, name: id }
      )
      return { template, assignedVolunteers, status: entry?.status ?? 'Pendente', entry }
    })
  }, [schedule, action, volunteers])

  const hasPending = rows.some(r => r.status === 'Pendente')

  function handleActionChange(nextId) {
    setActionId(nextId)
    const next = actions.find((a) => a.id === nextId)
    setDate(next.dates[0])
  }

  function handleConfirmSchedule() {
    if (window.confirm('Tem certeza que deseja confirmar esta escala? Os voluntários serão notificados.')) {
        // No sistema real, isso atualizaria o status da escala no backend e dispararia emails (RF16)
        showToast('Escala confirmada! Notificações enviadas aos voluntários.')
    }
  }

  function openExchangeModal(shiftId, currentVolId) {
     setExchangeData({ shiftId, currentVolunteer: currentVolId, newVolunteer: '' })
     setIsModalOpen(true)
  }

  function handleExchangeSubmit(e) {
      e.preventDefault()
      // Lógica simplificada para o protótipo: o ideal seria atualizar o schedule global no AppContext
      showToast('Troca de turno registrada com sucesso! Notificações enviadas.')
      setIsModalOpen(false)
  }

  function downloadCsv() {
    const header = 'Horario,Turno,Voluntarios Escalados,Status\n'
    const body = rows
      .map(
        (r) =>
          `${r.template.start} - ${r.template.end},${r.template.label},"${r.assignedVolunteers.map(v => v.name).join('; ') || '-'}",${r.status}`,
      )
      .join('\n')
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `escala-${actionId}-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        icon={CalendarCheck}
        title="Gerar Escalas"
        subtitle="Selecione a ação e o período para criar ou revisar a escala de voluntários."
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-navy-900">Ação / Evento</label>
            <select
              value={actionId}
              onChange={(e) => handleActionChange(e.target.value)}
              className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13.5px] text-navy-900"
            >
              {actions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-navy-900">Data</label>
            <select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13.5px] text-navy-900"
            >
              {action.dates.map((d) => (
                <option key={d} value={d}>
                  {formatDateBR(d)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
           <button
             onClick={() => regenerateSchedule(actionId, date)}
             className="focus-ring inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-brand-700"
           >
             <Sparkles size={16} />
             {schedule ? 'Regerar Escala' : 'Gerar Proposta de Escala'}
           </button>

           {schedule && (
             <div className="text-[12px] text-slate-500">
                Última geração: {new Date(schedule.generatedAt).toLocaleTimeString('pt-BR')}
             </div>
           )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-5 py-4 gap-4">
          <div className="flex items-center gap-2 text-[15px] font-bold text-navy-900">
            <Users size={17} />
            Proposta de Escala
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCsv}
              disabled={!schedule}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-medium text-navy-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={14} />
              Exportar
            </button>
            <button
               onClick={handleConfirmSchedule}
               disabled={!schedule}
               className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-leaf-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-leaf-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
               <Check size={14} />
               Confirmar Escala
            </button>
          </div>
        </div>

        {!schedule ? (
          <div className="px-5 py-12 text-center text-[13.5px] text-slate-500">
            Nenhuma escala gerada para esta data ainda. Clique em <strong>Gerar Proposta de Escala</strong> para cruzar automaticamente a disponibilidade e o histórico de horas dos voluntários.
          </div>
        ) : (
          <div className="overflow-x-auto">
             {hasPending && (
                <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex items-start gap-2 text-amber-800 text-[12.5px]">
                   <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                   <p>Há turnos com voluntários pendentes devido a conflitos de agenda ou falta de disponibilidade. Considere alterar a data ou contatar voluntários específicos.</p>
                </div>
             )}
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="text-[12.5px] font-semibold text-slate-500 bg-slate-50/50">
                  <th className="px-5 py-3">Horário</th>
                  <th className="px-5 py-3">Turno / Atividade</th>
                  <th className="px-5 py-3">Voluntários Escalados</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.template.id} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-navy-900">
                      {r.template.start} – {r.template.end}
                    </td>
                    <td className="px-5 py-4">
                      <ShiftChip label={r.template.label} color={r.template.color} />
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                       {r.assignedVolunteers.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                             {r.assignedVolunteers.map(v => (
                                <span key={v.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-[12.5px] font-medium text-slate-700">
                                   {v.name}
                                   <button 
                                      onClick={() => openExchangeModal(r.template.id, v.id)}
                                      title="Trocar voluntário" 
                                      className="text-slate-400 hover:text-brand-600"
                                   >
                                      <ArrowRightLeft size={12} />
                                   </button>
                                </span>
                             ))}
                          </div>
                       ) : (
                          <span className="text-slate-400 italic">Vazio</span>
                       )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                       <span className="text-[12px] text-slate-400">{r.assignedVolunteers.length} / {r.template.needed} vagas</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

       {/* Modal de Troca de Turno (RF14, RF15) */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-navy-900">
              Solicitar Troca de Turno
            </h2>
            
            <form onSubmit={handleExchangeSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Substituir voluntário:</label>
                <input disabled value={volunteers.find(v => v.id === exchangeData.currentVolunteer)?.name || ''} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none bg-slate-50 text-slate-500" />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Por (novo voluntário):</label>
                <select required value={exchangeData.newVolunteer} onChange={(e) => setExchangeData({...exchangeData, newVolunteer: e.target.value})} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500">
                   <option value="">Selecione um voluntário livre...</option>
                   {/* Simplificação: lista todos os ativos no protótipo */}
                   {volunteers.filter(v => v.status !== 'Inativo' && v.id !== exchangeData.currentVolunteer).map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                   ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                  Confirmar Troca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}