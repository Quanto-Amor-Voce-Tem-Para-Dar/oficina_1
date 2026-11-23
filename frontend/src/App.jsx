import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { useApp } from './context/AppContext'
import { Carregando } from './components/Estado'

import Login from './pages/Login'

import AdminInicio from './pages/admin/Inicio'
import AdminVoluntarios from './pages/admin/Voluntarios'
import AdminAcoes from './pages/admin/AcoesEventos'
import AdminEscalas from './pages/admin/Escalas'
import AdminHoras from './pages/admin/Horas'
import AdminConfiguracoes from './pages/admin/Configuracoes'

import VolInicio from './pages/voluntario/Inicio'
import VolDisponibilidade from './pages/voluntario/MinhaDisponibilidade'
import VolEscala from './pages/voluntario/MinhaEscala'
import VolHoras from './pages/voluntario/Horas'

export default function App() {
  // 'role' é 'admin', 'voluntario' ou null (deslogado)
  const { role, verificandoSessao } = useApp()

  if (verificandoSessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fb]">
        <Carregando texto="Abrindo o sistema..." />
      </div>
    )
  }

  // Componente de proteção de rotas
  const ProtectedRoute = ({ children, allowedRole }) => {
    if (!role) {
      return <Navigate to="/login" replace />
    }
    if (role !== allowedRole) {
      // Se tentar acessar rota errada, manda para o início correto
      return <Navigate to={role === 'admin' ? '/admin/inicio' : '/voluntario/inicio'} replace />
    }
    return <Layout>{children}</Layout>
  }

  return (
    <Routes>
      {/* Rota pública de Login */}
      <Route path="/login" element={!role ? <Login /> : <Navigate to={role === 'admin' ? '/admin/inicio' : '/voluntario/inicio'} replace />} />

      {/* Redirecionamento da raiz */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rotas Protegidas do Administrador */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRole="admin">
          <Routes>
            <Route path="inicio" element={<AdminInicio />} />
            <Route path="voluntarios" element={<AdminVoluntarios />} />
            <Route path="acoes" element={<AdminAcoes />} />
            <Route path="escalas" element={<AdminEscalas />} />
            <Route path="horas" element={<AdminHoras />} />
            <Route path="configuracoes" element={<AdminConfiguracoes />} />
          </Routes>
        </ProtectedRoute>
      } />

      {/* Rotas Protegidas do Voluntário */}
      <Route path="/voluntario/*" element={
        <ProtectedRoute allowedRole="voluntario">
          <Routes>
            <Route path="inicio" element={<VolInicio />} />
            <Route path="disponibilidade" element={<VolDisponibilidade />} />
            <Route path="escala" element={<VolEscala />} />
            <Route path="horas" element={<VolHoras />} />
          </Routes>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}