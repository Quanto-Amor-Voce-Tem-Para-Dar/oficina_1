import React, { useMemo, useState } from 'react'
import { CalendarCheck, ArrowRightLeft, Users } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import Modal, { campo, rotulo, botaoPrimario, botaoSecundario } from '../../components/Modal'
import { Carregando, Erro, Vazio } from '../../components/Estado'
import { useApp } from '../../context/AppContext'
import useCarregar from '../../hooks/useCarregar'
import { get, post, mensagemDeErro } from '../../api'
import { formatDateLong, formatDateBR, formatDateTime, hhmm, hojeISO } from '../../utils/date'

// Pedido de troca ou desistência (RF14) — Figura 7
function SolicitarTroca({ turno, onClose, onEnviado }) {
  const { showToast } = useApp()
  const { dados: colegas } = useCarregar(() => get('/voluntarios/opcoes'))
  const [motivo, setMotivo] = useState('')
  const [destino, setDestino] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar(e) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    try {
      await post(`/atribuicoes/${turno.id_atribuicao}/trocas`, {
        motivo,
        ...(destino ? { id_usuario_destino: Number(destino) } : {}),
      })
      showToast('Solicitação enviada! A gestão vai analisar e você receberá a resposta por e-mail.')
      onEnviado()
    } catch (err) {
      setErro(mensagemDeErro(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal title="Solicitar troca de turno" onClose={onClose}>
      <p className="-mt-2 mb-4 text-[13px] text-slate-500">
        {turno.acao} · {formatDateLong(turno.data)} · {turno.hora_inicio}–{turno.hora_fim}
      </p>
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label className={rotulo}>Quem pode ficar no seu lugar? (opcional)</label>
          <select value={destino} onChange={(e) => setDestino(e.target.value)} className={campo}>
            <option value="">Ninguém combinado — só não poderei ir</option>
            {(colegas || []).map((c) => (
              <option key={c.id_usuario} value={c.id_usuario}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotulo}>Motivo</label>
          <textarea required rows={3} maxLength={2000} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={campo} placeholder="Ex.: prova na faculdade nesse horário" />
        </div>
        {erro && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{erro}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className={botaoSecundario}>
            Cancelar
          </button>
          <button type="submit" disabled={enviando} className={botaoPrimario}>
            Enviar solicitação
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function MinhaEscala() {
  const { usuario } = useApp()
  const { dados, carregando, erro, recarregar } = useCarregar(() => Promise.all([get('/minha-escala'), get('/trocas')]))
  const [trocando, setTrocando] = useState(null)
  const [mostrarPassados, setMostrarPassados] = useState(false)

  const [turnos, trocas] = dados || [[], []]
  const hoje = hojeISO()

  const agrupados = useMemo(() => {
    const mapa = new Map()
    turnos
      .filter((t) => mostrarPassados || t.data >= hoje)
      .forEach((t) => {
        if (!mapa.has(t.data)) mapa.set(t.data, [])
        mapa.get(t.data).push(t)
      })
    return Array.from(mapa.entries())
  }, [turnos, mostrarPassados, hoje])

  return (
    <div>
      <PageHeader
        icon={CalendarCheck}
        title="Minha Escala"
        subtitle="Seus turnos em escalas confirmadas."
        action={
          <label className="flex items-center gap-2 text-[13px] text-slate-600">
            <input type="checkbox" checked={mostrarPassados} onChange={(e) => setMostrarPassados(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Mostrar turnos passados
          </label>
        }
      />

      {carregando && !dados ? (
        <Carregando />
      ) : erro ? (
        <Erro erro={erro} onTentar={recarregar} />
      ) : (
        <>
          {agrupados.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
              <Vazio>Você não tem turnos {mostrarPassados ? '' : 'futuros '}em escalas confirmadas. Mantenha sua disponibilidade atualizada para ser escalado(a).</Vazio>
            </div>
          ) : (
            <div className="space-y-5">
              {agrupados.map(([data, itens]) => (
                <div key={data} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
                  <div className="border-b border-slate-100 px-5 py-3.5">
                    <h2 className="text-[14px] font-bold text-navy-900">{formatDateLong(data)}</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {itens.map((t) => {
                      const futuro = t.data >= hoje
                      const pendente = t.status_troca === 'PENDENTE'
                      return (
                        <div key={t.id_atribuicao} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[13.5px] font-semibold text-navy-900">
                              {t.hora_inicio} – {t.hora_fim} · {t.acao}
                            </p>
                            {t.descricao && <p className="mt-0.5 text-[12.5px] text-slate-500">{t.descricao}</p>}
                            {t.colegas && (
                              <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate-500">
                                <Users size={12.5} /> Com: {t.colegas}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {pendente ? <StatusBadge status="PENDENTE" label="Troca pendente" /> : <StatusBadge status={t.status_presenca} />}
                            {futuro && !pendente && t.status_presenca === 'CONFIRMADO' && (
                              <button
                                onClick={() => setTrocando(t)}
                                className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50"
                              >
                                <ArrowRightLeft size={13} /> Solicitar troca
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {trocas.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <h2 className="text-[14px] font-bold text-navy-900">Minhas solicitações de troca</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {trocas.map((s) => (
                  <div key={s.id_solicitacao} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[13px]">
                    <div>
                      <p className="font-medium text-navy-900">
                        {s.acao_nome} · {formatDateBR(s.data)} {hhmm(s.hora_inicio)}–{hhmm(s.hora_fim)}
                      </p>
                      <p className="text-[12px] text-slate-500">
                        {s.id_usuario_origem === usuario.id_usuario
                          ? s.id_usuario_destino
                            ? `Você pediu para ${s.nome_destino} assumir`
                            : 'Você informou que não poderá ir'
                          : `${s.nome_origem} indicou você para assumir`}{' '}
                        · {formatDateTime(s.data_solicitacao)}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {trocando && (
        <SolicitarTroca
          turno={trocando}
          onClose={() => setTrocando(null)}
          onEnviado={() => {
            setTrocando(null)
            recarregar()
          }}
        />
      )}
    </div>
  )
}
