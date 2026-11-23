import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useApp } from '../context/AppContext'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { toast } = useApp()

  return (
    <div className="flex h-screen bg-[#f5f6fb]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-[60] flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-3 text-[13.5px] text-white shadow-lg ${
            toast.tom === 'erro' ? 'bg-rose-600' : 'bg-navy-900'
          }`}
        >
          {toast.tom === 'erro' ? (
            <AlertTriangle size={16} className="shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="shrink-0 text-leaf-500" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  )
}
