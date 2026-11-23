import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { get, post, salvarToken, lerToken, quandoSessaoExpirar } from '../api'

const AppContext = createContext(null)

const ROTULO_PERFIL = { ADMINISTRADOR: 'Administrador', VOLUNTARIO: 'Voluntário' }

export function AppProvider({ children }) {
  // usuario: null = deslogado | undefined = ainda verificando a sessão salva
  const [usuario, setUsuario] = useState(lerToken() ? undefined : null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = useCallback((message, tom = 'ok') => {
    setToast({ message, tom })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), tom === 'erro' ? 6000 : 3200)
  }, [])

  const logout = useCallback(() => {
    salvarToken(null)
    setUsuario(null)
  }, [])

  // Sessão expirada em qualquer chamada -> volta para o login
  useEffect(() => {
    quandoSessaoExpirar(() => {
      logout()
      showToast('Sua sessão expirou. Entre novamente.', 'erro')
    })
  }, [logout, showToast])

  // Recupera a sessão salva ao abrir o sistema
  useEffect(() => {
    if (usuario !== undefined) return
    get('/auth/eu')
      .then(setUsuario)
      .catch(() => logout())
  }, [usuario, logout])

  async function login(email, senha) {
    const { token, usuario: u } = await post('/auth/login', { email, senha })
    salvarToken(token)
    setUsuario(u)
    return u
  }

  async function atualizarUsuario() {
    const u = await get('/auth/eu')
    setUsuario(u)
    return u
  }

  const role = usuario ? (usuario.perfil === 'ADMINISTRADOR' ? 'admin' : 'voluntario') : null
  const currentUser = usuario
    ? { name: usuario.nome, roleLabel: ROTULO_PERFIL[usuario.perfil], email: usuario.email }
    : null

  const value = {
    usuario,
    verificandoSessao: usuario === undefined,
    role,
    currentUser,
    login,
    logout,
    atualizarUsuario,
    toast,
    showToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>')
  return ctx
}
