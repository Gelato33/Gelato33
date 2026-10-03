import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { db, demoSesion } from '../data/demoApi'
import { configurado, supabase } from '../lib/supabase'

const Contexto = createContext(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Contexto)

export function AuthProvider({ children }) {
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(configurado)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!configurado) return
    let vivo = true

    const cargar = async (sesion) => {
      if (!sesion) {
        if (vivo) {
          setPerfil(null)
          setCargando(false)
        }
        return
      }
      const { data, error: err } = await supabase.from('profiles').select('*').eq('id', sesion.user.id).maybeSingle()
      if (!vivo) return
      if (err || !data || !data.activo) {
        setError(data && !data.activo ? 'Tu cuenta está desactivada. Contacta al administrador.' : 'Tu cuenta aún no tiene perfil. Contacta al administrador.')
        setPerfil(null)
        await supabase.auth.signOut()
      } else {
        setPerfil(data)
      }
      setCargando(false)
    }

    supabase.auth.getSession().then(({ data }) => cargar(data.session))
    // setTimeout evita llamar a Supabase dentro del callback de autenticación (puede bloquearse).
    const { data: sub } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') setTimeout(() => cargar(sesion), 0)
    })
    return () => {
      vivo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const entrar = useCallback(async (email, password) => {
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) throw new Error('Correo o contraseña incorrectos')
  }, [])

  const entrarDemo = useCallback((rol) => {
    const usuario = db.usuarios.find((u) => u.rol === rol && u.activo)
    demoSesion.id = usuario.id
    setPerfil(usuario)
  }, [])

  const salir = useCallback(async () => {
    if (configurado) await supabase.auth.signOut()
    else {
      demoSesion.id = null
      setPerfil(null)
    }
  }, [])

  const valor = useMemo(() => ({ perfil, cargando, error, entrar, entrarDemo, salir }), [perfil, cargando, error, entrar, entrarDemo, salir])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
