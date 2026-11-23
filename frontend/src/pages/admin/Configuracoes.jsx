import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Settings, Calendar, Mail, KeyRound, History, CheckCircle2, XCircle } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { campo, rotulo, botaoPrimario } from '../../components/Modal'
import { Carregando, Erro, Vazio } from '../../components/Estado'
import { useApp } from '../../context/AppContext'
import useCarregar from '../../hooks/useCarregar'
import { get, put, del, mensagemDeErro } from '../../api'
import { formatDateTime } from '../../utils/date'

const RESULTADO_GOOGLE = {
  ok: ['Google Agenda conectado com sucesso!', 'ok'],
  cancelado: ['Conexão com o Google cancelada.', 'erro'],
  expirado: ['O pedido de conexão expirou. Tente de novo.', 'erro'],
  erro: ['Não foi possível conectar o Google. Veja o log do servidor.', 'erro'],
}

function Secao({ icon: Icon, titulo, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-navy-900">
        <Icon size={17} /> {titulo}
      </h2>
      {children}
    </section>
  )
}

function Situacao({ ok, children }) {
  return (
    <p className={`flex items-center gap-2 text-[13.5px] ${ok ? 'text-leaf-600' : 'text-slate-500'}`}>
      {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {children}
    </p>
  )
}

export default function Configuracoes() {
  const { showToast } = useApp()
  const [params, setParams] = useSearchParams()
  const { dados: status, carregando, erro, recarregar } = useCarregar(() => get('/config/status'))
  const [senhas, setSenhas] = useState({ senhaAtual: '', novaSenha: '' })
  const [aba, setAba] = useState('notificacoes')
  const historico = useCarregar(() => get(aba === 'notificacoes' ? '/notificacoes' : '/auditoria'), [aba])

  // Volta do login no Google: ?google=ok|cancelado|expirado|erro
  useEffect(() => {
    const r = params.get('google')
    if (r && RESULTADO_GOOGLE[r]) {
      showToast(...RESULTADO_GOOGLE[r])
      setParams({}, { replace: true })
    }
  }, [params, setParams, showToast])

  async function conectarGoogle() {
    try {
      const { url } = await get('/google/conectar')
      window.location.href = url
    } catch (err) {
      showToast(mensagemDeErro(err), 'erro')
    }
  }

  async function desconectarGoogle() {
    if (!window.confirm('Desconectar o Google Agenda? As escalas passam a usar só a disponibilidade digitada.')) return
    try {
      await del('/google')
      showToast('Google Agenda desconectado.')
      recarregar()
    } catch (err) {
      showToast(mensagemDeErro(err), 'erro')
    }
  }

  async function trocarSenha(e) {
    e.preventDefault()
    try {
      await put('/auth/senha', senhas)
      setSenhas({ senhaAtual: '', novaSenha: '' })
      showToast('Senha alterada com sucesso.')
    } catch (err) {
      showToast(mensagemDeErro(err), 'erro')
    }
  }

  const google = status?.google

  return (
    <div>
      <PageHeader icon={Settings} title="Configurações" subtitle="Integrações, segurança e registros do sistema." />

      <div className="space-y-5">
        {carregando && !status ? (
          <Carregando />
        ) : erro ? (
          <Erro erro={erro} onTentar={recarregar} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <Secao icon={Calendar} titulo="Google Agenda do projeto">
              {!google.configurado ? (
                <>
                  <Situacao ok={false}>Credenciais do Google não configuradas no servidor.</Situacao>
                  <p className="mt-2 text-[12.5px] text-slate-500">
                    Coloque o <code>credentials.json</code> na pasta do back-end (ou as variáveis GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET). Sem isso, as
                    escalas usam só a disponibilidade digitada pelos voluntários.
                  </p>
                </>
              ) : google.conectado ? (
                <>
                  <Situacao ok>Conectado{google.contaEmail ? ` como ${google.contaEmail}` : ''}.</Situacao>
                  <p className="mt-2 text-[12.5px] text-slate-500">
                    Voluntários que compartilharem a agenda com esta conta terão os horários ocupados considerados na geração das escalas (só livre/ocupado,
                    sem ver o conteúdo dos compromissos).
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button onClick={conectarGoogle} className="focus-ring rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-medium hover:bg-slate-50">
                      Reconectar
                    </button>
                    <button onClick={desconectarGoogle} className="focus-ring rounded-lg px-3 py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-50">
                      Desconectar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Situacao ok={false}>Não conectado{google.contaEmail ? ' (o acesso expirou)' : ''}.</Situacao>
                  <p className="mt-2 text-[12.5px] text-slate-500">Entre com a conta Google do projeto, com a qual os voluntários compartilham as agendas.</p>
                  <button onClick={conectarGoogle} className={`${botaoPrimario} mt-4`}>
                    Conectar conta Google
                  </button>
                </>
              )}
            </Secao>

            <Secao icon={Mail} titulo="E-mail (SMTP)">
              {status.smtp ? (
                <Situacao ok>Configurado. Os voluntários recebem e-mail quando a escala é confirmada e quando uma troca é analisada.</Situacao>
              ) : (
                <>
                  <Situacao ok={false}>Não configurado.</Situacao>
                  <p className="mt-2 text-[12.5px] text-slate-500">
                    Defina SMTP_HOST, SMTP_USUARIO e SMTP_SENHA no servidor. Enquanto isso, as notificações ficam registradas como “Falha”.
                  </p>
                </>
              )}
            </Secao>
          </div>
        )}

        <Secao icon={KeyRound} titulo="Minha senha">
          <form onSubmit={trocarSenha} className="grid max-w-xl gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label className={rotulo}>Senha atual</label>
              <input type="password" required value={senhas.senhaAtual} onChange={(e) => setSenhas({ ...senhas, senhaAtual: e.target.value })} className={campo} autoComplete="current-password" />
            </div>
            <div>
              <label className={rotulo}>Nova senha</label>
              <input type="password" required minLength={6} value={senhas.novaSenha} onChange={(e) => setSenhas({ ...senhas, novaSenha: e.target.value })} className={campo} autoComplete="new-password" />
            </div>
            <button type="submit" className={botaoPrimario}>
              Alterar
            </button>
          </form>
        </Secao>

        <Secao icon={History} titulo="Registros">
          <div className="mb-4 flex gap-2">
            {[
              ['notificacoes', 'E-mails enviados'],
              ['auditoria', 'Auditoria'],
            ].map(([chave, texto]) => (
              <button
                key={chave}
                onClick={() => setAba(chave)}
                className={`focus-ring rounded-lg px-3 py-1.5 text-[13px] font-medium ${aba === chave ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {texto}
              </button>
            ))}
          </div>
          {historico.carregando ? (
            <Carregando />
          ) : historico.erro ? (
            <Erro erro={historico.erro} />
          ) : historico.dados.length === 0 ? (
            <Vazio>Nada registrado ainda.</Vazio>
          ) : aba === 'notificacoes' ? (
            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">
              {historico.dados.map((n) => (
                <div key={n.id_notificacao} className="flex items-start justify-between gap-3 px-4 py-2.5 text-[13px]">
                  <div className="min-w-0">
                    <p className="font-medium text-navy-900">
                      {n.nome} <span className="font-normal text-slate-500">· {n.tipo_evento === 'ESCALA_CONFIRMADA' ? 'Escala confirmada' : 'Troca analisada'}</span>
                    </p>
                    <p className="truncate text-[12px] text-slate-500">{n.mensagem.split('\n').filter(Boolean)[1]}</p>
                    <p className="text-[11.5px] text-slate-400">{formatDateTime(n.data_envio)}</p>
                  </div>
                  <StatusBadge status={n.status_envio} />
                </div>
              ))}
            </div>
          ) : (
            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">
              {historico.dados.map((l) => (
                <div key={l.id_log} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                  <p>
                    <span className="font-medium text-navy-900">{l.nome || 'Sistema'}</span>{' '}
                    <span className="text-slate-600">
                      {l.operacao.toLowerCase().replace(/_/g, ' ')} · {l.entidade}
                      {l.id_entidade ? ` #${l.id_entidade}` : ''}
                    </span>
                  </p>
                  <span className="shrink-0 text-[12px] text-slate-400">{formatDateTime(l.criado_em)}</span>
                </div>
              ))}
            </div>
          )}
        </Secao>
      </div>
    </div>
  )
}
