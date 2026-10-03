import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../data/api'
import { useAsync } from '../lib/useAsync'
import { ETIQUETA_EVALUACION, hoyISO } from '../lib/utils'
import { Aviso, Cargando, Evaluacion } from '../components/ui'

function FormEvaluacion({ asignaciones, onCreada }) {
  const [asignacionId, setAsignacionId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('ensayo')
  const [fecha, setFecha] = useState('')
  const [detalle, setDetalle] = useState('')
  const [error, setError] = useState('')
  const elegida = asignaciones.find((a) => a.id === (asignacionId || asignaciones[0]?.id))

  if (asignaciones.length === 0) return <Aviso tipo="info">No hay asignaturas asignadas para programar evaluaciones.</Aviso>

  const guardar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.evaluaciones.create({
        curso_id: elegida.curso_id, asignatura_id: elegida.asignatura_id,
        titulo: titulo.trim(), tipo, fecha, detalle: detalle.trim() || null,
      })
      setTitulo('')
      setDetalle('')
      onCreada()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="formulario" onSubmit={guardar}>
      <label>
        Asignatura y curso
        <select value={elegida?.id ?? ''} onChange={(e) => setAsignacionId(e.target.value)}>
          {asignaciones.map((a) => <option key={a.id} value={a.id}>{a.asignatura.nombre} · {a.curso.nombre}</option>)}
        </select>
      </label>
      <label>
        Título
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={120} placeholder="Ensayo PAES Matemática M1" />
      </label>
      <label>
        Tipo
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {Object.entries(ETIQUETA_EVALUACION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label>
        Fecha
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
      </label>
      <label>
        Detalle (opcional)
        <input value={detalle} onChange={(e) => setDetalle(e.target.value)} maxLength={160} placeholder="65 preguntas · 140 minutos" />
      </label>
      {error && <Aviso>{error}</Aviso>}
      <button className="btn">Programar evaluación</button>
    </form>
  )
}

export default function Evaluaciones() {
  const { perfil } = useAuth()
  const puedeCrear = perfil.rol !== 'estudiante'
  const { data, error, loading, reload } = useAsync(() => Promise.all([api.evaluaciones.list(), puedeCrear ? api.asignaciones.list() : []]))
  if (loading && !data) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>
  const [evaluaciones, asignaciones] = data
  const proximas = evaluaciones.filter((e) => e.fecha >= hoyISO())
  const pasadas = evaluaciones.filter((e) => e.fecha < hoyISO()).reverse()

  const borrar = async (id) => {
    await api.evaluaciones.remove(id)
    reload()
  }

  return (
    <>
      <div>
        <h1>Evaluaciones</h1>
        <p className="sub">Ensayos PAES, controles y pruebas para liceos técnicos.</p>
      </div>
      <div className="dos">
        <div className="pila">
          <section className="tarjeta">
            <h2>Próximas ({proximas.length})</h2>
            {proximas.length ? <ul>{proximas.map((e) => <Evaluacion key={e.id} e={e} onBorrar={puedeCrear ? () => borrar(e.id) : undefined} />)}</ul> : <p className="vacio">No hay evaluaciones programadas.</p>}
          </section>
          {pasadas.length > 0 && (
            <section className="tarjeta">
              <h2>Anteriores</h2>
              <ul>{pasadas.map((e) => <Evaluacion key={e.id} e={e} />)}</ul>
            </section>
          )}
        </div>
        {puedeCrear && (
          <section className="tarjeta">
            <h2>Programar evaluación</h2>
            <FormEvaluacion asignaciones={asignaciones} onCreada={reload} />
          </section>
        )}
      </div>
    </>
  )
}
