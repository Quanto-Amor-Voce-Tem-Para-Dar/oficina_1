// Cliente da API. Em desenvolvimento, o Vite repassa /api para http://localhost:3000 (vite.config.js).
// Na Vercel, defina VITE_API_URL com o endereço do back-end (ex.: https://quanto-amor-api.vercel.app).
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const CHAVE_TOKEN = 'quanto-amor-token'

export function lerToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN)
  } catch {
    return null
  }
}

export function salvarToken(token) {
  try {
    if (token) localStorage.setItem(CHAVE_TOKEN, token)
    else localStorage.removeItem(CHAVE_TOKEN)
  } catch {
    /* navegador sem armazenamento: o login dura só até recarregar a página */
  }
}

// Chamado quando a sessão expira (o AppContext registra a função de sair).
let aoExpirar = () => {}
export function quandoSessaoExpirar(fn) {
  aoExpirar = fn
}

export class ErroApi extends Error {
  constructor(status, mensagem, erros) {
    super(mensagem)
    this.status = status
    this.erros = erros
  }
}

export async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const token = lerToken()
  let resposta
  try {
    resposta = await fetch(`${BASE}/api${caminho}`, {
      method: metodo,
      headers: {
        ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new ErroApi(0, 'Não foi possível falar com o servidor. Verifique sua conexão.')
  }

  const dados = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    if (resposta.status === 401 && token && !caminho.startsWith('/auth/login')) aoExpirar()
    const mensagem = dados?.mensagem || `Erro ${resposta.status}`
    throw new ErroApi(resposta.status, mensagem, dados?.erros)
  }
  return dados
}

// Junta a mensagem principal com a lista de erros de validação.
export function mensagemDeErro(erro) {
  if (!erro) return ''
  return erro.erros?.length ? `${erro.message} ${erro.erros.join(' ')}` : erro.message
}

export const get = (c) => api(c)
export const post = (c, corpo = {}) => api(c, { metodo: 'POST', corpo })
export const put = (c, corpo = {}) => api(c, { metodo: 'PUT', corpo })
export const patch = (c, corpo = {}) => api(c, { metodo: 'PATCH', corpo })
export const del = (c) => api(c, { metodo: 'DELETE' })
