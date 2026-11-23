import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ArrowRight, Plus, Edit2, Trash2, Clock, Users } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Modal, { campo, rotulo, botaoPrimario, botaoSecundario } from '../../components/Modal'
import { Carregando, Erro, Vazio } from '../../components/Estado'
import { useApp } from '../../context/AppContext'
import useCarregar from '../../hooks/useCarregar'
import { get, post, put, del, mensagemDeErro } from '../../api'
import { formatDateBR, formatDateLong, hojeISO } from '../../utils/date'

const STATUS = [
  ['PLANEJADA', 'Planejada'],
  ['EM_ANDAMENTO', 'Em andamento'],
  ['CONCLUIDA', 'Concluída'],
  ['CANCELADA', 'Cancelada'],
]

const TURNO_VAZIO = { data: '', hora_inicio: '08:00', hora_fim: '12:00', qtd_voluntarios_necessaria: 1 }

// Modal com a ação e a lista de turnos (adicionar, editar, excluir).
function GerenciarTurnos({ idAcao, onClose, onMudou }) {
  const { showToast } = useApp()
  const { dados: acao, carregando, erro, recarregar } = useCarregar(() => get(`/acoes/${idAcao}`), [idAcao])
  const [form, setForm] = useState({ ...TURNO_VAZIO, data: hojeISO() })
  const [editandoId, setEditandoId] = useState(null)
  const [erroForm, setErroForm] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setErroForm('')
    setSalvando(true)
    try {
      const corpo = { ...form, qtd_voluntarios_necessaria: Number(form.qtd_voluntarios_necessaria) }
      if (editandoId) await put(`/turnos/${editandoId}`, corpo)
      else await post(`/acoes/${idAcao}/turnos`, corpo)
      showToast(editandoId ? 'Turno atualizado.' : 'Turno adicionado.')
      setEditandoId(null)
      setForm({ ...TURNO_VAZIO, data: form.data })
      await recarregar()
      onMudou()
    } catch (err) {
      setErroForm(mensagemDeErro(err))
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(turno) {
    if (!window.confirm(`Excluir o turno de ${formatDateBR(turno.data)}, ${turno.hora_inicio}–${turno.hora_fim}?`)) return
    try {
      await del(`/turnos/${turno.id_turno}`)
      showToast('Turno excluído.')
      await recarregar()
      onMudou()
    } catch (err) {
      showToast(mensagemDeErro(err), 'erro')
    }
  }

  function editar(turno) {
    setEditandoId(turno.id_turno)
    setForm({ data: turno.data, hora_inicio: turno.hora_inicio, hora_fim: turno.hora_fim, qtd_voluntarios_necessaria: turno.qtd_voluntarios_necessaria })
  }

  return (
    <Modal title={acao ? `Turnos · ${acao.nome}` : 'Turnos'} onClose={onClose} largura="max-w-2xl">
      {carregando && !acao ? (
        <Carregando />
      ) : erro ? (
        <Erro erro={erro} onTentar={recarregar} />
      ) : (
        <>
          {acao.turnos.length === 0 ? (
            <p className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-[13px] text-slate-500">Nenhum turno cadastrado. Adicione abaixo.</p>
          ) : (
            <div className="mb-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {acao.turnos.map((t) => (
                <div key={t.id_turno} className={`flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] ${editandoId === t.id_turno ? 'bg-brand-50' : ''}`}>
                  <div>
                    <p className="font-medium text-navy-900">{formatDateLong(t.data)}</p>
                    <p className="text-slate-500">
                      {t.hora_inicio} – {t.hora_fim} · {t.qtd_voluntarios_necessaria} vaga(s)
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editar(t)} title="Editar" className="focus-ring rounded p-1.5 text-slate-400 hover:text-brand-600">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => excluir(t)} title="Excluir" className="focus-ring rounded p-1.5 text-slate-400 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={salvar} className="rounded-lg border border-slate-200 p-4">
            <p className="mb-3 text-[13.5px] font-semibold text-navy-900">{editandoId ? 'Editar turno' : 'Adicionar turno'}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-1">
                <label className={rotulo}>Data</label>
                <input type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className={campo} />
              </div>
              <div>
                <label className={rotulo}>Início</label>
                <input type="time" required value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} className={campo} />
              </div>
              <div>
                <label className={rotulo}>Fim</label>
                <input type="time" required value={form.hora_fim} onChange={(e) => setForm({ ...form, hora_fim: e.target.value })} className={campo} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className={rotulo}>Vagas</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.qtd_voluntarios_necessaria}
                  onChange={(e) => setForm({ ...form, qtd_voluntarios_necessaria: e.target.value })}
                  className={campo}
                />
              </div>
            </div>
            {erroForm && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{erroForm}</p>}
            <div className="mt-4 flex justify-end gap-3">
              {editandoId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditandoId(null)
                    setForm({ ...TURNO_VAZIO, data: form.data })
                  }}
                  className={botaoSecundario}
                >
                  Cancelar edição
                </button>
              )}
              <button type="submit" disabled={salvando} className={botaoPrimario}>
                {editandoId ? 'Salvar turno' : (
                  <>
                    <Plus size={15} /> Adicionar
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </Modal>
  )
}

