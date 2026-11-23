import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { setRole, showToast } = useApp()
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')

    // Senhas simplificadas para o protótipo
    if (password === 'admin123') {
      setRole('admin')
      showToast('Bem-vindo, Administrador!')
      navigate('/admin/inicio')
    } else if (password === 'voluntario123') {
      setRole('voluntario')
      showToast('Bem-vindo, Voluntário!')
      navigate('/voluntario/inicio')
    } else {
      setError('Senha incorreta. Use admin123 ou voluntario123')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6fb] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-navy-900">
            Quanto Amor Você Tem Para Dar?
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sistema de Gestão de Voluntários
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Senha de Acesso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              placeholder="Digite sua senha"
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-navy-900 p-3 text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            Entrar
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-400">
          Dica para avaliação: use <br/><b>admin123</b> para Gestão ou <br/><b>voluntario123</b> para Membro
        </div>
      </div>
    </div>
  )
}