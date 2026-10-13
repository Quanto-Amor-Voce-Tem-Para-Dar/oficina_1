import React from 'react'

const styles = {
  Confirmado: 'bg-leaf-100 text-leaf-600',
  Pendente: 'bg-amber-100 text-amber-700',
  Cancelado: 'bg-rose-100 text-rose-600',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${
        styles[status] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {status}
    </span>
  )
}
