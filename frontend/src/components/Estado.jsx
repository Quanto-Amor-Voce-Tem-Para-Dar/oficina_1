import React from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { mensagemDeErro } from '../api'

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-[13.5px] text-slate-500">
      <Loader2 size={16} className="animate-spin" /> {texto}
    </div>
  )
}

export function Erro({ erro, onTentar }) {
  if (!erro) return null
  return (
    <div className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1">{mensagemDeErro(erro)}</div>
      {onTentar && (
        <button onClick={onTentar} className="font-semibold underline">
          Tentar de novo
        </button>
      )}
    </div>
  )
}

export function Aviso({ children }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

export function Vazio({ children }) {
  return <p className="px-5 py-10 text-center text-[13.5px] text-slate-500">{children}</p>
}
