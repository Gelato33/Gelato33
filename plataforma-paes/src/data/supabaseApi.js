import { supabase } from '../lib/supabase'

const ok = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

const SEL = '*, asignatura:asignaturas(nombre,color), profesor:profiles!profesor_id(nombre)'
const SEL_MAT = SEL + ', clase:clases(titulo)'
const SEL_EVAL = '*, asignatura:asignaturas(nombre,color)'

const llamarFuncion = async (nombre, body) => {
  const { data, error } = await supabase.functions.invoke(nombre, { body })
  if (error) {
    const detalle = await error.context?.json?.().catch(() => null)
    throw new Error(detalle?.error ?? error.message)
  }
  return data
}

const idActual = async () => (await supabase.auth.getSession()).data.session.user.id

export const asignaturas = {
  list: () => supabase.from('asignaturas').select('*').eq('activa', true).order('nombre').then(ok),
  create: ({ nombre, color }) => supabase.from('asignaturas').insert({ nombre, color }).then(ok),
  remove: (id) => supabase.from('asignaturas').delete().eq('id', id).then(ok),
}

export const usuarios = {
  list: async (rol) => {
    const filas = await supabase
      .from('profiles')
      .select('id,nombre,email,activo,matriculas(asignatura_id,asignatura:asignaturas(nombre))')
      .eq('rol', rol)
      .order('nombre')
      .then(ok)
    return filas.map((f) => ({
      ...f,
      asignatura_ids: f.matriculas.map((m) => m.asignatura_id),
      asignaturas: f.matriculas.map((m) => m.asignatura?.nombre).filter(Boolean),
    }))
  },
  // Crear y eliminar cuentas pasa por Edge Functions porque requiere la service role key.
  create: (datos) => llamarFuncion('crear-usuario', datos),
  remove: (id) => llamarFuncion('eliminar-usuario', { id }),
  setActivo: (id, activo) => supabase.from('profiles').update({ activo }).eq('id', id).then(ok),
  // Reemplaza las asignaturas en que está inscrito un estudiante.
  setAsignaturas: async (id, ids) => {
    await supabase.from('matriculas').delete().eq('estudiante_id', id).then(ok)
    if (ids.length) {
      await supabase.from('matriculas').insert(ids.map((asignatura_id) => ({ asignatura_id, estudiante_id: id }))).then(ok)
    }
  },
}

export const matriculas = {
  // Ids de las asignaturas del estudiante que inició sesión.
  mias: async () => (await supabase.from('matriculas').select('asignatura_id').then(ok)).map((m) => m.asignatura_id),
}

export const asignaciones = {
  list: () => supabase.from('asignaciones').select(SEL).then(ok),
  create: (a) => supabase.from('asignaciones').insert(a).then(ok),
  remove: (id) => supabase.from('asignaciones').delete().eq('id', id).then(ok),
}

export const materiales = {
  list: () => supabase.from('materiales').select(SEL_MAT).order('created_at', { ascending: false }).then(ok),
  create: async ({ asignatura_id, clase_id, titulo, tipo, url, archivo }) => {
    const fila = { asignatura_id, clase_id: clase_id || null, titulo, tipo }
    if (tipo === 'pdf') {
      const limpio = archivo.name.replace(/[^\w.-]+/g, '_')
      const ruta = `${await idActual()}/${crypto.randomUUID()}-${limpio}`
      const { error } = await supabase.storage.from('materiales').upload(ruta, archivo, { contentType: 'application/pdf' })
      if (error) throw new Error(error.message)
      fila.storage_path = ruta
    } else {
      fila.url = url
    }
    return supabase.from('materiales').insert(fila).then(ok)
  },
  remove: async (m) => {
    await supabase.from('materiales').delete().eq('id', m.id).then(ok)
    if (m.storage_path) await supabase.storage.from('materiales').remove([m.storage_path])
  },
  // Los PDFs son privados: se abren con un enlace firmado que vence en una hora.
  abrir: async (m) => {
    if (!m.storage_path) return m.url
    const { data, error } = await supabase.storage.from('materiales').createSignedUrl(m.storage_path, 3600)
    if (error) throw new Error(error.message)
    return data.signedUrl
  },
}

export const clases = {
  list: () => supabase.from('clases').select(SEL).order('fecha').order('hora').then(ok),
  create: (c) => supabase.from('clases').insert(c).then(ok),
  update: (id, campos) => supabase.from('clases').update(campos).eq('id', id).then(ok),
  remove: (id) => supabase.from('clases').delete().eq('id', id).then(ok),
}

export const evaluaciones = {
  list: () => supabase.from('evaluaciones').select(SEL_EVAL).order('fecha').then(ok),
  create: (e) => supabase.from('evaluaciones').insert(e).then(ok),
  remove: (id) => supabase.from('evaluaciones').delete().eq('id', id).then(ok),
}

export const vistos = {
  list: async () => (await supabase.from('vistos').select('material_id').then(ok)).map((v) => v.material_id),
  marcar: (material_id, visto) =>
    visto
      ? supabase.from('vistos').insert({ material_id }).then(ok)
      : supabase.from('vistos').delete().eq('material_id', material_id).then(ok),
}
