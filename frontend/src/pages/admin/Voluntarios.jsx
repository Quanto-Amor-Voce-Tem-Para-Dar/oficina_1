import React, { useMemo, useState } from 'react'
import { Users, Search, Plus, Edit2, Trash2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useApp } from '../../context/AppContext'
import { totalHoursFor } from '../../utils/schedule'
import { formatDateBR } from '../../utils/date'

const teamTone = {
  Logística: 'bg-sky-50 text-sky-700',
  Atendimento: 'bg-leaf-50 text-leaf-600',
  Apoio: 'bg-violet-50 text-violet-700',
}

export default function Voluntarios() {
  const { volunteers, actions, schedules, showToast, updateVolunteer, addVolunteer, removeVolunteer } = useApp()
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVolunteer, setEditingVolunteer] = useState(null)

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    team: 'Apoio',
    status: 'Ativo',
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return volunteers
    return volunteers.filter(
      (v) => v.name.toLowerCase().includes(q) || v.team.toLowerCase().includes(q),
    )
  }, [volunteers, query])

  const handleOpenModal = (volunteer = null) => {
    if (volunteer) {
      setEditingVolunteer(volunteer)
      setFormData({
        name: volunteer.name,
        email: volunteer.email,
        phone: volunteer.phone,
        team: volunteer.team,
        status: volunteer.status || 'Ativo',
      })
    } else {
      setEditingVolunteer(null)
      setFormData({ name: '', email: '', phone: '', team: 'Apoio', status: 'Ativo' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingVolunteer(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingVolunteer) {
      updateVolunteer(editingVolunteer.id, formData)
      showToast('Voluntário atualizado com sucesso!')
    } else {
      addVolunteer({ ...formData, joinedAt: new Date().toISOString() })
      showToast('Voluntário cadastrado com sucesso!')
    }
    handleCloseModal()
  }

  const handleDeactivate = (id) => {
    if (window.confirm('Tem certeza que deseja desativar/remover este voluntário?')) {
      removeVolunteer(id)
      showToast('Voluntário removido com sucesso.')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <PageHeader
          icon={Users}
          title="Voluntários"
          subtitle="Membros cadastrados no projeto e suas equipes."
        />
        <button
          onClick={() => handleOpenModal()}
          className="mt-4 sm:mt-0 flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
        >
          <Plus size={16} />
          Novo Voluntário
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:max-w-sm">
        <Search size={16} className="text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou equipe"
          className="w-full text-[13.5px] outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="text-[12.5px] font-semibold text-slate-500">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Equipe</th>
                <th className="px-5 py-3">Contato</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Horas no semestre</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-[12px] font-semibold text-brand-700">
                        {v.name
                          .split(' ')
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')}
                      </span>
                      <span className="font-medium text-navy-900">{v.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-[12px] font-medium ${teamTone[v.team] || 'bg-slate-100 text-slate-700'}`}>
                      {v.team}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <div>{v.email}</div>
                    <div className="text-slate-400">{v.phone}</div>
                  </td>
                  <td className="px-5 py-4">
                     <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider ${v.status === 'Inativo' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {v.status || 'Ativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-navy-900">
                    {totalHoursFor(v.id, v, actions, schedules)}h
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(v)} className="p-1.5 text-slate-400 hover:text-brand-600 focus-ring rounded">
                         <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeactivate(v.id)} className="p-1.5 text-slate-400 hover:text-red-600 focus-ring rounded">
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-navy-900">
              {editingVolunteer ? 'Editar Voluntário' : 'Novo Voluntário'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nome Completo</label>
                <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
                  <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
                  <input required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Equipe</label>
                  <select value={formData.team} onChange={(e) => setFormData({...formData, team: e.target.value})} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500">
                    <option value="Apoio">Apoio</option>
                    <option value="Logística">Logística</option>
                    <option value="Atendimento">Atendimento</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500">
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                  {editingVolunteer ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

