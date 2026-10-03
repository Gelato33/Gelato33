import { useState } from 'react'
import { api } from '../data/api'
import { useAsync } from '../lib/useAsync'
import { ETIQUETA_TIPO, idYoutube, urlSegura } from '../lib/utils'
import { Aviso, Cargando, Material } from '../components/ui'

export default function ProfesorMateriales() {
  const { data, error, loading, reload } = useAsync(() => Promise.all([api.asignaciones.list(), api.materiales.list()]))
  const [asignacionId, setAsignacionId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('youtube')
  const [url, setUrl] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [msg, setMsg] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (loading && !data) return <Cargando />
  if (error) return <Aviso>{error}</Aviso>
  const [asignaciones, materiales] = data
  const etiqueta = (a) => `${a.asignatura.nombre} · ${a.curso.nombre}`
  const elegida = asignaciones.find((a) => a.id === (asignacionId || asignaciones[0]?.id))

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
        curso_id: elegida.curso_id,
        asignatura_id: elegida.asignatura_id,
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
        <p className="sub">Sube PDFs, videos de YouTube o enlaces para tus cursos.</p>
      </div>
      <div className="dos">
        <section className="tarjeta">
          <h2>Nuevo material</h2>
          {asignaciones.length === 0 ? (
            <Aviso tipo="info">Aún no tienes asignaturas asignadas. Pide al administrador que te asigne a un curso.</Aviso>
          ) : (
            <form className="formulario" onSubmit={publicar}>
              <label>
                Asignatura y curso
                <select value={elegida?.id ?? ''} onChange={(e) => setAsignacionId(e.target.value)}>
                  {asignaciones.map((a) => <option key={a.id} value={a.id}>{etiqueta(a)}</option>)}
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
            <ul>{materiales.map((m) => <Material key={m.id} m={m} mostrarCurso onBorrar={() => borrar(m)} />)}</ul>
          ) : (
            <p className="vacio">Todavía no has publicado material.</p>
          )}
        </section>
      </div>
    </>
  )
}
