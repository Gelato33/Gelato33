import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../data/api'
import { useAsync } from '../lib/useAsync'
import { asignaturasUnicas, hoyISO } from '../lib/utils'
import { Aviso, Cargando, ClaseCard } from '../components/ui'

// Sirve para crear y para editar. Al editar no se cambia la asignatura.
function FormClase({ asignaturas, editando, onListo, onCancelar }) {
  const [asignaturaId, setAsignaturaId] = useState('')
  const [titulo, setTitulo] = useState(editando?.titulo ?? '')
  const [fecha, setFecha] = useState(editando?.fecha ?? '')
  const [hora, setHora] = useState(editando?.hora?.slice(0, 5) ?? '')
  const [contenido, setContenido] = useState(editando?.contenido ?? '')
  const [objetivos, setObjetivos] = useState(editando?.objetivos ?? '')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const elegida = asignaturas.find((a) => a.id === asignaturaId) ?? asignaturas[0]

  if (!editando && asignaturas.length === 0) {
    return <Aviso tipo="info">No hay asignaturas asignadas para crear clases. Pide al administrador que te asigne a una asignatura.</Aviso>
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    const campos = {
      titulo: titulo.trim(),
      fecha,
      hora: hora || null,
      contenido: contenido.trim() || null,
      objetivos: objetivos.trim() || null,
    }
    try {
      if (editando) await api.clases.update(editando.id, campos)
      else await api.clases.create({ asignatura_id: elegida.id, ...campos })
      if (!editando) {
        setTitulo('')
        setContenido('')
        setObjetivos('')
      }
      onListo()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={guardar}>
      {editando ? (
        <p className="sub">{editando.asignatura?.nombre}</p>
      ) : (
        <label>
          Asignatura
          <select value={elegida?.id ?? ''} onChange={(e) => setAsignaturaId(e.target.value)}>
            {asignaturas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </label>
      )}
      <label>
        Título de la clase
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={140} placeholder="Ecuaciones cuadráticas" />
      </label>
      <div className="doble">
        <label>
          Fecha
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </label>
        <label>
          Hora (opcional)
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </label>
      </div>
      <label>
        Contenidos (opcional)
        <textarea value={contenido} onChange={(e) => setContenido(e.target.value)} maxLength={2000} placeholder={'Un tema por línea:\nFactorización\nFórmula general'} />
      </label>
      <label>
        Objetivos de aprendizaje (opcional)
        <textarea value={objetivos} onChange={(e) => setObjetivos(e.target.value)} maxLength={1000} placeholder="Resolver ecuaciones cuadráticas con distintos métodos." />
      </label>
      {error && <Aviso>{error}</Aviso>}
      <div className="acciones">
        <button className="btn" disabled={enviando}>{enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear clase'}</button>
        {editando && <button type="button" className="btn sec" onClick={onCancelar}>Cancelar</button>}
      </div>
    </form>
  )
}

export default function Clases() {
  const { perfil } = useAuth()
  const puedeCrear = perfil.rol !== 'estudiante'
  const [filtro, setFiltro] = useState('')
  const [editando, setEditando] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')
  const { data, error, loading, reload } = useAsync(() =>
    Promise.all([api.clases.list(), api.materiales.list(), puedeCrear ? api.asignaciones.list() : []]),
  )
  if (loading && !data) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>

  const [clases, materiales, asignaciones] = data
  const hoy = hoyISO()
  const asignaturasConClases = [...new Map(clases.map((c) => [c.asignatura_id, c.asignatura?.nombre])).entries()]
  const visibles = filtro ? clases.filter((c) => c.asignatura_id === filtro) : clases
  const proximas = visibles.filter((c) => c.fecha >= hoy)
  const realizadas = visibles.filter((c) => c.fecha < hoy).reverse()

  const borrar = async (id) => {
    setErrorAccion('')
    try {
      await api.clases.remove(id)
      if (editando?.id === id) setEditando(null)
      reload()
    } catch (err) {
      setErrorAccion(err.message)
    }
  }

  const tarjeta = (c) => (
    <ClaseCard
      key={c.id}
      c={c}
      hoy={hoy}
      materiales={materiales.filter((m) => m.clase_id === c.id)}
      onEditar={puedeCrear ? () => setEditando(c) : undefined}
      onBorrar={puedeCrear ? () => borrar(c.id) : undefined}
    />
  )

  const lista = (
    <div className="pila">
      {asignaturasConClases.length > 1 && (
        <div className="filtros">
          <label htmlFor="filtro-asignatura">Asignatura</label>
          <select id="filtro-asignatura" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todas</option>
            {asignaturasConClases.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
          </select>
        </div>
      )}
      {errorAccion && <Aviso>{errorAccion}</Aviso>}
      <section className="tarjeta">
        <h2>Próximas clases ({proximas.length})</h2>
        {proximas.length ? <ul className="clases">{proximas.map(tarjeta)}</ul> : <p className="vacio">No hay clases programadas.</p>}
      </section>
      {realizadas.length > 0 && (
        <section className="tarjeta">
          <h2>Clases realizadas ({realizadas.length})</h2>
          <ul className="clases">{realizadas.map(tarjeta)}</ul>
        </section>
      )}
    </div>
  )

  return (
    <>
      <div>
        <h1>Clases</h1>
        <p className="sub">{puedeCrear ? 'Programa cada clase con su fecha, contenidos y material.' : 'Revisa qué contenido se ve en cada clase.'}</p>
      </div>
      {puedeCrear ? (
        <div className="dos">
          {lista}
          <section className="tarjeta">
            <h2>{editando ? 'Editar clase' : 'Nueva clase'}</h2>
            <FormClase
              key={editando?.id ?? 'nueva'}
              asignaturas={asignaturasUnicas(asignaciones)}
              editando={editando}
              onListo={() => {
                setEditando(null)
                reload()
              }}
              onCancelar={() => setEditando(null)}
            />
          </section>
        </div>
      ) : (
        lista
      )}
    </>
  )
}
