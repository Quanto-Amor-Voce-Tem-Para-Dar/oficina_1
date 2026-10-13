import React from 'react'

export default function PageHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Icon size={18} />
          </span>
        )}
        <div>
          <h1 className="text-[21px] font-bold text-navy-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13.5px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}
