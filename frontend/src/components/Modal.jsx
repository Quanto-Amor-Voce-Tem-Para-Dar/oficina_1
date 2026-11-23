import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, largura = 'max-w-lg' }) {
  useEffect(() => {
    const fechar = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fechar)
    return () => window.removeEventListener('keydown', fechar)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={onClose}>
      <div
        className={`max-h-[90vh] w-full ${largura} overflow-y-auto rounded-xl bg-white p-6 shadow-xl`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-navy-900">{title}</h2>
          <button onClick={onClose} className="focus-ring rounded p-1 text-slate-400 hover:text-slate-600" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Classes padrão dos campos de formulário
export const campo =
  'w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-400'
export const rotulo = 'mb-1 block text-sm font-medium text-slate-700'
export const botaoPrimario =
  'focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50'
export const botaoSecundario =
  'focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50'
