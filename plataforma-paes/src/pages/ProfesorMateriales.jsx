import { useState } from 'react'
import { api } from '../data/api'
import { useAsync } from '../lib/useAsync'
import { ETIQUETA_TIPO, asignaturasUnicas, idYoutube, urlSegura } from '../lib/utils'
import { Aviso, Cargando, Material } from '../components/ui'

export default function ProfesorMateriales() {
  const { data, error, loading, reload } = useAsync(() => Promise.all([api.asignaciones.list(), api.materiales.list(), api.clases.list()]))
  const [asignaturaId, setAsignaturaId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('youtube')
  const [url, setUrl] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [claseId, setClaseId] = useState('')
  const [msg, setMsg] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (loading && !data) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>
  const [asignaciones, materiales, clases] = data
  const asignaturas = asignaturasUnicas(asignaciones)
  const elegida = asignaturas.find((a) => a.id === asignaturaId) ?? asignaturas[0]
  const clasesDeLaAsignacion = clases.filter((c) => c.asignatura_id === elegida?.id)
  const claseValida = clasesDeLaAsignacion.some((c) => c.id === claseId) ? claseId : ''

  const publicar = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (tipo === 'youtube' && !idYoutube(url)) return setMsg({ tipo: 'error', t: 'Pega un enlace de YouTube válido, por ejemplo https://youtu.be/…' })
    if (tipo === 'enlace' && !urlSegura(url)) return setMsg({ tipo: 'error', t: 'Escribe un enlace que empiece con http:// o https://' })
    if (tipo === 'pdf' && !archivo) return setMsg({ tipo: 'error', t: 'Elige un archivo PDF.' })
    if (tipo === 'pdf' && archivo.size > 20 * 1024 * 1024) return setMsg({ tipo: 'error', t: 'El PDF pesa más de 20 MB.' })
    setEnviando(true)
    try {
      await api.materiales.create({
        asignatura_id: elegida.id,
        clase_id: claseValida || null,
        titulo: titulo.trim(),
        tipo,
        url: tipo === 'pdf' ? null : (tipo === 'enlace' ? urlSegura(url) : url.trim()),
        archivo,
      })
      setTitulo('')
      setUrl('')
      setArchivo(null)
      e.target.reset()
      setMsg({ tipo: 'ok', t: 'Material publicado. Tus estudiantes ya pueden verlo.' })
      reload()
    } catch (err) {
      setMsg({ tipo: 'error', t: err.message })
    } finally {
      setEnviando(false)
    }
  }

  const borrar = async (m) => {
    try {
      await api.materiales.remove(m)
      reload()
    } catch (err) {
      setMsg({ tipo: 'error', t: err.message })
    }
  }

  return (
    <>
      <div>
        <h1>Mis materiales</h1>
        <p className="sub">Sube PDFs, videos de YouTube o enlaces para tus asignaturas.</p>
      </div>
      <div className="dos">
        <section className="tarjeta">
          <h2>Nuevo material</h2>
          {asignaturas.length === 0 ? (
            <Aviso tipo="info">Aún no tienes asignaturas asignadas. Pide al administrador que te asigne a una asignatura.</Aviso>
          ) : (
            <form className="formulario" onSubmit={publicar}>
              <label>
                Asignatura
                <select value={elegida?.id ?? ''} onChange={(e) => setAsignaturaId(e.target.value)}>
                  {asignaturas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </label>
              <label>
                Clase (opcional)
                <select value={claseValida} onChange={(e) => setClaseId(e.target.value)}>
                  <option value="">Sin clase</option>
                  {clasesDeLaAsignacion.map((c) => <option key={c.id} value={c.id}>{c.fecha} · {c.titulo}</option>)}
                </select>
              </label>
              <label>
                Título
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Guía 5: sistemas de ecuaciones" required maxLength={120} />
              </label>
              <label>
                Tipo de material
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {Object.entries(ETIQUETA_TIPO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              {tipo === 'pdf' ? (
                <label>
                  Archivo PDF (máx. 20 MB)
                  <input type="file" accept="application/pdf" onChange={(e) => setArchivo(e.target.files[0] ?? null)} />
                </label>
              ) : (
                <label>
                  {tipo === 'youtube' ? 'Enlace de YouTube' : 'Enlace'}
                  <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={tipo === 'youtube' ? 'https://youtu.be/…' : 'https://…'} required />
                </label>
              )}
              {msg && <Aviso tipo={msg.tipo === 'ok' ? 'ok' : 'error'}>{msg.t}</Aviso>}
              <button className="btn" disabled={enviando}>{enviando ? 'Publicando…' : 'Publicar material'}</button>
            </form>
          )}
        </section>
        <section className="tarjeta">
          <h2>Publicado ({materiales.length})</h2>
          {materiales.length ? (
            <ul>{materiales.map((m) => <Material key={m.id} m={m} onBorrar={() => borrar(m)} />)}</ul>
          ) : (
            <p className="vacio">Todavía no has publicado material.</p>
          )}
        </section>
      </div>
    </>
  )
}
