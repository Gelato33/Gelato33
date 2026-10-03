import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../data/api'
import { useAsync } from '../lib/useAsync'
import { marca } from '../lib/marca'
import { Aviso, BotonBorrar, Cargando } from '../components/ui'

// Ejecuta una acción y muestra el error en pantalla si falla.
function useAccion(reload) {
  const [error, setError] = useState('')
  const ejecutar = async (fn) => {
    setError('')
    try {
      await fn()
      reload()
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }
  return [error, ejecutar]
}

function Usuarios({ rol }) {
  const esEstudiante = rol === 'estudiante'
  const { data, error, loading, reload } = useAsync(() => Promise.all([api.usuarios.list(rol), api.cursos.list()]), [rol])
  const [errorAccion, ejecutar] = useAccion(reload)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cursoId, setCursoId] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (loading && !data) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>
  const [lista, cursos] = data
  const activos = lista.filter((u) => u.activo).length
  const lleno = esEstudiante && activos >= marca.maxEstudiantes

  const crear = async (e) => {
    e.preventDefault()
    setEnviando(true)
    const ok = await ejecutar(() => api.usuarios.create({ nombre, email, password, rol, curso_id: esEstudiante ? cursoId || cursos[0]?.id : null }))
    setEnviando(false)
    if (ok) {
      setNombre('')
      setEmail('')
      setPassword('')
    }
  }

  return (
    <div className="dos">
      <section className="tarjeta">
        <h2>{esEstudiante ? `Estudiantes (${activos} de ${marca.maxEstudiantes} cupos)` : `Docentes (${lista.length})`}</h2>
        <div className="tabla">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Correo</th>{esEstudiante && <th>Curso</th>}<th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.nombre}</b></td>
                  <td>{u.email}</td>
                  {esEstudiante && <td>{u.curso ?? 'Sin curso'}</td>}
                  <td><span className={`tag ${u.activo ? 'b' : 'c'}`}>{u.activo ? 'Activo' : 'Desactivado'}</span></td>
                  <td>
                    <button type="button" className="btn sec" onClick={() => ejecutar(() => api.usuarios.setActivo(u.id, !u.activo))}>
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lista.length === 0 && <p className="vacio">Aún no hay {esEstudiante ? 'estudiantes' : 'docentes'}.</p>}
      </section>
      <section className="tarjeta">
        <h2>{esEstudiante ? 'Inscribir estudiante' : 'Agregar docente'}</h2>
        {lleno ? (
          <Aviso tipo="info">Se alcanzó el máximo de {marca.maxEstudiantes} estudiantes activos del plan.</Aviso>
        ) : (
          <form className="formulario" onSubmit={crear}>
            <label>Nombre completo<input value={nombre} onChange={(e) => setNombre(e.target.value)} required /></label>
            <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>
              Contraseña temporal
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="off" />
            </label>
            {esEstudiante && (
              <label>
                Curso
                <select value={cursoId || cursos[0]?.id || ''} onChange={(e) => setCursoId(e.target.value)}>
                  {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </label>
            )}
            {errorAccion && <Aviso>{errorAccion}</Aviso>}
            <button className="btn" disabled={enviando || (esEstudiante && cursos.length === 0)}>{enviando ? 'Guardando…' : 'Crear usuario'}</button>
            {esEstudiante && cursos.length === 0 && <small>Primero crea un curso.</small>}
          </form>
        )}
      </section>
    </div>
  )
}

function Asignaturas() {
  const { data, error, loading, reload } = useAsync(() => api.asignaturas.list())
  const [errorAccion, ejecutar] = useAccion(reload)
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState('#5b3df5')
  if (loading && !data) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>

  return (
    <div className="dos">
      <section className="tarjeta">
        <h2>Asignaturas ({data.length})</h2>
        <ul>
          {data.map((a) => (
            <li key={a.id} className="item">
              <div className="fila"><span className="punto" style={{ background: a.color }} /><b>{a.nombre}</b></div>
              <BotonBorrar aviso="Se borra también su material." onConfirmar={() => ejecutar(() => api.asignaturas.remove(a.id))} />
            </li>
          ))}
        </ul>
        {data.length === 0 && <p className="vacio">No hay asignaturas.</p>}
      </section>
      <section className="tarjeta">
        <h2>Crear asignatura</h2>
        <form
          className="formulario"
          onSubmit={async (e) => {
            e.preventDefault()
            if (await ejecutar(() => api.asignaturas.create({ nombre: nombre.trim(), color }))) setNombre('')
          }}
        >
          <label>Nombre<input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={60} placeholder="Matemática M2" /></label>
          <label>Color<input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
          {errorAccion && <Aviso>{errorAccion}</Aviso>}
          <button className="btn">Crear asignatura</button>
        </form>
      </section>
    </div>
  )
}

