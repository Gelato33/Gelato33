import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../data/api'
import { useAsync } from '../lib/useAsync'
import { marca } from '../lib/marca'
import { normalizar } from '../lib/utils'
import { Aviso, BotonBorrar, Cargando, ModalConfirmar } from '../components/ui'

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

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`
const iniciales = (nombre) => nombre.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

// Panel que se despliega al hacer clic en un usuario: sus asignaturas y qué hacer con su cuenta.
function DetalleUsuario({ u, asignaturas, esEstudiante, dictadas, contenido, onGuardar, onActivo, onEliminar }) {
  const [ids, setIds] = useState(u.asignatura_ids)
  const cambiado = ids.length !== u.asignatura_ids.length || ids.some((id) => !u.asignatura_ids.includes(id))
  return (
    <div className="usuario-detalle">
      {esEstudiante ? (
        <div>
          <SelectorAsignaturas asignaturas={asignaturas} value={ids} onChange={setIds} leyenda="Asignaturas en que está inscrito" />
          <div className="acciones">
            <button type="button" className="btn" disabled={!cambiado} onClick={() => onGuardar(ids)}>Guardar asignaturas</button>
            {cambiado && <button type="button" className="btn sec" onClick={() => setIds(u.asignatura_ids)}>Deshacer</button>}
          </div>
        </div>
      ) : (
        <div>
          <h4>Enseña</h4>
          {dictadas.length ? (
            <div className="docentes">{dictadas.map((n) => <span key={n} className="tag a">{n}</span>)}</div>
          ) : (
            <p className="vacio">Sin asignaturas. Asígnalas en la sección Asignaturas.</p>
          )}
          <small className="nota">
            Ha creado {plural(contenido.clases, 'clase', 'clases')}, {plural(contenido.materiales, 'material', 'materiales')} y {plural(contenido.evaluaciones, 'evaluación', 'evaluaciones')}.
          </small>
        </div>
      )}
      <div className="cuenta">
        <h4>Cuenta</h4>
        <div className="acciones">
          <button type="button" className="btn sec" onClick={onActivo}>{u.activo ? 'Desactivar cuenta' : 'Activar cuenta'}</button>
          <button type="button" className="btn peligro" onClick={onEliminar}>Eliminar {esEstudiante ? 'estudiante' : 'docente'}</button>
        </div>
        <small className="nota">
          {u.activo ? 'Desactivar impide que ingrese, pero conserva todos sus datos.' : 'Cuenta desactivada: no puede ingresar.'}
        </small>
      </div>
    </div>
  )
}

function Usuarios({ rol }) {
  const esEstudiante = rol === 'estudiante'
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([
        api.usuarios.list(rol), api.asignaturas.list(),
        esEstudiante ? [] : api.asignaciones.list(),
        esEstudiante ? [] : api.clases.list(),
        esEstudiante ? [] : api.materiales.list(),
        esEstudiante ? [] : api.evaluaciones.list(),
      ]),
    [rol],
  )
  const [errorAccion, ejecutar] = useAccion(reload)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [seleccion, setSeleccion] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [abierto, setAbierto] = useState(null)
  const [aEliminar, setAEliminar] = useState(null)
  const [errorBorrar, setErrorBorrar] = useState('')
  const [busqueda, setBusqueda] = useState('')

  if (loading && !data) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>
  const [lista, asignaturas, asignaciones, clases, materiales, evaluaciones] = data
  const activos = lista.filter((u) => u.activo).length
  const lleno = esEstudiante && activos >= marca.maxEstudiantes
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
    const ok = await ejecutar(() => api.usuarios.create({ nombre, email, password, rol, asignatura_ids: esEstudiante ? seleccion : [] }))
    setEnviando(false)
    if (ok) {
      setNombre('')
      setEmail('')
      setPassword('')
      setSeleccion([])
    }
  }

  const eliminar = async () => {
    setErrorBorrar('')
    try {
      await api.usuarios.remove(aEliminar.id)
      setAEliminar(null)
      setAbierto(null)
      reload()
    } catch (err) {
      setErrorBorrar(err.message)
    }
  }

  const contenidoDe = (id) => ({
    clases: clases.filter((c) => c.profesor_id === id).length,
    materiales: materiales.filter((m) => m.profesor_id === id).length,
    evaluaciones: evaluaciones.filter((e) => e.profesor_id === id).length,
  })
  const resumen = (u) =>
    esEstudiante
      ? u.asignaturas.length === asignaturas.length ? 'Todas' : `${u.asignaturas.length} de ${asignaturas.length}`
      : plural(asignaciones.filter((a) => a.profesor_id === u.id).length, 'asignatura', 'asignaturas')

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
        <ul className="usuarios">
          {visibles.map((u) => {
            const abre = abierto === u.id
            return (
              <li key={u.id} className={`usuario${abre ? ' abierto' : ''}${u.activo ? '' : ' inactivo'}`}>
                <button type="button" className="usuario-cab" aria-expanded={abre} onClick={() => setAbierto(abre ? null : u.id)}>
                  <span className="avatar" aria-hidden="true">{iniciales(u.nombre)}</span>
                  <span className="datos"><b>{u.nombre}</b><small>{u.email}</small></span>
                  <span className="resumen">{resumen(u)}</span>
                  <span className={`tag ${u.activo ? 'b' : 'c'}`}>{u.activo ? 'Activo' : 'Desactivado'}</span>
                  <span className="flecha" aria-hidden="true">▾</span>
                </button>
                {abre && (
                  <DetalleUsuario
                    key={`${u.id}-${u.asignatura_ids.join()}`}
                    u={u}
                    asignaturas={asignaturas}
                    esEstudiante={esEstudiante}
                    dictadas={asignaciones.filter((a) => a.profesor_id === u.id).map((a) => a.asignatura.nombre)}
                    contenido={esEstudiante ? null : contenidoDe(u.id)}
                    onGuardar={(ids) => ejecutar(() => api.usuarios.setAsignaturas(u.id, ids))}
                    onActivo={() => ejecutar(() => api.usuarios.setActivo(u.id, !u.activo))}
                    onEliminar={() => {
                      setErrorBorrar('')
                      setAEliminar(u)
                    }}
                  />
                )}
              </li>
            )
          })}
        </ul>
        {lista.length === 0 && <p className="vacio">Aún no hay {esEstudiante ? 'estudiantes' : 'docentes'}.</p>}
        {lista.length > 0 && visibles.length === 0 && (
          <p className="vacio">
            Ningún resultado para «{busqueda.trim()}». <button type="button" className="enlace" onClick={() => setBusqueda('')}>Limpiar búsqueda</button>
          </p>
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
              <SelectorAsignaturas asignaturas={asignaturas} value={seleccion} onChange={setSeleccion} leyenda="Inscribir en estas asignaturas" />
            )}
            {errorAccion && <Aviso>{errorAccion}</Aviso>}
            <button className="btn" disabled={enviando}>{enviando ? 'Guardando…' : 'Crear usuario'}</button>
            {!esEstudiante && <small>Después asígnale asignaturas en la sección Asignaturas.</small>}
          </form>
        )}
      </section>
      {aEliminar && (
        <ModalConfirmar
          titulo={`¿Eliminar ${esEstudiante ? 'al estudiante' : 'al docente'} ${aEliminar.nombre}?`}
          confirmar={`Sí, eliminar ${esEstudiante ? 'estudiante' : 'docente'}`}
          error={errorBorrar}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        >
          {esEstudiante ? (
            <p>Se borrará su cuenta junto con su avance en el material. Esta acción no se puede deshacer.</p>
          ) : (
            <>
              {(() => {
                const c = contenidoDe(aEliminar.id)
                return (
                  <p>
                    Se borrará su cuenta y también todo lo que creó: {plural(c.clases, 'clase', 'clases')}, {plural(c.materiales, 'material', 'materiales')} y {plural(c.evaluaciones, 'evaluación', 'evaluaciones')}.
                    Sus estudiantes dejarán de verlos. Esta acción no se puede deshacer.
                  </p>
                )
              })()}
            </>
          )}
          <p>Si solo quieres que no pueda ingresar, cancela y usa <b>Desactivar cuenta</b>.</p>
        </ModalConfirmar>
      )}
    </div>
  )
}

function Asignaturas() {
  const { data, error, loading, reload } = useAsync(() =>
    Promise.all([api.asignaturas.list(), api.usuarios.list('profesor'), api.asignaciones.list()]),
  )
  const [errorAccion, ejecutar] = useAccion(reload)
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState('#1860a8')
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
