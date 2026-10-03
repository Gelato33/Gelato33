const ID_YOUTUBE = /^[\w-]{11}$/

// Acepta youtu.be/ID, youtube.com/watch?v=ID, /embed/ID, /shorts/ID y /live/ID.
export function idYoutube(texto = '') {
  try {
    const u = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`)
    const host = u.hostname.replace(/^www\./, '')
    let id = null
    if (host === 'youtu.be') id = u.pathname.slice(1)
    else if (host === 'youtube.com' || host === 'm.youtube.com') {
      id = u.pathname === '/watch' ? u.searchParams.get('v') : u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]
    }
    return id && ID_YOUTUBE.test(id) ? id : null
  } catch {
    return null
  }
}

// Solo http(s): evita enlaces javascript: puestos por un usuario.
export function urlSegura(texto = '') {
  try {
    const u = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null
  } catch {
    return null
  }
}

export function fechaCorta(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '')
}

export const hoyISO = () => new Date().toISOString().slice(0, 10)

export const ETIQUETA_EVALUACION = { ensayo: 'Ensayo', control: 'Control', tecnico: 'Liceo técnico' }
export const ETIQUETA_TIPO = { pdf: 'PDF', youtube: 'Video de YouTube', enlace: 'Enlace' }
