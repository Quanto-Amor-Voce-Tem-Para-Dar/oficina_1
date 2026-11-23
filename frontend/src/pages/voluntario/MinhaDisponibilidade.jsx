import React, { useEffect, useState } from 'react'
import { CalendarDays, Save, Plus, X, Calendar as CalendarIcon, CheckCircle2, Loader2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { Carregando, Erro } from '../../components/Estado'
import { useApp } from '../../context/AppContext'
import useCarregar from '../../hooks/useCarregar'
import { get, put, mensagemDeErro } from '../../api'
import { DAYS_ORDERED } from '../../utils/date'

const TIME_OPTIONS = []
for (let h = 6; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 23) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

const PADRAO = { start: '08:00', end: '12:00' }

function montarEstado(lista) {
  const enabled = {}
  const rows = {}
  DAYS_ORDERED.forEach(({ key }) => {
    const intervalos = lista.filter((d) => d.dia_semana === key).map((d) => ({ start: d.hora_inicio, end: d.hora_fim }))
    enabled[key] = intervalos.length > 0
    rows[key] = intervalos.length ? intervalos : [{ ...PADRAO }]
  })
  return { enabled, rows }
}

// Garante que um horário que veio do banco (ex.: 07:15) apareça no select
const opcoesCom = (valor) => (TIME_OPTIONS.includes(valor) ? TIME_OPTIONS : [...TIME_OPTIONS, valor].sort())

export default function MinhaDisponibilidade() {
  const { usuario, showToast } = useApp()
  const { dados, carregando, erro, recarregar } = useCarregar(
    () => Promise.all([get(`/usuarios/${usuario.id_usuario}/disponibilidade`), get('/google/conta')]),
    [usuario.id_usuario],
  )
  const [enabled, setEnabled] = useState({})
  const [rows, setRows] = useState({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!dados) return
    const estado = montarEstado(dados[0])
    setEnabled(estado.enabled)
    setRows(estado.rows)
  }, [dados])

  const conta = dados?.[1]

  function toggleDay(key) {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function updateInterval(key, index, field, value) {
    setRows((prev) => ({ ...prev, [key]: prev[key].map((iv, i) => (i === index ? { ...iv, [field]: value } : iv)) }))
  }

  function addInterval(key) {
    setRows((prev) => ({ ...prev, [key]: [...prev[key], { start: '14:00', end: '18:00' }] }))
  }

  function removeInterval(key, index) {
    setRows((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }))
  }

  async function handleSave() {
    const horarios = []
    for (const { key, label } of DAYS_ORDERED) {
      if (!enabled[key]) continue
      for (const iv of rows[key]) {
        if (iv.end <= iv.start) {
          showToast(`${label}: o horário final deve ser depois do inicial.`, 'erro')
          return
        }
        horarios.push({ dia_semana: key, hora_inicio: iv.start, hora_fim: iv.end })
      }
    }
    setSalvando(true)
    try {
      const r = await put(`/usuarios/${usuario.id_usuario}/disponibilidade`, { horarios })
      showToast(r.mensagem)
    } catch (err) {
      showToast(mensagemDeErro(err), 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <PageHeader icon={CalendarDays} title="Minha Disponibilidade" subtitle="Informe os horários em que você costuma poder atuar em cada dia da semana." />

      {carregando && !dados ? (
        <Carregando />
      ) : erro ? (
        <Erro erro={erro} onTentar={recarregar} />
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-soft">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-[15px] font-bold text-navy-900">Disponibilidade da semana</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {DAYS_ORDERED.map(({ key, label }) => (
                <div key={key} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex w-40 shrink-0 items-center gap-2.5 text-[13.5px] font-medium text-navy-900">
                      <input type="checkbox" checked={!!enabled[key]} onChange={() => toggleDay(key)} className="focus-ring h-4 w-4 rounded border-slate-300 text-brand-600" />
                      {label}
                    </label>

                    <div className="flex flex-1 flex-col gap-2">
                      {(rows[key] || []).map((iv, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <select
                            disabled={!enabled[key]}
                            value={iv.start}
                            onChange={(e) => updateInterval(key, index, 'start', e.target.value)}
                            className="focus-ring rounded-lg border border-slate-300 px-2.5 py-2 text-[13px] disabled:bg-slate-50 disabled:text-slate-400"
                          >
                            {opcoesCom(iv.start).map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <span className="text-[12.5px] text-slate-400">às</span>
                          <select
                            disabled={!enabled[key]}
                            value={iv.end}
                            onChange={(e) => updateInterval(key, index, 'end', e.target.value)}
                            className="focus-ring rounded-lg border border-slate-300 px-2.5 py-2 text-[13px] disabled:bg-slate-50 disabled:text-slate-400"
                          >
                            {opcoesCom(iv.end).map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>

                          {rows[key].length > 1 && (
                            <button onClick={() => removeInterval(key, index)} title="Remover horário" className="focus-ring grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
                              <X size={15} />
                            </button>
                          )}
                          {index === rows[key].length - 1 && (
                            <button
                              onClick={() => addInterval(key)}
                              disabled={!enabled[key]}
                              title="Adicionar outro horário neste dia"
                              className="focus-ring grid h-8 w-8 place-items-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-4">
              <div className={`rounded-full p-2 ${conta?.conectado ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                <CalendarIcon size={18} />
              </div>
              <div className="text-[12.5px] leading-snug text-slate-600">
                <p className="text-[13.5px] font-bold text-navy-900">Google Agenda (opcional)</p>
                {conta?.conectado ? (
                  <p className="mt-0.5">
                    Para o sistema não te escalar quando você já tem compromisso, compartilhe sua Agenda Google com{' '}
                    <span className="font-semibold text-navy-900">{conta.contaEmail}</span> com a permissão “Ver apenas livre/ocupado”
                    (Google Agenda → Configurações → sua agenda → Compartilhar com pessoas específicas). O sistema não vê o conteúdo dos seus compromissos.
                  </p>
                ) : (
                  <p className="mt-0.5">A integração com o Google Agenda ainda não foi ativada pela gestão. Por enquanto, vale só o que você informar acima.</p>
                )}
                {conta?.conectado && (
                  <p className="mt-1 flex items-center gap-1 text-leaf-600">
                    <CheckCircle2 size={13} /> Se você compartilhar a agenda e não marcar nenhum dia acima, o sistema considera só a agenda.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={salvando}
              className="focus-ring inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Salvar disponibilidade
            </button>
          </div>
        </>
      )}
    </div>
  )
}