function Cursos() {
  const { data, error, loading, reload } = useAsync(() =>
    Promise.all([api.cursos.list(), api.asignaturas.list(), api.usuarios.list('profesor'), api.asignaciones.list()]),
  )
  const [errorAccion, ejecutar] = useAccion(reload)
  const [nombre, setNombre] = useState('')
  const [curso, setCurso] = useState('')
  const [asignatura, setAsignatura] = useState('')
  const [docente, setDocente] = useState('')
  if (loading && !data) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>
  const [cursos, asignaturas, docentes, asignaciones] = data
  const listo = cursos.length && asignaturas.length && docentes.length

  return (
    <div className="dos">
      <div className="pila">
        <section className="tarjeta">
          <h2>Cursos ({cursos.length})</h2>
          <form
            className="en-linea"
            onSubmit={async (e) => {
              e.preventDefault()
              if (await ejecutar(() => api.cursos.create({ nombre: nombre.trim() }))) setNombre('')
            }}
          >
            <input aria-label="Nombre del curso" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={60} placeholder="4° Medio C" />
            <button className="btn">Crear curso</button>
          </form>
          <ul>
            {cursos.map((c) => (
              <li key={c.id} className="item"><b>{c.nombre}</b><small>{asignaciones.filter((a) => a.curso_id === c.id).length} asignaturas con docente</small></li>
            ))}
          </ul>
        </section>
        <section className="tarjeta">
          <h2>Docentes por curso</h2>
          <div className="tabla">
            <table>
              <thead><tr><th>Curso</th><th>Asignatura</th><th>Docente</th><th /></tr></thead>
              <tbody>
                {asignaciones.map((a) => (
                  <tr key={a.id}>
                    <td>{a.curso.nombre}</td><td>{a.asignatura.nombre}</td><td>{a.profesor.nombre}</td>
                    <td><BotonBorrar texto="Quitar" onConfirmar={() => ejecutar(() => api.asignaciones.remove(a.id))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <section className="tarjeta">
        <h2>Asignar docente</h2>
        {!listo ? (
          <Aviso tipo="info">Necesitas al menos un curso, una asignatura y un docente.</Aviso>
        ) : (
          <form
            className="formulario"
            onSubmit={(e) => {
              e.preventDefault()
              ejecutar(() => api.asignaciones.create({
                curso_id: curso || cursos[0].id,
                asignatura_id: asignatura || asignaturas[0].id,
                profesor_id: docente || docentes[0].id,
              }))
            }}
          >
            <label>Curso<select value={curso || cursos[0].id} onChange={(e) => setCurso(e.target.value)}>{cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
            <label>Asignatura<select value={asignatura || asignaturas[0].id} onChange={(e) => setAsignatura(e.target.value)}>{asignaturas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label>
            <label>Docente<select value={docente || docentes[0].id} onChange={(e) => setDocente(e.target.value)}>{docentes.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select></label>
            {errorAccion && <Aviso>{errorAccion}</Aviso>}
            <button className="btn">Asignar</button>
          </form>
        )}
      </section>
    </div>
  )
}

const SECCIONES = {
  estudiantes: { titulo: 'Estudiantes', sub: 'Inscribe estudiantes y asígnalos a un curso.', el: <Usuarios rol="estudiante" /> },
  docentes: { titulo: 'Docentes', sub: 'Cada docente sube y gestiona su propio material.', el: <Usuarios rol="profesor" /> },
  asignaturas: { titulo: 'Asignaturas', sub: 'Crea y elimina las asignaturas de la institución.', el: <Asignaturas /> },
  cursos: { titulo: 'Cursos', sub: 'Crea cursos y define qué docente enseña cada asignatura.', el: <Cursos /> },
}

export default function Admin() {
  const { perfil } = useAuth()
  const { seccion } = useParams()
  const s = SECCIONES[seccion]
  if (perfil.rol !== 'admin') return <Navigate to="/" replace />
  if (!s) return <Navigate to="/admin/estudiantes" replace />
  return (
    <>
      <div>
        <h1>{s.titulo}</h1>
        <p className="sub">{s.sub}</p>
      </div>
      {s.el}
    </>
  )
}
