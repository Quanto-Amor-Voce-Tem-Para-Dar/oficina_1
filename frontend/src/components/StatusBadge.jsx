import React from 'react'

// Aceita os status da API (CONFIRMADA, PENDENTE...) e mostra um rótulo amigável.
const MAPA = {
  CONFIRMADO: ['Confirmado', 'bg-leaf-100 text-leaf-600'],
  CONFIRMADA: ['Confirmada', 'bg-leaf-100 text-leaf-600'],
  PRESENTE: ['Presente', 'bg-leaf-100 text-leaf-600'],
  APROVADA: ['Aprovada', 'bg-leaf-100 text-leaf-600'],
  ATIVO: ['Ativo', 'bg-leaf-100 text-leaf-600'],
  ENVIADO: ['Enviado', 'bg-leaf-100 text-leaf-600'],
  CONCLUIDA: ['Concluída', 'bg-slate-100 text-slate-600'],
  PENDENTE: ['Pendente', 'bg-amber-100 text-amber-700'],
  PROPOSTA: ['Proposta', 'bg-amber-100 text-amber-700'],
  PLANEJADA: ['Planejada', 'bg-sky-50 text-sky-700'],
  EM_ANDAMENTO: ['Em andamento', 'bg-brand-50 text-brand-700'],
  AUSENTE: ['Ausente', 'bg-rose-100 text-rose-600'],
  REJEITADA: ['Rejeitada', 'bg-rose-100 text-rose-600'],
  CANCELADA: ['Cancelada', 'bg-rose-100 text-rose-600'],
  INATIVO: ['Inativo', 'bg-rose-100 text-rose-600'],
  FALHA: ['Falha', 'bg-rose-100 text-rose-600'],
  ADMINISTRADOR: ['Administrador', 'bg-violet-50 text-violet-700'],
  VOLUNTARIO: ['Voluntário', 'bg-sky-50 text-sky-700'],
}

export default function StatusBadge({ status, label }) {
  const [texto, estilo] = MAPA[status] ?? [status, 'bg-slate-100 text-slate-600']
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${estilo}`}>
      {label ?? texto}
    </span>
  )
}
