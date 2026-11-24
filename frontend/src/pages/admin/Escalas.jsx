import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarCheck, Users, Sparkles, Download, Check, X, Plus, ArrowRightLeft, Trash2, Info } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Modal, { botaoPrimario, botaoSecundario } from '../../components/Modal'
import { Carregando, Erro, Aviso, Vazio } from '../../components/Estado'
import { useApp } from '../../context/AppContext'
import useCarregar from '../../hooks/useCarregar'
import { get, post, del, patch, mensagemDeErro } from '../../api'
import { formatDateLong, formatDateBR, formatDateTime, formatHours, hhmm } from '../../utils/date'

// ---------- Escolher voluntário para uma vaga (ajuste manual) ----------
function AdicionarVoluntario({ escala, turno, onClose, onAdicionado }) {
  const { showToast } = useApp()
  const { dados: opcoes, carregando, erro } = useCarregar(() => get(`/turnos/${turno.id_turno}/elegiveis`), [turno.id_turno])
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const jaNoTurno = new Set(turno.atribuidos.map((a) => a.id_usuario))
  const lista = (opcoes?.voluntarios || []).filter((v) => !jaNoTurno.has(v.id_usuario) && (mostrarTodos || v.elegivel))

  async function escolher(v) {
    try {
      const r = await post(`/escalas/${escala.id_escala}/atribuicoes`, { id_turno: turno.id_turno, id_usuario: v.id_usuario })
      showToast(r.aviso ? `${v.nome} adicionado(a). ${r.aviso}` : `${v.nome} adicionado(a) ao turno.`, r.aviso ? 'erro' : 'ok')
      onAdicionado(r.escala)
    } catch (err) {
      showToast(mensagemDeErro(err), 'erro')
    }
  }

  return (
    <Modal title="Adicionar voluntário ao turno" onClose={onClose}>
      <p className="-mt-2 mb-4 text-[13px] text-slate-500">
        {formatDateLong(turno.data)} · {hhmm(turno.hora_inicio)}–{hhmm(turno.hora_fim)}
      </p>
      {carregando ? (
        <Carregando />
      ) : erro ? (
        <Erro erro={erro} />
      ) : (
        <>
          {opcoes.avisos?.map((a, i) => (
            <div key={i} className="mb-3">
              <Aviso>{a}</Aviso>
            </div>
          ))}
          <label className="mb-3 flex items-center gap-2 text-[13px] text-slate-600">
            <input type="checkbox" checked={mostrarTodos} onChange={(e) => setMostrarTodos(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Mostrar também quem não está disponível neste horário
          </label>
          {lista.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-[13px] text-slate-500">
              Ninguém disponível para este horário{mostrarTodos ? '' : '. Marque a opção acima para ver todos'}.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {lista.map((v) => (
                <li key={v.id_usuario}>
                  <button onClick={() => escolher(v)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[13.5px] hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="font-medium text-navy-900">{v.nome}</span>
                      <span className="ml-2 text-[12px] text-slate-500">{formatHours(v.horas_acumuladas)} acumuladas</span>
                      <span className="mt-0.5 block text-[11.5px] text-slate-400">
                        {[v.disponibilidade_digitada && 'disponibilidade digitada', v.google_agenda && 'Google Agenda'].filter(Boolean).join(' + ') ||
                          'sem informações de horário'}
                      </span>
                      {v.motivo && <span className="mt-0.5 block text-[12px] font-medium text-rose-600">{v.motivo}</span>}
                    </span>
                    {v.elegivel ? <StatusBadge status="ATIVO" label="Disponível" /> : <StatusBadge status="AUSENTE" label="Indisponível" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  )
}

// ---------- Solicitações de troca (RF15) ----------
function AnalisarTroca({ idTroca, onClose, onAnalisada }) {
  const { showToast } = useApp()
  const { dados: troca, carregando, erro } = useCarregar(() => get(`/trocas/${idTroca}`), [idTroca])
  const [enviando, setEnviando] = useState(false)

  async function decidir(aprovar) {
    setEnviando(true)
    try {
      await post(`/trocas/${idTroca}/analisar`, { aprovar })
      showToast(aprovar ? 'Troca aprovada. Os envolvidos foram notificados.' : 'Solicitação rejeitada. O voluntário foi notificado.')
      onAnalisada()
    } catch (err) {
      showToast(mensagemDeErro(err), 'erro')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal title="Analisar solicitação" onClose={onClose}>
      {carregando ? (
        <Carregando />
      ) : erro ? (
        <Erro erro={erro} />
      ) : (
        <div className="space-y-3 text-[13.5px]">
          <p>
            <span className="font-semibold text-navy-900">{troca.nome_origem}</span>{' '}
            {troca.id_usuario_destino ? (
              <>
                quer trocar com <span className="font-semibold text-navy-900">{troca.nome_destino}</span>
              </>
            ) : (
              'não poderá comparecer (desistência)'
            )}
            .
          </p>
          <p className="text-slate-600">
            {troca.acao_nome} · {formatDateLong(troca.data)} · {hhmm(troca.hora_inicio)}–{hhmm(troca.hora_fim)}
          </p>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
            <span className="font-medium">Motivo:</span> {troca.motivo || '(não informado)'}
          </p>
          {troca.id_usuario_destino &&
            (troca.destino_disponivel ? (
              <p className="text-leaf-600">✓ {troca.nome_destino} está disponível neste horário.</p>
            ) : (
              <Aviso>
                {troca.nome_destino} NÃO está disponível neste horário: {troca.destino_motivo?.toLowerCase()}.
              </Aviso>
            ))}
          {!troca.id_usuario_destino && <Aviso>Se aprovar, a vaga ficará em aberto e você poderá escolher outra pessoa na escala.</Aviso>}

          <div className="flex justify-end gap-3 pt-3">
            <button disabled={enviando} onClick={() => decidir(false)} className="focus-ring rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
              Rejeitar
            </button>
            <button disabled={enviando} onClick={() => decidir(true)} className="focus-ring rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-500 disabled:opacity-50">
              Aprovar
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function SolicitacoesDeTroca({ onMudou }) {
  const [todas, setTodas] = useState(false)
  const [analisando, setAnalisando] = useState(null)
  const { dados: trocas, carregando, erro, recarregar } = useCarregar(() => get(`/trocas${todas ? '' : '?status=PENDENTE'}`), [todas])

  return (
    <div id="trocas" className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2 text-[15px] font-bold text-navy-900">
          <ArrowRightLeft size={17} /> Solicitações de troca
        </div>
        <label className="flex items-center gap-2 text-[13px] text-slate-600">
          <input type="checkbox" checked={todas} onChange={(e) => setTodas(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Mostrar já analisadas
        </label>
      </div>
      {carregando && !trocas ? (
        <Carregando />
      ) : erro ? (
        <div className="p-5">
          <Erro erro={erro} onTentar={recarregar} />
        </div>
      ) : trocas.length === 0 ? (
        <Vazio>Nenhuma solicitação {todas ? '' : 'pendente'}.</Vazio>
      ) : (
        <div className="divide-y divide-slate-100">
          {trocas.map((t) => (
            <div key={t.id_solicitacao} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-[13.5px]">
              <div>
                <p className="font-medium text-navy-900">
                  {t.nome_origem} {t.id_usuario_destino ? `→ ${t.nome_destino}` : '(desistência)'}
                </p>
                <p className="text-[12.5px] text-slate-500">
                  {t.acao_nome} · {formatDateBR(t.data)} {hhmm(t.hora_inicio)}–{hhmm(t.hora_fim)} · pedido em {formatDateTime(t.data_solicitacao)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={t.status} />
                {t.status === 'PENDENTE' && (
                  <button onClick={() => setAnalisando(t.id_solicitacao)} className={botaoPrimario}>
                    Analisar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {analisando && (
        <AnalisarTroca
          idTroca={analisando}
          onClose={() => setAnalisando(null)}
          onAnalisada={() => {
            setAnalisando(null)
            recarregar()
            onMudou()
          }}
        />
      )}
    </div>
  )
}

// ---------- Página ----------
export default function Escalas() {
  const { showToast } = useApp()
  const [params, setParams] = useSearchParams()
  const { dados: acoes, carregando: carregandoAcoes, erro: erroAcoes } = useCarregar(() => get('/acoes'))
  const idAcao = Number(params.get('acao')) || null

  const [escala, setEscala] = useState(null)
  const [statusEscala, setStatusEscala] = useState({ carregando: false, erro: null })
  const [avisos, setAvisos] = useState([])
  const [ocupado, setOcupado] = useState(false)
  const [adicionarEm, setAdicionarEm] = useState(null)

  // Seleciona a primeira ação em aberto se nenhuma veio na URL
  useEffect(() => {
    if (!idAcao && acoes?.length) {
      const primeira = acoes.find((a) => ['PLANEJADA', 'EM_ANDAMENTO'].includes(a.status)) || acoes[0]
      setParams({ acao: primeira.id_acao }, { replace: true })
    }
  }, [acoes, idAcao, setParams])

  async function carregarEscala() {
    if (!idAcao) return
    setStatusEscala({ carregando: true, erro: null })
    try {
      const acao = await get(`/acoes/${idAcao}`)
      setEscala(acao.id_escala ? await get(`/escalas/${acao.id_escala}`) : { semEscala: true, acao })
      setStatusEscala({ carregando: false, erro: null })
    } catch (err) {
      setStatusEscala({ carregando: false, erro: err })
    }
  }

  useEffect(() => {
    setAvisos([])
    setEscala(null)
    carregarEscala()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idAcao])

  const confirmada = escala?.status === 'CONFIRMADA'
  const temEscala = escala && !escala.semEscala

  const porData = useMemo(() => {
    if (!temEscala) return []
    const mapa = new Map()
    escala.turnos.forEach((t) => {
      if (!mapa.has(t.data)) mapa.set(t.data, [])
      mapa.get(t.data).push(t)
    })
    return Array.from(mapa.entries())
  }, [escala, temEscala])

  async function executar(fn, mensagem) {
    setOcupado(true)
    try {
      const r = await fn()
      if (mensagem) showToast(typeof mensagem === 'function' ? mensagem(r) : mensagem)
      return r
    } catch (err) {
      showToast(mensagemDeErro(err), 'erro')
      return null
    } finally {
      setOcupado(false)
    }
  }

  async function gerar() {
    if (temEscala && !window.confirm('Gerar de novo substitui a proposta atual (inclusive os ajustes manuais). Continuar?')) return
    const r = await executar(() => post(`/acoes/${idAcao}/escala`), 'Proposta gerada! Revise antes de confirmar.')
    if (r) {
      setEscala(r)
      setAvisos(r.avisos || [])
    }
  }

  async function confirmar() {
    const faltam = escala.total_vagas_faltando
    const texto = faltam
      ? `Ainda faltam ${faltam} vaga(s). Confirmar mesmo assim? A gestão será avisada das vagas em aberto.`
      : 'Confirmar esta escala? Os voluntários serão avisados por e-mail.'
    if (!window.confirm(texto)) return
    const r = await executar(
      () => post(`/escalas/${escala.id_escala}/confirmar`),
      (res) =>
        res.emails.falhas
          ? `Escala confirmada! ${res.emails.enviados} e-mail(s) enviados, ${res.emails.falhas} não enviados (verifique o SMTP em Configurações).`
          : `Escala confirmada! ${res.emails.enviados} voluntário(s) notificado(s) por e-mail.`,
    )
    if (r) setEscala(r)
  }

  async function descartar() {
    if (!window.confirm('Descartar esta proposta?')) return
    const r = await executar(() => del(`/escalas/${escala.id_escala}`), 'Proposta descartada.')
    if (r) carregarEscala()
  }

  async function remover(atrib) {
    const texto = confirmada
      ? `Retirar ${atrib.nome} deste turno? A escala já foi confirmada: a pessoa será avisada por e-mail.`
      : `Retirar ${atrib.nome} deste turno?`
    if (!window.confirm(texto)) return
    const r = await executar(() => del(`/escalas/${escala.id_escala}/atribuicoes/${atrib.id_atribuicao}`), `${atrib.nome} retirado(a) do turno.`)
    if (r) setEscala(r)
  }

  async function marcarPresenca(atrib, status) {
    const r = await executar(() => patch(`/atribuicoes/${atrib.id_atribuicao}/presenca`, { status_presenca: status }), 'Presença registrada.')
    if (r) carregarEscala()
  }

  function exportarCsv() {
    const linhas = [['Data', 'Início', 'Fim', 'Vagas', 'Voluntários', 'Faltando']]
    escala.turnos.forEach((t) =>
      linhas.push([
        formatDateBR(t.data),
        hhmm(t.hora_inicio),
        hhmm(t.hora_fim),
        t.qtd_voluntarios_necessaria,
        t.atribuidos.filter((a) => a.status_presenca !== 'AUSENTE').map((a) => a.nome).join('; '),
        t.vagas_faltando,
      ]),
    )
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `escala-${escala.acao_nome.replace(/\W+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader icon={CalendarCheck} title="Escalas" subtitle="Gere a proposta automaticamente, revise, ajuste e confirme." />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
        {carregandoAcoes ? (
          <Carregando />
        ) : erroAcoes ? (
          <Erro erro={erroAcoes} />
        ) : acoes.length === 0 ? (
          <p className="text-[13.5px] text-slate-500">Cadastre uma ação com turnos em “Ações / Eventos” para gerar escalas.</p>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-[13px] font-semibold text-navy-900">Ação / Evento</label>
              <select
                value={idAcao || ''}
                onChange={(e) => setParams({ acao: e.target.value })}
                className="focus-ring w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13.5px] text-navy-900"
              >
                {acoes.map((a) => (
                  <option key={a.id_acao} value={a.id_acao}>
                    {a.nome} {a.status_escala === 'CONFIRMADA' ? '· confirmada' : a.status_escala === 'PROPOSTA' ? '· em proposta' : ''}
                  </option>
                ))}
              </select>
            </div>
            {!confirmada && (
              <button onClick={gerar} disabled={ocupado || !escala} className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                <Sparkles size={16} />
                {temEscala ? 'Gerar novamente' : 'Gerar proposta de escala'}
              </button>
            )}
          </div>
        )}
      </div>

      {avisos.length > 0 && (
        <div className="mt-4 space-y-2">
          {avisos.map((a, i) => (
            <Aviso key={i}>{a}</Aviso>
          ))}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-navy-900">
            <Users size={17} />
            {confirmada ? 'Escala confirmada' : 'Proposta de escala'}
            {temEscala && <StatusBadge status={escala.status} />}
          </div>
          {temEscala && (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={exportarCsv} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-medium text-navy-900 hover:bg-slate-50">
                <Download size={14} /> Exportar
              </button>
              {!confirmada && (
                <>
                  <button onClick={descartar} disabled={ocupado} className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    <Trash2 size={14} /> Descartar
                  </button>
                  <button onClick={confirmar} disabled={ocupado} className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-leaf-600 px-3 py-2 text-[13px] font-medium text-white hover:bg-leaf-500 disabled:opacity-50">
                    <Check size={14} /> Confirmar escala
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {statusEscala.carregando && !escala ? (
          <Carregando />
        ) : statusEscala.erro ? (
          <div className="p-5">
            <Erro erro={statusEscala.erro} onTentar={carregarEscala} />
          </div>
        ) : !escala ? null : escala.semEscala ? (
          <Vazio>
            {escala.acao.turnos.length === 0 ? (
              <>Esta ação ainda não tem turnos. Cadastre-os em “Ações / Eventos”.</>
            ) : (
              <>
                Nenhuma escala gerada para esta ação ainda. Clique em <strong>Gerar proposta de escala</strong> para cruzar a disponibilidade dos voluntários
                (digitada e Google Agenda) com os {escala.acao.turnos.length} turno(s), priorizando quem tem menos horas.
              </>
            )}
          </Vazio>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5 text-[12.5px] text-slate-500">
              <span>Gerada em {formatDateTime(escala.data_geracao)}</span>
              {confirmada && escala.confirmada_por && <span>Confirmada por {escala.confirmada_por}</span>}
              <span className={escala.total_vagas_faltando ? 'font-semibold text-amber-700' : 'text-leaf-600'}>
                {escala.total_vagas_faltando ? `${escala.total_vagas_faltando} vaga(s) sem voluntário` : 'Todas as vagas preenchidas'}
              </span>
            </div>
            {confirmada && (
              <div className="flex items-start gap-2 border-b border-slate-100 px-5 py-2.5 text-[12.5px] text-slate-500">
                <Info size={14} className="mt-0.5 shrink-0" />
                Escala confirmada: ainda dá para incluir/retirar pessoas (elas recebem e-mail) e registrar a presença depois do turno.
              </div>
            )}

            {porData.map(([data, turnos]) => (
              <div key={data}>
                <h3 className="border-b border-slate-100 bg-white px-5 pb-2 pt-4 text-[13.5px] font-bold text-navy-900">{formatDateLong(data)}</h3>
                <div className="divide-y divide-slate-100">
                  {turnos.map((t) => (
                    <div key={t.id_turno} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-start">
                      <div className="w-32 shrink-0 text-[13.5px] font-medium text-navy-900">
                        {hhmm(t.hora_inicio)} – {hhmm(t.hora_fim)}
                        <p className={`text-[12px] font-normal ${t.vagas_faltando ? 'text-amber-700' : 'text-slate-400'}`}>
                          {t.qtd_voluntarios_necessaria - t.vagas_faltando}/{t.qtd_voluntarios_necessaria} vagas
                        </p>
                      </div>
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        {t.atribuidos.map((a) => (
                          <span
                            key={a.id_atribuicao}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] font-medium ${
                              a.status_presenca === 'AUSENTE' ? 'bg-rose-50 text-rose-400 line-through' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {a.nome}
                            {confirmada && (
                              <select
                                value={a.status_presenca}
                                onChange={(e) => marcarPresenca(a, e.target.value)}
                                title="Presença"
                                className="rounded border-0 bg-transparent py-0 pl-1 pr-5 text-[11.5px] text-slate-500 no-underline"
                              >
                                <option value="CONFIRMADO">confirmado</option>
                                <option value="PRESENTE">presente</option>
                                <option value="AUSENTE">ausente</option>
                              </select>
                            )}
                            <button onClick={() => remover(a)} title="Retirar do turno" className="text-slate-400 hover:text-rose-600">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        {t.atribuidos.length === 0 && <span className="text-[12.5px] italic text-slate-400">Vazio</span>}
                        <button
                          onClick={() => setAdicionarEm(t)}
                          className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 px-2 py-1 text-[12px] font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600"
                        >
                          <Plus size={12} /> adicionar
                        </button>
                      </div>
                      <div className="shrink-0">
                        {t.vagas_faltando ? <StatusBadge status="PENDENTE" label={`Faltam ${t.vagas_faltando}`} /> : <StatusBadge status="CONFIRMADO" label="Completo" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <SolicitacoesDeTroca onMudou={carregarEscala} />

      {adicionarEm && (
        <AdicionarVoluntario
          escala={escala}
          turno={adicionarEm}
          onClose={() => setAdicionarEm(null)}
          onAdicionado={(nova) => {
            setEscala(nova)
            setAdicionarEm(null)
          }}
        />
      )}
    </div>
  )
}
