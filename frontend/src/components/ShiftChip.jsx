import React from 'react'

const colorMap = {
  blue: 'bg-sky-50 text-sky-700',
  green: 'bg-leaf-50 text-leaf-600',
  gray: 'bg-slate-100 text-slate-600',
  violet: 'bg-violet-50 text-violet-700',
  amber: 'bg-amber-50 text-amber-700',
}

export default function ShiftChip({ label, color = 'gray' }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-[12.5px] font-medium ${colorMap[color]}`}>
      {label}
    </span>
  )
}
