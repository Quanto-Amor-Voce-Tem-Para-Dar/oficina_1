import React, { useState } from 'react'
import { Settings, Bell, ShieldCheck } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useApp } from '../../context/AppContext'

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`focus-ring relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-brand-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default function Configuracoes() {
  const { showToast } = useApp()
  const [orgName, setOrgName] = useState('Quanto Amor Você Tem Para Dar?')
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyPending, setNotifyPending] = useState(true)
  const [minHoursAlert, setMinHoursAlert] = useState(false)

  return (
    <div>
      <PageHeader
        icon={Settings}
        title="Configurações"
        subtitle="Preferências gerais da administração do sistema."
      />

      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-navy-900">
            <ShieldCheck size={17} /> Dados do projeto
          </h2>
          <label className="mb-1.5 block text-[13px] font-semibold text-navy-900">Nome do projeto</label>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="focus-ring w-full max-w-md rounded-lg border border-slate-300 px-3 py-2.5 text-[13.5px]"
          />
          <button
            onClick={() => showToast('Dados do projeto atualizados.')}
            className="focus-ring mt-4 rounded-lg bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-brand-700"
          >
            Salvar alterações
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-navy-900">
            <Bell size={17} /> Notificações
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13.5px] font-medium text-navy-900">Aviso por e-mail aos voluntários</p>
                <p className="text-[12.5px] text-slate-500">Envia o turno confirmado assim que a escala é gerada.</p>
              </div>
              <Toggle checked={notifyEmail} onChange={setNotifyEmail} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13.5px] font-medium text-navy-900">Alerta de turnos pendentes</p>
                <p className="text-[12.5px] text-slate-500">Notifica a diretoria quando um turno fica sem voluntário.</p>
              </div>
              <Toggle checked={notifyPending} onChange={setNotifyPending} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13.5px] font-medium text-navy-900">Alerta de horas mínimas</p>
                <p className="text-[12.5px] text-slate-500">Avisa quando um voluntário está abaixo da carga horária esperada.</p>
              </div>
              <Toggle checked={minHoursAlert} onChange={setMinHoursAlert} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
