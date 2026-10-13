import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Heart,
  Home,
  Users,
  CalendarDays,
  CalendarCheck,
  Clock,
  Settings,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const adminLinks = [
  { to: '/admin/inicio', label: 'Início', icon: Home },
  { to: '/admin/voluntarios', label: 'Voluntários', icon: Users },
  { to: '/admin/acoes', label: 'Ações / Eventos', icon: CalendarDays },
  { to: '/admin/escalas', label: 'Escalas', icon: CalendarCheck },
  { to: '/admin/horas', label: 'Horas', icon: Clock },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

const volunteerLinks = [
  { to: '/voluntario/inicio', label: 'Início', icon: Home },
  { to: '/voluntario/disponibilidade', label: 'Minha Disponibilidade', icon: CalendarDays },
  { to: '/voluntario/escala', label: 'Minha Escala', icon: CalendarCheck },
  { to: '/voluntario/horas', label: 'Horas', icon: Clock },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { role } = useApp()
  const links = role === 'admin' ? adminLinks : volunteerLinks

  const content = (
    <>
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-leaf-500/20">
            <Heart size={18} className="text-leaf-500" strokeWidth={2.4} />
          </span>
          <div className="leading-tight">
            <p className="text-[13.5px] font-bold">Quanto Amor</p>
            <p className="text-[13.5px] font-bold -mt-0.5">Você Tem Para Dar?</p>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden text-slate-400 focus-ring rounded p-1">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors focus-ring ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-5 text-[11.5px] leading-snug text-slate-400">
        Projeto de Extensão Universitária
        <br />
        Quanto Amor Você Tem Para Dar?
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col bg-navy-900 text-white">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-navy-900 text-white shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