export default function AcoesEventos() {
  const { showToast } = useApp()
  const { dados: acoes, carregando, erro, recarregar } = useCarregar(() => get('/acoes'))
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nome: '', descricao: '', status: 'PLANEJADA' })
  const [erroForm, setErroForm] = useState('')
  const [turnosDe, setTurnosDe] = useState(null)

  function abrir(acao = {}) {
    setEditando(acao)
    setErroForm('')
    setForm({ nome: acao.nome || '', descricao: acao.descricao || '', status: acao.status || 'PLANEJADA' })
  }

  async function salvar(e) {
    e.preventDefault()
    setErroForm('')
    try {
      if (editando.id_acao) {
        await put(`/acoes/${editando.id_acao}`, form)
        showToast('Ação atualizada com sucesso!')
        setEditando(null)
      } else {
        const nova = await post('/acoes', form)
        showToast('Ação cadastrada! Agora adicione os turnos.')
        setEditando(null)
        setTurnosDe(nova.id_acao)
      }
      recarregar()
    } catch (err) {
      setErroForm(mensagemDeErro(err))
    }
  }

  async function excluir(acao) {
    if (!window.confirm(`Excluir "${acao.nome}"? Os turnos e escalas em proposta serão apagados.`)) return
    try {
      await del(`/acoes/${acao.id_acao}`)
      showToast('Ação excluída.')
      recarregar()
    } catch (err) {
      showToast(mensagemDeErro(err), 'erro')
    }
  }

  return (
    <div>
      <PageHeader
        icon={CalendarDays}
        title="Ações / Eventos"
        subtitle="Cadastro das atividades do projeto e dos turnos que cada uma exige."
        action={
          <button onClick={() => abrir()} className={botaoPrimario}>
            <Plus size={16} />
            Nova ação
          </button>
        }
      />

      {carregando && !acoes ? (
        <Carregando />
      ) : erro ? (
        <Erro erro={erro} onTentar={recarregar} />
      ) : acoes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
          <Vazio>Nenhuma ação cadastrada ainda. Clique em “Nova ação” para começar.</Vazio>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {acoes.map((a) => (
            <div key={a.id_acao} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[15.5px] font-bold text-navy-900">{a.nome}</h2>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => abrir(a)} title="Editar ação" className="focus-ring rounded-md border border-slate-200 p-1.5 text-slate-400 hover:text-brand-600">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => excluir(a)} title="Excluir ação" className="focus-ring rounded-md border border-slate-200 p-1.5 text-slate-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={a.status} />
                {a.status_escala && <StatusBadge status={a.status_escala} label={`Escala ${a.status_escala === 'CONFIRMADA' ? 'confirmada' : 'em proposta'}`} />}
              </div>

              {a.descricao && <p className="mt-3 text-[13px] text-slate-600">{a.descricao}</p>}

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> {a.total_turnos} turno(s)
                </span>
                {a.primeira_data && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    {a.primeira_data === a.ultima_data
                      ? formatDateBR(a.primeira_data)
                      : `${formatDateBR(a.primeira_data)} a ${formatDateBR(a.ultima_data)}`}
                  </span>
                )}
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-4 pt-4">
                <button onClick={() => setTurnosDe(a.id_acao)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-navy-900 hover:text-brand-700">
                  <Users size={14} /> Gerenciar turnos
                </button>
                <Link
                  to={`/admin/escalas?acao=${a.id_acao}`}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
                >
                  {a.status_escala ? 'Ver escala' : 'Gerar escala'} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {editando && (
        <Modal title={editando.id_acao ? 'Editar ação/evento' : 'Nova ação/evento'} onClose={() => setEditando(null)}>
          <form onSubmit={salvar} className="space-y-4">
            <div>
              <label className={rotulo}>Nome da ação</label>
              <input required maxLength={100} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={campo} placeholder="Ex.: Feira de Doações – Praça Central" />
            </div>
            <div>
              <label className={rotulo}>Descrição (local, observações...)</label>
              <textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={campo} />
            </div>
            <div>
              <label className={rotulo}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={campo}>
                {STATUS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            {erroForm && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{erroForm}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditando(null)} className={botaoSecundario}>
                Cancelar
              </button>
              <button type="submit" className={botaoPrimario}>
                {editando.id_acao ? 'Salvar alterações' : 'Cadastrar e adicionar turnos'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {turnosDe && <GerenciarTurnos idAcao={turnosDe} onClose={() => setTurnosDe(null)} onMudou={recarregar} />}
    </div>
  )
}
