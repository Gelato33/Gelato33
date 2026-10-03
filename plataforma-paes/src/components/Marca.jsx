import { marca } from '../lib/marca'

// Logo del programa. Sin logo configurado muestra la inicial y el nombre.
export function Logo({ grande = false }) {
  if (!marca.logo) {
    return (
      <div className={`marca${grande ? ' grande' : ''}`}>
        <i aria-hidden="true">{marca.nombre.charAt(0)}</i>
        {marca.nombre}
      </div>
    )
  }
  return (
    <div className={`marca con-logo${grande ? ' grande' : ''}`}>
      <img src={marca.logo} alt={marca.nombre} />
    </div>
  )
}

// Logos de las instituciones que respaldan el programa.
export function LogosInstitucionales({ etiqueta }) {
  if (!marca.institucionales.length) return null
  return (
    <div className="institucionales">
      {etiqueta && <small>{etiqueta}</small>}
      <div>
        {marca.institucionales.map((l) => <img key={l.src} src={l.src} alt={l.alt} />)}
      </div>
    </div>
  )
}
