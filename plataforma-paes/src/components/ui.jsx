import { useState } from 'react'
import { fechaCorta, fechaLarga, idYoutube, urlSegura, ETIQUETA_EVALUACION } from '../lib/utils'
import { api } from '../data/api'

export const Cargando = () => <p className="estado">Cargando…</p>

export const Aviso = ({ children, tipo = 'error' }) => (
  <p className={`aviso ${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
    {children}
  </p>
)

export function Anillo({ pct }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="anillo" role="img" aria-label={`${pct}% de avance`}>
      <svg width="62" height="62" viewBox="0 0 62 62" aria-hidden="true">
        <circle cx="31" cy="31" r={r} fill="none" stroke="#ffffff45" strokeWidth="7" />
        <circle
          cx="31" cy="31" r={r} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`} transform="rotate(-90 31 31)"
        />
      </svg>
      <b>{pct}%</b>
    </div>
  )
}

export function Evaluacion({ e, onBorrar }) {
  return (
    <li className="item">
      <div>
        <b>{e.titulo}</b>
        <small>
          {e.asignatura?.nombre} · {e.curso?.nombre}
          {e.detalle ? ` · ${e.detalle}` : ''}
        </small>
        <div className="fila-tag">
          <span className={`tag ${e.tipo === 'tecnico' ? 'c' : e.tipo === 'ensayo' ? 'a' : 'b'}`}>{ETIQUETA_EVALUACION[e.tipo]}</span>
        </div>
      </div>
      <div className="lado">
        <div className="fecha">{fechaCorta(e.fecha)}</div>
        {onBorrar && <BotonBorrar onConfirmar={onBorrar} />}
      </div>
    </li>
  )
}

// Pide confirmación dentro de la página (sin diálogos del navegador).
export function BotonBorrar({ onConfirmar, texto = 'Eliminar', aviso = '¿Seguro?' }) {
  const [pidiendo, setPidiendo] = useState(false)
  if (!pidiendo) {
    return (
      <button type="button" className="btn peligro" onClick={() => setPidiendo(true)}>
        {texto}
      </button>
    )
  }
  return (
    <span className="confirmar">
      <span>{aviso}</span>
      <button type="button" className="btn peligro solido" onClick={onConfirmar}>
        Sí
      </button>
      <button type="button" className="btn sec" onClick={() => setPidiendo(false)}>
        No
      </button>
    </span>
  )
}

export function Material({ m, visto, onVisto, onBorrar, mostrarCurso }) {
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState('')
  const yt = m.tipo === 'youtube' ? idYoutube(m.url) : null
  const enlace = m.tipo === 'enlace' ? urlSegura(m.url) : null

  const abrirPdf = async () => {
    setError('')
    try {
      const url = await api.materiales.abrir(m)
      if (!url) setError('En el modo demo los PDFs de ejemplo no tienen archivo real.')
      else window.open(url, '_blank', 'noopener')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <li className="item material">
      <div className="fila">
        {m.tipo === 'youtube' ? (
          <div className="mini video"><b>YouTube</b></div>
        ) : (
          <div className="mini doc">{m.tipo === 'pdf' ? 'PDF' : 'LINK'}</div>
        )}
        <div className="cuerpo">
          <b>{m.titulo}</b>
          <small>
            {m.asignatura?.nombre}
            {mostrarCurso ? ` · ${m.curso?.nombre}` : ''} · Prof. {m.profesor?.nombre}
          </small>
          {m.clase && <small>Clase: {m.clase.titulo}</small>}
          <div className="acciones">
            {m.tipo === 'youtube' && (
              yt ? (
                <button type="button" className="btn sec" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
                  {abierto ? 'Cerrar video' : 'Ver video'}
                </button>
              ) : <small>El enlace de YouTube no es válido.</small>
            )}
            {m.tipo === 'pdf' && <button type="button" className="btn sec" onClick={abrirPdf}>Abrir PDF</button>}
            {m.tipo === 'enlace' && (
              enlace ? <a className="btn sec" href={enlace} target="_blank" rel="noopener noreferrer">Abrir enlace</a> : <small>El enlace no es válido.</small>
            )}
            {onVisto && (
              <label className="check">
                <input type="checkbox" checked={visto} onChange={(e) => onVisto(e.target.checked)} />
                Visto
              </label>
            )}
            {onBorrar && <BotonBorrar onConfirmar={onBorrar} />}
          </div>
          {error && <Aviso>{error}</Aviso>}
          {abierto && yt && (
            <div className="reproductor">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${yt}`}
                title={m.titulo}
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

export function ClaseCard({ c, materiales = [], onEditar, onBorrar, hoy }) {
  const [dia, mes] = fechaCorta(c.fecha).split(' ')
  const pasada = c.fecha < hoy
  return (
    <li className={`clase${pasada ? ' pasada' : ''}`}>
      <div className="dia" aria-hidden="true">
        <b>{dia}</b>
        <span>{mes}</span>
      </div>
      <div className="cuerpo">
        <h3>{c.titulo}</h3>
        <small>
          {c.asignatura?.nombre} · {c.curso?.nombre} · <span className="cap">{fechaLarga(c.fecha)}</span>
          {c.hora ? ` · ${c.hora.slice(0, 5)} h` : ''} · Prof. {c.profesor?.nombre}
        </small>
        {c.contenido && (
          <div className="bloque">
            <h4>Contenidos</h4>
            <p className="texto">{c.contenido}</p>
          </div>
        )}
        {c.objetivos && (
          <div className="bloque">
            <h4>Objetivos</h4>
            <p className="texto">{c.objetivos}</p>
          </div>
        )}
        {materiales.length > 0 && (
          <details className="material-clase">
            <summary>Material de la clase ({materiales.length})</summary>
            <ul>{materiales.map((m) => <Material key={m.id} m={m} />)}</ul>
          </details>
        )}
        {(onEditar || onBorrar) && (
          <div className="acciones">
            {onEditar && <button type="button" className="btn sec" onClick={onEditar}>Editar</button>}
            {onBorrar && <BotonBorrar onConfirmar={onBorrar} aviso="El material queda sin clase." />}
          </div>
        )}
      </div>
    </li>
  )
}
