import { useCallback, useEffect, useState } from 'react'

// Carrega dados da API e expõe { dados, carregando, erro, recarregar, setDados }.
// deps: quando mudam, carrega de novo.
export default function useCarregar(funcao, deps = []) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const resultado = await funcao()
      setDados(resultado)
      return resultado
    } catch (e) {
      setErro(e)
      return null
    } finally {
      setCarregando(false)
    }
  }, deps)

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { dados, carregando, erro, recarregar, setDados }
}
