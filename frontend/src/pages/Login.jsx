import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { mensagemDeErro } from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { login, showToast } = useApp()
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const usuario = await login(email.trim(), senha)
      showToast(`Bem-vindo(a), ${usuario.nome.split(' ')[0]}!`)
      navigate(usuario.perfil === 'ADMINISTRADOR' ? '/admin/inicio' : '/voluntario/inicio')
    } catch (err) {
      setErro(mensagemDeErro(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6fb] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-leaf-500/15">
            <Heart size={22} className="text-leaf-500" strokeWidth={2.4} />
          </span>
          <h1 className="text-2xl font-bold text-navy-900">Quanto Amor Você Tem Para Dar?</h1>
          <p className="mt-2 text-sm text-gray-500">Sistema de Gestão de Voluntários</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="seu.email@exemplo.com"
            />
          </div>
          <div>
            <label htmlFor="senha" className="mb-2 block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Digite sua senha"
            />
          </div>

          {erro && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 p-3 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
          >
            {enviando && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Não tem acesso ou esqueceu a senha? Fale com a gestão do projeto.
        </p>
      </div>
    </div>
  )
}
