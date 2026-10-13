import React, { useMemo, useState } from 'react'
import { CalendarDays, Save, Plus, X, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useApp } from '../../context/AppContext'
import { DAY_KEYS_ORDERED } from '../../utils/days'

const TIME_OPTIONS = Array.from({ length: 25 }, (_, i) => {
  const h = Math.floor(i / 2) + 6
  const m = i % 2 === 0 ? '00' : '30'
  return h <= 22 ? `${String(h).padStart(2, '0')}:${m}` : null
}).filter(Boolean)

function buildInitialRows(availability) {
  const rows = {}
  DAY_KEYS_ORDERED.forEach(({ key }) => {
    const intervals = availability.filter((a) => a.day === key).map((a) => ({ start: a.start, end: a.end }))
    rows[key] = intervals.length ? intervals : [{ start: '08:00', end: '12:00' }]
  })
  return rows
}

export default function MinhaDisponibilidade() {
  const { currentVolunteer, updateAvailability, showToast } = useApp()
  const [enabled, setEnabled] = useState(() => {
    const map = {}
    DAY_KEYS_ORDERED.forEach(({ key }) => {
      map[key] = currentVolunteer.availability?.some((a) => a.day === key) || false
    })
    return map
  })
  const [rows, setRows] = useState(() => buildInitialRows(currentVolunteer.availability || []))
  
  // Estado simulado para a integração com o Google Calendar (RF06)
  const [googleSynced, setGoogleSynced] = useState(false)

  const isDirty = useMemo(() => true, [enabled, rows]) // protótipo: sempre permite salvar

  function toggleDay(key) {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function updateInterval(key, index, field, value) {
    setRows((prev) => {
      const next = { ...prev }
      next[key] = next[key].map((iv, i) => (i === index ? { ...iv, [field]: value } : iv))
      return next
    })
  }

  function addInterval(key) {
    setRows((prev) => ({ ...prev, [key]: [...prev[key], { start: '08:00', end: '12:00' }] }))
  }

  function removeInterval(key, index) {
    setRows((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }))
  }

  function handleSave() {
    const availability = []
    DAY_KEYS_ORDERED.forEach(({ key }) => {
      if (!enabled[key]) return
      rows[key].forEach((iv) => availability.push({ day: key, start: iv.start, end: iv.end }))
    })
    updateAvailability(currentVolunteer.id, availability)
  }

  function handleGoogleSync() {
    setGoogleSynced(!googleSynced)
    if (!googleSynced) {
      showToast('Permissão do Google Calendar concedida com sucesso!')
    }
  }

  return (
    <div>
      <PageHeader
        icon={CalendarDays}
        title="Minha Disponibilidade"
        subtitle="Informe seus horários disponíveis para a semana."
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-soft mb-6">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[15px] font-bold text-navy-900">Disponibilidade da Semana</h2>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="hidden grid-cols-[1fr_auto_1fr_auto_1fr_auto] gap-3 px-5 py-2.5 text-[12.5px] font-semibold text-slate-500 sm:grid">
            <span>Dia</span>
            <span />
            <span>Disponível</span>
            <span />
            <span />
            <span />
          </div>

          {DAY_KEYS_ORDERED.map(({ key, label }) => (
            <div key={key} className="px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex w-40 shrink-0 items-center gap-2.5 text-[13.5px] font-medium text-navy-900">
                  <input
                    type="checkbox"
                    checked={enabled[key]}
                    onChange={() => toggleDay(key)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus-ring"
                  />
                  {label}
                </label>

                <div className="flex flex-1 flex-col gap-2">
                  {rows[key].map((iv, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        disabled={!enabled[key]}
                        value={iv.start}
                        onChange={(e) => updateInterval(key, index, 'start', e.target.value)}
                        className="focus-ring rounded-lg border border-slate-300 px-2.5 py-2 text-[13px] disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        {TIME_OPTIONS.map((t) => (
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
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>

                      {rows[key].length > 1 && (
                        <button
                          onClick={() => removeInterval(key, index)}
                          className="focus-ring grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
                        >
                          <X size={15} />
                        </button>
                      )}
                      {index === rows[key].length - 1 && (
                        <button
                          onClick={() => addInterval(key)}
                          disabled={!enabled[key]}
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

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${googleSynced ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                 <CalendarIcon size={18} />
              </div>
              <div>
                 <p className="text-[13.5px] font-bold text-navy-900">Integração com Google Calendar</p>
                 <p className="text-[12px] text-slate-500 max-w-md leading-tight mt-0.5">Permita que o sistema verifique seus compromissos para evitar conflitos de horário nas escalas.</p>
              </div>
           </div>
           
           <button 
              onClick={handleGoogleSync}
              className={`text-[13px] font-semibold px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${googleSynced ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
           >
              {googleSynced ? <><CheckCircle2 size={16} /> Sincronizado</> : 'Conectar Conta'}
           </button>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="focus-ring inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-brand-700"
        >
          <Save size={18} />
          Salvar Disponibilidade
        </button>
      </div>
    </div>
  )
}