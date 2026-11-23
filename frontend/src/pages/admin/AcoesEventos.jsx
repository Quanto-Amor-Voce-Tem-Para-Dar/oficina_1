import React, { useState } from 'react'
import { CalendarDays, MapPin, ArrowRight, Plus, Edit2, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import ShiftChip from '../../components/ShiftChip'
import { useApp } from '../../context/AppContext'
import { formatDateBR } from '../../utils/date'

export default function AcoesEventos() {
  const { actions, addAction, updateAction, removeAction, showToast } = useApp()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAction, setEditingAction] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    dates: '',
    shiftsTemplate: [] // Mantido vazio para o protótipo simplificado
  })

  const handleOpenModal = (action = null) => {
    if (action) {
      setEditingAction(action)
      setFormData({
        title: action.title,
        location: action.location,
        dates: action.dates.join(', '),
        shiftsTemplate: action.shiftsTemplate
      })
    } else {
      setEditingAction(null)
      setFormData({ title: '', location: '', dates: '', shiftsTemplate: [] })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAction(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Tratamento básico para transformar a string de datas em array (Y-M-D)
    const processedDates = formData.dates.split(',').map(d => d.trim()).filter(d => d)

    const actionData = {
      ...formData,
      dates: processedDates
    }

    if (editingAction) {
      updateAction(editingAction.id, actionData)
      showToast('Ação/Evento atualizada com sucesso!')
    } else {
      addAction(actionData)
      showToast('Ação/Evento cadastrada com sucesso!')
    }
    handleCloseModal()
  }

  const handleDelete = (id) => {
     if (window.confirm('Tem certeza que deseja excluir esta ação? As escalas associadas podem ser perdidas.')) {
        removeAction(id)
        showToast('Ação removida com sucesso.')
     }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <PageHeader
          icon={CalendarDays}
          title="Ações / Eventos"
          subtitle="Cadastro das atividades do projeto e os turnos que cada uma exige."
        />
        <button
           onClick={() => handleOpenModal()}
           className="mt-4 sm:mt-0 flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
        >
          <Plus size={16} />
          Nova Ação
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {actions.map((a) => (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft relative group">
            
            <div className="absolute top-4 right-4 hidden group-hover:flex items-center gap-2">
               <button onClick={() => handleOpenModal(a)} className="p-1.5 bg-white text-slate-400 hover:text-brand-600 rounded-md shadow-sm border border-slate-200">
                  <Edit2 size={14} />
               </button>
               <button onClick={() => handleDelete(a.id)} className="p-1.5 bg-white text-slate-400 hover:text-red-600 rounded-md shadow-sm border border-slate-200">
                  <Trash2 size={14} />
               </button>
            </div>

            <h2 className="text-[15.5px] font-bold text-navy-900 pr-16">{a.title}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500">
              <MapPin size={14} /> {a.location}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.dates.map((d) => (
                <span
                  key={d}
                  className="rounded-md border border-slate-200 px-2 py-1 text-[12px] font-medium text-slate-600"
                >
                  {formatDateBR(d)}
                </span>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {a.shiftsTemplate && a.shiftsTemplate.length > 0 ? (
                 a.shiftsTemplate.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">
                      {s.start} – {s.end}
                    </span>
                    <ShiftChip label={s.label} color={s.color} />
                    <span className="text-slate-400">{s.needed} vaga(s)</span>
                  </div>
                 ))
              ) : (
                 <div className="text-[12.5px] text-slate-400 italic">Nenhum turno cadastrado para esta ação.</div>
              )}
            </div>

            <Link
              to="/admin/escalas"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
            >
              Gerar escala para esta ação <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>

       {/* Modal de Cadastro de Ação */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-bold text-navy-900">
              {editingAction ? 'Editar Ação/Evento' : 'Nova Ação/Evento'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Título da Ação</label>
                <input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500" placeholder="Ex: Feira de Adoção" />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Localização</label>
                <input required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500" placeholder="Ex: Praça Central" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Datas (separadas por vírgula)</label>
                <input required value={formData.dates} onChange={(e) => setFormData({...formData, dates: e.target.value})} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-brand-500" placeholder="Ex: 2026-10-15, 2026-10-16" />
                 <p className="text-[11px] text-slate-500 mt-1">Formato sugerido: YYYY-MM-DD</p>
              </div>

               {/* Nota sobre os turnos no protótipo */}
               <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-[12px] text-blue-800 font-medium">Nota sobre Turnos (RF03)</p>
                  <p className="text-[11.5px] text-blue-600 mt-1">Para simplificar este protótipo, a adição dinâmica de turnos por interface foi omitida. No sistema final, aqui haveria um botão para "Adicionar Turno" informando horário e vagas.</p>
               </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800">
                  {editingAction ? 'Salvar Alterações' : 'Cadastrar Ação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}