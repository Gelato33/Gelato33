import { useCallback, useEffect, useState } from 'react'

// Ejecuta una función asíncrona al montar y cuando cambian las dependencias.
// Devuelve { data, error, loading, reload }.
export function useAsync(fn, deps = []) {
  const [estado, setEstado] = useState({ data: null, error: null, loading: true })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vivo = true
    setEstado((e) => ({ ...e, loading: true, error: null }))
    fn()
      .then((data) => vivo && setEstado({ data, error: null, loading: false }))
      .catch((err) => vivo && setEstado({ data: null, error: err.message, loading: false }))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { ...estado, reload }
}
