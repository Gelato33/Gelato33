import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../data/api'
import { useAsync } from '../lib/useAsync'
import { marca } from '../lib/marca'
import { normalizar } from '../lib/utils'
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

// Agrupa "Ciencias · Biología", "Ciencias · Física"... bajo un mismo título.
function agruparAsignaturas(asignaturas) {
  const grupos = new Map()
  for (const a of asignaturas) {
    const [grupo, detalle] = a.nombre.split(' · ')
    const clave = detalle ? grupo : a.nombre
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave).push({ ...a, detalle })
  }
  return [...grupos.entries()].map(([nombre, items]) => ({
    nombre,
    items: items.map((a) => ({ ...a, etiqueta: items.length > 1 && a.detalle ? a.detalle : a.nombre })),
  }))
}

function SelectorAsignaturas({ asignaturas, value, onChange, leyenda }) {
  const alternar = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  return (
    <fieldset className="grupo">
      <legend>{leyenda}</legend>
      <div className="selector-cab">
        <span aria-live="polite">{value.length} de {asignaturas.length} seleccionadas</span>
        <span>
          <button type="button" className="enlace" onClick={() => onChange(asignaturas.map((a) => a.id))}>Todas</button>
          {' · '}
          <button type="button" className="enlace" onClick={() => onChange([])}>Ninguna</button>
        </span>
      </div>
      {agruparAsignaturas(asignaturas).map((g) => (
        <div key={g.nombre} className="selector-grupo">
          {g.items.length > 1 && <h4>{g.nombre}</h4>}
          <div className="opciones">
            {g.items.map((a) => (
              <button key={a.id} type="button" className="opcion" aria-pressed={value.includes(a.id)} onClick={() => alternar(a.id)}>
                <span className="punto" style={{ background: a.color }} />
                {a.etiqueta}
                <span className="ok" aria-hidden="true">✓</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  )
}

function Usuarios({ rol }) {
  const esEstudiante = rol === 'estudiante'
  const { data, error, loading, reload } = useAsync(
    () => Promise.all([api.usuarios.list(rol), api.asignaturas.list(), esEstudiante ? [] : api.asignaciones.list()]),
    [rol],
  )
  const [errorAccion, ejecutar] = useAccion(reload)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [seleccion, setSeleccion] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [editando, setEditando] = useState(null) // { id, ids }
  const [busqueda, setBusqueda] = useState('')

  if (loading && !data) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>
  const [lista, asignaturas, asignaciones] = data
  const activos = lista.filter((u) => u.activo).length
  const lleno = esEstudiante && activos >= marca.maxEstudiantes
  const elegidas = seleccion
  // Cada palabra escrita debe aparecer en el nombre, el correo o las asignaturas.
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean)
  const visibles = palabras.length
    ? lista.filter((u) => {
        const texto = normalizar(`${u.nombre} ${u.email} ${u.asignaturas.join(' ')}`)
        return palabras.every((p) => texto.includes(p))
      })
    : lista

  const crear = async (e) => {
    e.preventDefault()
    setEnviando(true)
    const ok = await ejecutar(() => api.usuarios.create({ nombre, email, password, rol, asignatura_ids: esEstudiante ? elegidas : [] }))
    setEnviando(false)
    if (ok) {
      setNombre('')
      setEmail('')
      setPassword('')
      setSeleccion([])
    }
  }

  const asignaturasDe = (u) =>
    esEstudiante
      ? u.asignaturas.length === asignaturas.length ? 'Todas' : `${u.asignaturas.length} de ${asignaturas.length}`
      : asignaciones.filter((a) => a.profesor_id === u.id).map((a) => a.asignatura.nombre).join(', ') || 'Sin asignaturas'

  return (
    <div className="dos">
      <section className="tarjeta">
        <h2>{esEstudiante ? `Estudiantes (${activos} de ${marca.maxEstudiantes} cupos)` : `Docentes (${lista.length})`}</h2>
        <div className="buscador">
          <input
            type="search"
            aria-label={`Buscar ${esEstudiante ? 'estudiantes' : 'docentes'}`}
            placeholder="Buscar por nombre, correo o asignatura"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {palabras.length > 0 && <small aria-live="polite">Mostrando {visibles.length} de {lista.length}</small>}
        </div>
        <div className="tabla">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Correo</th><th>Asignaturas</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {visibles.map((u) => (
                <FilaUsuario
                  key={u.id}
                  u={u}
                  resumen={asignaturasDe(u)}
                  editable={esEstudiante}
                  activa={editando?.id === u.id}
                  onEditar={() => setEditando({ id: u.id, ids: u.asignatura_ids })}
                  onActivo={() => ejecutar(() => api.usuarios.setActivo(u.id, !u.activo))}
                />
              ))}
            </tbody>
          </table>
        </div>
        {lista.length === 0 && <p className="vacio">Aún no hay {esEstudiante ? 'estudiantes' : 'docentes'}.</p>}
        {lista.length > 0 && visibles.length === 0 && (
          <p className="vacio">
            Ningún resultado para «{busqueda.trim()}». <button type="button" className="enlace" onClick={() => setBusqueda('')}>Limpiar búsqueda</button>
          </p>
        )}
        {editando && (
          <div className="panel-edicion">
            <SelectorAsignaturas
              asignaturas={asignaturas}
              value={editando.ids}
              onChange={(ids) => setEditando({ ...editando, ids })}
              leyenda={`Asignaturas de ${lista.find((u) => u.id === editando.id)?.nombre}`}
            />
            <div className="acciones">
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  if (await ejecutar(() => api.usuarios.setAsignaturas(editando.id, editando.ids))) setEditando(null)
                }}
              >
                Guardar
              </button>
              <button type="button" className="btn sec" onClick={() => setEditando(null)}>Cancelar</button>
            </div>
          </div>
        )}
        {errorAccion && <Aviso>{errorAccion}</Aviso>}
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
              <SelectorAsignaturas asignaturas={asignaturas} value={elegidas} onChange={setSeleccion} leyenda="Inscribir en estas asignaturas" />
            )}
            {errorAccion && <Aviso>{errorAccion}</Aviso>}
            <button className="btn" disabled={enviando}>{enviando ? 'Guardando…' : 'Crear usuario'}</button>
            {!esEstudiante && <small>Después asígnale asignaturas en la sección Asignaturas.</small>}
          </form>
        )}
      </section>
    </div>
  )
}

