import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { api } from '../data/api'
import { useAsync } from '../lib/useAsync'
import { fechaCorta, hoyISO } from '../lib/utils'
import { Anillo, Aviso, Cargando, Evaluacion, Material } from '../components/ui'

export default function EstudianteInicio() {
  const { perfil } = useAuth()
  const { data, error, loading } = useAsync(() =>
    Promise.all([api.asignaciones.list(), api.materiales.list(), api.evaluaciones.list(), api.vistos.list()]),
  )
  if (loading) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>

  const [asignaciones, materiales, evaluaciones, vistos] = data
  const vistosSet = new Set(vistos)
  const filas = asignaciones.map((a) => {
    const mats = materiales.filter((m) => m.asignatura_id === a.asignatura_id && m.curso_id === a.curso_id)
    const v = mats.filter((m) => vistosSet.has(m.id)).length
    return { ...a, total: mats.length, vistos: v, pct: mats.length ? Math.round((100 * v) / mats.length) : 0 }
  })
  const total = filas.reduce((s, f) => s + f.total, 0)
  const totalVistos = filas.reduce((s, f) => s + f.vistos, 0)
  const pctGeneral = total ? Math.round((100 * totalVistos) / total) : 0
  const proximas = evaluaciones.filter((e) => e.fecha >= hoyISO())
  const proxima = proximas[0]

  return (
    <>
      <div>
        <h1>¡Hola, {perfil.nombre.split(' ')[0]}!</h1>
        <p className="sub">{total ? `Has visto ${totalVistos} de ${total} materiales.` : 'Aún no hay material publicado.'}</p>
      </div>

      <div className="hero">
        <div className="meta">
          <small>Avance general</small>
          <b>{pctGeneral}%</b>
          <span>{total - totalVistos > 0 ? `Te faltan ${total - totalVistos} materiales por ver` : 'Estás al día con el material'}</span>
          <div className="progreso"><i style={{ width: `${pctGeneral}%` }} /></div>
        </div>
        <div className="racha">
          <small>Próxima evaluación</small>
          {proxima ? (
            <>
              <b>{fechaCorta(proxima.fecha)}</b>
              <span>{proxima.titulo}</span>
            </>
          ) : (
            <span>No hay evaluaciones programadas.</span>
          )}
        </div>
      </div>

      <section>
        <h2>Mis asignaturas</h2>
        {filas.length === 0 ? (
          <Aviso tipo="info">Todavía no estás inscrito en ninguna asignatura. Pide al administrador que te asigne a un curso.</Aviso>
        ) : (
          <div className="asignaturas">
            {filas.map((f) => (
              <Link key={f.id} to={`/asignatura/${f.id}`} className="asignatura" style={{ background: f.asignatura.color }}>
                <div>
                  <h3>{f.asignatura.nombre}</h3>
                  <small>{f.total} materiales · {f.profesor.nombre}</small>
                </div>
                <div className="fila-anillo">
                  <small>Prof. {f.profesor.nombre.split(' ').slice(-1)}</small>
                  <Anillo pct={f.pct} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="dos">
        <section className="tarjeta">
          <h2>Próximas evaluaciones</h2>
          {proximas.length ? <ul>{proximas.slice(0, 4).map((e) => <Evaluacion key={e.id} e={e} />)}</ul> : <p className="vacio">Sin evaluaciones próximas.</p>}
        </section>
        <section className="tarjeta">
          <h2>Material reciente</h2>
          {materiales.length ? (
            <ul>{materiales.slice(0, 4).map((m) => <Material key={m.id} m={m} />)}</ul>
          ) : (
            <p className="vacio">Aún no hay material.</p>
          )}
        </section>
      </div>
    </>
  )
}
