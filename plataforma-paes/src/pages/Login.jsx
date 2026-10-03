import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { configurado } from '../lib/supabase'
import { marca } from '../lib/marca'
import { Aviso } from '../components/ui'

export default function Login() {
  const { perfil, error: errorSesion, entrar, entrarDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (perfil) return <Navigate to="/" replace />

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      await entrar(email.trim(), password)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <div className="login-caja">
        <div className="marca grande">
          <i aria-hidden="true">{marca.nombre.charAt(0)}</i>
          {marca.nombre}
        </div>
        <h1>Bienvenido</h1>
        <p className="sub">Ingresa para ver tu material y tus evaluaciones.</p>

        {configurado ? (
          <form onSubmit={enviar} className="formulario">
            <label>
              Correo
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </label>
            <label>
              Contraseña
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </label>
            {(error || errorSesion) && <Aviso>{error || errorSesion}</Aviso>}
            <button className="btn" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
          </form>
        ) : (
          <div className="formulario">
            <Aviso tipo="info">Modo demo: los datos son de ejemplo y se reinician al recargar. Elige un rol para explorar.</Aviso>
            <button className="btn" onClick={() => entrarDemo('estudiante')}>Entrar como estudiante</button>
            <button className="btn sec" onClick={() => entrarDemo('profesor')}>Entrar como docente</button>
            <button className="btn sec" onClick={() => entrarDemo('admin')}>Entrar como administrador</button>
          </div>
        )}
      </div>
    </div>
  )
}