function FilaUsuario({ u, resumen, editable, activa, onEditar, onActivo }) {
  return (
    <tr className={activa ? 'activa' : undefined}>
      <td><b>{u.nombre}</b></td>
      <td className="correo">{u.email}</td>
      <td title={u.asignaturas?.join(', ')}>{resumen}</td>
      <td><span className={`tag ${u.activo ? 'b' : 'c'}`}>{u.activo ? 'Activo' : 'Desactivado'}</span></td>
      <td>
        <div className="botones">
          {editable && <button type="button" className="btn sec" onClick={onEditar}>Asignaturas</button>}
          <button type="button" className="btn sec" onClick={onActivo}>{u.activo ? 'Desactivar' : 'Activar'}</button>
        </div>
      </td>
    </tr>
  )
}

function Asignaturas() {
  const { data, error, loading, reload } = useAsync(() =>
    Promise.all([api.asignaturas.list(), api.usuarios.list('profesor'), api.asignaciones.list()]),
  )
  const [errorAccion, ejecutar] = useAccion(reload)
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState('#5b3df5')
  const [asignatura, setAsignatura] = useState('')
  const [docente, setDocente] = useState('')
  if (loading && !data) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>
  const [asignaturas, docentes, asignaciones] = data

  return (
    <div className="dos">
      <section className="tarjeta">
        <h2>Asignaturas ({asignaturas.length})</h2>
        <ul>
          {asignaturas.map((a) => {
            const suyas = asignaciones.filter((x) => x.asignatura_id === a.id)
            return (
              <li key={a.id} className="item">
                <div className="cuerpo">
                  <div className="fila"><span className="punto" style={{ background: a.color }} /><b>{a.nombre}</b></div>
                  <div className="docentes">
                    {suyas.length === 0 && <small>Sin docente asignado</small>}
                    {suyas.map((x) => (
                      <span key={x.id} className="tag a">
                        {x.profesor.nombre}
                        <button type="button" aria-label={`Quitar a ${x.profesor.nombre} de ${a.nombre}`} onClick={() => ejecutar(() => api.asignaciones.remove(x.id))}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <BotonBorrar aviso="Se borra también su material." onConfirmar={() => ejecutar(() => api.asignaturas.remove(a.id))} />
              </li>
            )
          })}
        </ul>
        {asignaturas.length === 0 && <p className="vacio">No hay asignaturas.</p>}
      </section>
      <div className="pila">
        <section className="tarjeta">
          <h2>Asignar docente</h2>
          {asignaturas.length === 0 || docentes.length === 0 ? (
            <Aviso tipo="info">Necesitas al menos una asignatura y un docente.</Aviso>
          ) : (
            <form
              className="formulario"
              onSubmit={(e) => {
                e.preventDefault()
                ejecutar(() => api.asignaciones.create({
                  asignatura_id: asignatura || asignaturas[0].id,
                  profesor_id: docente || docentes[0].id,
                }))
              }}
            >
              <label>Asignatura<select value={asignatura || asignaturas[0].id} onChange={(e) => setAsignatura(e.target.value)}>{asignaturas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label>
              <label>Docente<select value={docente || docentes[0].id} onChange={(e) => setDocente(e.target.value)}>{docentes.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select></label>
              <button className="btn">Asignar</button>
            </form>
          )}
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
            <button className="btn">Crear asignatura</button>
          </form>
        </section>
        {errorAccion && <Aviso>{errorAccion}</Aviso>}
      </div>
    </div>
  )
}

const SECCIONES = {
  estudiantes: { titulo: 'Estudiantes', sub: 'Inscribe estudiantes y elige en qué asignaturas participan.', el: <Usuarios rol="estudiante" /> },
  docentes: { titulo: 'Docentes', sub: 'Cada docente sube y gestiona su propio material.', el: <Usuarios rol="profesor" /> },
  asignaturas: { titulo: 'Asignaturas', sub: 'Crea y elimina asignaturas y define qué docentes las enseñan.', el: <Asignaturas /> },
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
