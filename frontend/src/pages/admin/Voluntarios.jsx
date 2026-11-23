import React, { useMemo, useState } from 'react'
import { Users, Search, Plus, Edit2, UserX, UserCheck, Eye } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Modal, { campo, rotulo, botaoPrimario, botaoSecundario } from '../../components/Modal'
import { Carregando, Erro, Vazio } from '../../components/Estado'
import { useApp } from '../../context/AppContext'
import useCarregar from '../../hooks/useCarregar'
import { get, post, put, del, mensagemDeErro } from '../../api'
import { formatDateBR, formatHours, iniciais, DAY_LABELS } from '../../utils/date'

const FORM_VAZIO = { nome: '', email: '', senha: '', perfil: 'VOLUNTARIO', status: 'ATIVO' }

function DetalhesVoluntario({ usuario, onClose }) {
  const { dados, carregando, erro } = useCarregar(
    () => Promise.all([get(`/usuarios/${usuario.id_usuario}/disponibilidade`), get(`/usuarios/${usuario.id_usuario}/historico`)]),
    [usuario.id_usuario],
  )
  const [disponibilidade, historico] = dados || [[], { participacoes: [] }]

  return (
    <Modal title={usuario.nome} onClose={onClose} largura="max-w-2xl">
      <p className="-mt-2 mb-4 text-[13px] text-slate-500">
        {usuario.email} · cadastrado em {formatDateBR(usuario.criado_em)} · {formatHours(usuario.horas_acumuladas)} acumuladas
      </p>
      {carregando ? (
        <Carregando />
      ) : erro ? (
        <Erro erro={erro} />
      ) : (
        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-[14px] font-bold text-navy-900">Disponibilidade semanal</h3>
            {disponibilidade.length === 0 ? (
              <p className="text-[13px] text-slate-500">Não informada.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {disponibilidade.map((d) => (
                  <li key={d.id_disponibilidade} className="rounded-md bg-slate-100 px-2.5 py-1 text-[12.5px] text-slate-700">
                    {DAY_LABELS[d.dia_semana]} · {d.hora_inicio}–{d.hora_fim}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="mb-2 text-[14px] font-bold text-navy-900">Histórico de participação</h3>
            {historico.participacoes.length === 0 ? (
              <p className="text-[13px] text-slate-500">Nenhuma participação em escalas confirmadas.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                {historico.participacoes.map((p) => (
                  <div key={p.id_atribuicao} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]">
                    <div>
                      <p className="font-medium text-navy-900">{p.acao}</p>
                      <p className="text-[12px] text-slate-500">
                        {formatDateBR(p.data)} · {p.hora_inicio.slice(0, 5)}–{p.hora_fim.slice(0, 5)} · {formatHours(p.horas)}
                      </p>
                    </div>
                    <StatusBadge status={p.status_presenca} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  )
}

export default function Voluntarios() {
  const { showToast, usuario: eu } = useApp()
  const [query, setQuery] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState('VOLUNTARIO')
  const [editando, setEditando] = useState(null) // null = fechado | {} = novo | usuario = edição
  const [detalhes, setDetalhes] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [erroForm, setErroForm] = useState('')
  const [salvando, setSalvando] = useState(false)

  const { dados: usuarios, carregando, erro, recarregar } = useCarregar(() => get('/usuarios'))

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (usuarios || []).filter(
      (u) =>
        (!filtroPerfil || u.perfil === filtroPerfil) &&
        (!q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    )
  }, [usuarios, query, filtroPerfil])

  function abrir(usuario = {}) {
    setEditando(usuario)
    setErroForm('')
    setForm(usuario.id_usuario ? { ...FORM_VAZIO, ...usuario, senha: '' } : { ...FORM_VAZIO, perfil: filtroPerfil || 'VOLUNTARIO' })
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErroForm('')
    try {
      const corpo = { nome: form.nome, email: form.email, perfil: form.perfil, status: form.status }
      if (form.senha) corpo.senha = form.senha
      if (editando.id_usuario) {
        await put(`/usuarios/${editando.id_usuario}`, corpo)
        showToast('Cadastro atualizado com sucesso!')
      } else {
        await post('/usuarios', corpo)
        showToast('Cadastro realizado! Passe o e-mail e a senha para a pessoa entrar no sistema.')
      }
      setEditando(null)
      recarregar()
    } catch (err) {
      setErroForm(mensagemDeErro(err))
    } finally {
      setSalvando(false)
    }
  }

  async function alternarStatus(u) {
    const desativar = u.status === 'ATIVO'
    if (desativar && !window.confirm(`Desativar ${u.nome}? A pessoa não poderá mais entrar nem ser escalada (o histórico é mantido).`)) return
    try {
      if (desativar) await del(`/usuarios/${u.id_usuario}`)
      else await put(`/usuarios/${u.id_usuario}`, { status: 'ATIVO' })
      showToast(desativar ? 'Cadastro desativado.' : 'Cadastro reativado.')
      recarregar()
    } catch (err) {
      showToast(mensagemDeErro(err), 'erro')
    }
  }

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Voluntários"
        subtitle="Membros cadastrados no projeto e seus perfis de acesso."
        action={
          <button onClick={() => abrir()} className={botaoPrimario}>
            <Plus size={16} />
            Novo cadastro
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 sm:max-w-sm">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="w-full text-[13.5px] outline-none placeholder:text-slate-400"
          />
        </div>
        <select value={filtroPerfil} onChange={(e) => setFiltroPerfil(e.target.value)} className="focus-ring rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13.5px]">
          <option value="VOLUNTARIO">Voluntários</option>
          <option value="ADMINISTRADOR">Administradores</option>
          <option value="">Todos</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        {carregando && !usuarios ? (
          <Carregando />
        ) : erro ? (
          <div className="p-5">
            <Erro erro={erro} onTentar={recarregar} />
          </div>
        ) : filtrados.length === 0 ? (
          <Vazio>Nenhum cadastro encontrado.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="text-[12.5px] font-semibold text-slate-500">
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Perfil</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Desde</th>
                  <th className="px-5 py-3">Horas</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((u) => (
                  <tr key={u.id_usuario} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-[12px] font-semibold text-brand-700">
                          {iniciais(u.nome)}
                        </span>
                        <div>
                          <p className="font-medium text-navy-900">{u.nome}</p>
                          <p className="text-[12.5px] text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={u.perfil} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDateBR(u.criado_em)}</td>
                    <td className="px-5 py-4 font-medium text-navy-900">{formatHours(u.horas_acumuladas)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDetalhes(u)} title="Ver disponibilidade e histórico" className="focus-ring rounded p-1.5 text-slate-400 hover:text-brand-600">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => abrir(u)} title="Editar" className="focus-ring rounded p-1.5 text-slate-400 hover:text-brand-600">
                          <Edit2 size={16} />
                        </button>
                        {u.id_usuario !== eu.id_usuario && (
                          <button
                            onClick={() => alternarStatus(u)}
                            title={u.status === 'ATIVO' ? 'Desativar' : 'Reativar'}
                            className={`focus-ring rounded p-1.5 text-slate-400 ${u.status === 'ATIVO' ? 'hover:text-red-600' : 'hover:text-leaf-600'}`}
                          >
                            {u.status === 'ATIVO' ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editando && (
        <Modal title={editando.id_usuario ? 'Editar cadastro' : 'Novo cadastro'} onClose={() => setEditando(null)}>
          <form onSubmit={salvar} className="space-y-4">
            <div>
              <label className={rotulo}>Nome completo</label>
              <input required maxLength={100} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={campo} />
            </div>
            <div>
              <label className={rotulo}>E-mail (de preferência o institucional)</label>
              <input required type="email" maxLength={100} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={campo} />
            </div>
            <div>
              <label className={rotulo}>{editando.id_usuario ? 'Nova senha (deixe em branco para manter)' : 'Senha inicial'}</label>
              <input
                type="text"
                minLength={6}
                required={!editando.id_usuario}
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                className={campo}
                placeholder="mínimo 6 caracteres"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={rotulo}>Perfil</label>
                <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })} className={campo}>
                  <option value="VOLUNTARIO">Voluntário</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>
              <div>
                <label className={rotulo}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={campo}>
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
            </div>

            {erroForm && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{erroForm}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditando(null)} className={botaoSecundario}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className={botaoPrimario}>
                {editando.id_usuario ? 'Salvar alterações' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detalhes && <DetalhesVoluntario usuario={detalhes} onClose={() => setDetalhes(null)} />}
    </div>
  )
}
