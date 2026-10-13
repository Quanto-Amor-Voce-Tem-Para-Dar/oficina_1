import React, { createContext, useContext, useMemo, useRef, useState } from 'react'
import { volunteers as seedVolunteers, actions as seedActions, initialSchedules } from '../data/mockData'
import { generateSchedule } from '../utils/schedule'

const AppContext = createContext(null)

const IDENTITIES = {
  admin: { kind: 'admin', name: 'Ana Souza', roleLabel: 'Presidente' },
  voluntario: { kind: 'voluntario', volunteerId: 'v1', roleLabel: 'Voluntário' },
}

export function AppProvider({ children }) {
  const [role, setRole] = useState(null)
  const [volunteers, setVolunteers] = useState(seedVolunteers)
  const [actions] = useState(seedActions)
  const [schedules, setSchedules] = useState(initialSchedules)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const currentVolunteer = useMemo(
    () => volunteers.find((v) => v.id === IDENTITIES.voluntario.volunteerId),
    [volunteers],
  )

  const currentUser =
    role === 'admin'
      ? { name: IDENTITIES.admin.name, roleLabel: IDENTITIES.admin.roleLabel }
      : { name: currentVolunteer?.name, roleLabel: IDENTITIES.voluntario.roleLabel }

  function showToast(message) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }

  function updateAvailability(volunteerId, availability) {
    setVolunteers((prev) =>
      prev.map((v) => (v.id === volunteerId ? { ...v, availability } : v)),
    )
    showToast('Disponibilidade salva com sucesso.')
  }

  function regenerateSchedule(actionId, date) {
    const action = actions.find((a) => a.id === actionId)
    if (!action) return
    const result = generateSchedule(action, date, volunteers)
    setSchedules((prev) => ({ ...prev, [`${actionId}_${date}`]: result }))
    showToast('Escala gerada com base na disponibilidade dos voluntários.')
  }

  function addVolunteer(newVolunteer) {
    const id = `v${volunteers.length + 1}`
    setVolunteers([...volunteers, { id, ...newVolunteer }])
  }

  function updateVolunteer(id, updatedData) {
    setVolunteers(volunteers.map(v => v.id === id ? { ...v, ...updatedData } : v))
  }

  function removeVolunteer(id) {
    // Em vez de deletar de fato, apenas mudamos o status para Inativo (Desativar)
    setVolunteers(volunteers.map(v => v.id === id ? { ...v, status: 'Inativo' } : v))
  }

  function addAction(newAction) {
    const id = `a${actions.length + 1}`
    // Se o usuário não colocar turnos, criamos um array vazio para não quebrar o map()
    setActions([...actions, { id, shiftsTemplate: [], ...newAction }])
  }

  function updateAction(id, updatedData) {
    setActions(actions.map(a => a.id === id ? { ...a, ...updatedData } : a))
  }

  function removeAction(id) {
    setActions(actions.filter(a => a.id !== id))
  }

  const value = {
    role,
    setRole,
    volunteers,
    actions,
    schedules,
    currentVolunteer,
    currentUser,
    updateAvailability,
    regenerateSchedule,
    toast,
    showToast,
    addVolunteer,
    updateVolunteer,
    removeVolunteer,
    addAction,
    updateAction,
    removeAction
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>')
  return ctx
}
