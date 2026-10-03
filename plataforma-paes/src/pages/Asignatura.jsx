import { Link, useParams } from 'react-router-dom'
import { api } from '../data/api'
import { useAsync } from '../lib/useAsync'
import { Aviso, Cargando, ClaseCard, Evaluacion, Material } from '../components/ui'
import { hoyISO } from '../lib/utils'
import { useState } from 'react'

export default function Asignatura() {
  const { id } = useParams()
  const [errorAccion, setErrorAccion] = useState('')
  const { data, error, loading, reload } = useAsync(
    () => Promise.all([api.asignaciones.list(), api.materiales.list(), api.evaluaciones.list(), api.vistos.list(), api.clases.list()]),
    [id],
  )
  if (loading && !data) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>

  const [asignaciones, materiales, evaluaciones, vistos, clases] = data
  const a = asignaciones.find((x) => x.id === id)
  if (!a) return <Aviso>No encontramos esta asignatura. <Link to="/">Volver al inicio</Link></Aviso>

  const mats = materiales.filter((m) => m.asignatura_id === a.asignatura_id && m.curso_id === a.curso_id)
  const evals = evaluaciones.filter((e) => e.asignatura_id === a.asignatura_id && e.curso_id === a.curso_id)
  const vistosSet = new Set(vistos)
  const clasesA = clases.filter((c) => c.asignatura_id === a.asignatura_id && c.curso_id === a.curso_id)

  const marcar = async (materialId, visto) => {
    setErrorAccion('')
    try {
      await api.vistos.marcar(materialId, visto)
      reload()
    } catch (err) {
      setErrorAccion(err.message)
    }
  }

  return (
    <>
      <div>
        <Link to="/" className="volver">← Volver al inicio</Link>
        <h1 style={{ color: a.asignatura.color }}>{a.asignatura.nombre}</h1>
        <p className="sub">{a.curso.nombre} · Prof. {a.profesor.nombre}</p>
      </div>
      {errorAccion && <Aviso>{errorAccion}</Aviso>}
      <section className="tarjeta">
        <h2>Clases ({clasesA.length})</h2>
        {clasesA.length ? (
          <ul className="clases">
            {clasesA.map((c) => <ClaseCard key={c.id} c={c} hoy={hoyISO()} materiales={mats.filter((m) => m.clase_id === c.id)} />)}
          </ul>
        ) : (
          <p className="vacio">Tu docente aún no ha programado clases.</p>
        )}
      </section>
      <div className="dos">
        <section className="tarjeta">
          <h2>Material ({mats.length})</h2>
          {mats.length ? (
            <ul>{mats.map((m) => <Material key={m.id} m={m} visto={vistosSet.has(m.id)} onVisto={(v) => marcar(m.id, v)} />)}</ul>
          ) : (
            <p className="vacio">Tu docente aún no ha subido material.</p>
          )}
        </section>
        <section className="tarjeta">
          <h2>Evaluaciones</h2>
          {evals.length ? <ul>{evals.map((e) => <Evaluacion key={e.id} e={e} />)}</ul> : <p className="vacio">Sin evaluaciones programadas.</p>}
        </section>
      </div>
    </>
  )
}
