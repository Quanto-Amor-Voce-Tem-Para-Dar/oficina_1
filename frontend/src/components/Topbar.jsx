import React, { useState } from 'react'
import { Menu, ChevronDown, User, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ onOpenMenu }) {
  const { logout, currentUser, showToast } = useApp()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    setOpen(false)
    showToast('Sessão encerrada.')
    navigate('/login')
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        onClick={onOpenMenu}
        className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-ring md:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block" />

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 focus-ring"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-brand-700">
            <User size={16} />
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-[13.5px] font-semibold leading-tight text-navy-900">
              {currentUser.name}
            </span>
            <span className="block text-[12px] leading-tight text-slate-500">
              {currentUser.roleLabel}
            </span>
          </span>
          <ChevronDown size={16} className="text-slate-400" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-[12px] font-medium text-slate-400">Logado como</p>
                <p className="text-[14px] font-bold text-navy-900">{currentUser.name}</p>
                <p className="text-[12px] text-slate-500">{currentUser.email}</p>
                <p className="text-[12px] text-slate-500">{currentUser.roleLabel}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13.5px] text-red-600 hover:bg-slate-50 focus-ring"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-red-100">
                  <LogOut size={15} />
                </span>
                <span className="font-medium">Sair do Sistema</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

