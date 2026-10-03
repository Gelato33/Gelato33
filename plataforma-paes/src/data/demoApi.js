// Modo demo: mismos métodos que supabaseApi.js, con datos de ejemplo guardados en memoria.
// Se reinician al recargar la página.
const hoy = new Date()
const dia = (n) => {
  const d = new Date(hoy)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

let contador = 100
const nuevoId = () => `d${contador++}`
const VIDEO_EJEMPLO = 'https://www.youtube.com/watch?v=M7lc1UVf-VE'
const TODAS = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6']

export const demoSesion = { id: null }

export const db = {
  asignaturas: [
    { id: 'a1', nombre: 'Matemática M1', color: '#2f6fed', activa: true },
    { id: 'a2', nombre: 'Competencia Lectora', color: '#d9443c', activa: true },
    { id: 'a3', nombre: 'Historia y Cs. Sociales', color: '#b87400', activa: true },
    { id: 'a4', nombre: 'Ciencias · Biología', color: '#16875c', activa: true },
    { id: 'a5', nombre: 'Ciencias · Física', color: '#7447d1', activa: true },
    { id: 'a6', nombre: 'Ciencias · Química', color: '#cc3d85', activa: true },
  ],
  usuarios: [
    { id: 'u-adm', nombre: 'Administración', email: 'admin@demo.cl', rol: 'admin', activo: true, asignatura_ids: [] },
    { id: 'u-p1', nombre: 'Rodrigo Soto', email: 'r.soto@demo.cl', rol: 'profesor', activo: true, asignatura_ids: [] },
    { id: 'u-p2', nombre: 'Claudia Bravo', email: 'c.bravo@demo.cl', rol: 'profesor', activo: true, asignatura_ids: [] },
    { id: 'u-p3', nombre: 'Marcela Pizarro', email: 'm.pizarro@demo.cl', rol: 'profesor', activo: true, asignatura_ids: [] },
    { id: 'u-p4', nombre: 'Daniela Fuentes', email: 'd.fuentes@demo.cl', rol: 'profesor', activo: true, asignatura_ids: [] },
    { id: 'u-e1', nombre: 'Camila Rojas', email: 'camila@demo.cl', rol: 'estudiante', activo: true, asignatura_ids: TODAS },
    { id: 'u-e2', nombre: 'Matías Soto', email: 'matias@demo.cl', rol: 'estudiante', activo: true, asignatura_ids: ['a1', 'a2', 'a3'] },
    { id: 'u-e3', nombre: 'Valentina Núñez', email: 'valentina@demo.cl', rol: 'estudiante', activo: true, asignatura_ids: ['a1', 'a4', 'a5', 'a6'] },
    { id: 'u-e4', nombre: 'Benjamín Araya', email: 'benjamin@demo.cl', rol: 'estudiante', activo: false, asignatura_ids: ['a2'] },
  ],
  asignaciones: [
    { id: 's1', asignatura_id: 'a1', profesor_id: 'u-p1' },
    { id: 's2', asignatura_id: 'a2', profesor_id: 'u-p2' },
    { id: 's3', asignatura_id: 'a3', profesor_id: 'u-p3' },
    { id: 's4', asignatura_id: 'a4', profesor_id: 'u-p4' },
    { id: 's5', asignatura_id: 'a5', profesor_id: 'u-p4' },
    { id: 's6', asignatura_id: 'a6', profesor_id: 'u-p4' },
  ],
  clases: [
    { id: 'k1', asignatura_id: 'a1', profesor_id: 'u-p1', titulo: 'Funciones lineales y afines', fecha: dia(-5), hora: '18:00', contenido: 'Concepto de función. Función lineal y afín: pendiente e intercepto.\nGráficos y tablas de valores.', objetivos: 'Reconocer y graficar funciones lineales y afines.' },
    { id: 'k2', asignatura_id: 'a1', profesor_id: 'u-p1', titulo: 'Ecuaciones cuadráticas', fecha: dia(2), hora: '18:00', contenido: 'Resolución por factorización y fórmula general.\nDiscriminante y tipos de soluciones.', objetivos: 'Resolver ecuaciones cuadráticas con distintos métodos.' },
    { id: 'k3', asignatura_id: 'a3', profesor_id: 'u-p3', titulo: 'Chile en el siglo XX: crisis del parlamentarismo', fecha: dia(3), hora: '19:30', contenido: 'Cuestión social, Constitución de 1925 y rol de las Fuerzas Armadas.', objetivos: null },
    { id: 'k4', asignatura_id: 'a4', profesor_id: 'u-p4', titulo: 'División celular: mitosis y meiosis', fecha: dia(4), hora: '17:00', contenido: 'Fases de la mitosis y la meiosis.\nComparación y variabilidad genética.', objetivos: 'Diferenciar mitosis y meiosis.' },
  ],
  materiales: [
    { id: 'm1', asignatura_id: 'a1', profesor_id: 'u-p1', clase_id: 'k1', titulo: 'Funciones lineales y afines', tipo: 'youtube', url: VIDEO_EJEMPLO, created_at: dia(-1) },
    { id: 'm2', asignatura_id: 'a1', profesor_id: 'u-p1', clase_id: 'k2', titulo: 'Guía 4: ecuaciones cuadráticas', tipo: 'pdf', url: null, storage_path: 'demo', created_at: dia(-2) },
    { id: 'm3', asignatura_id: 'a3', profesor_id: 'u-p3', clase_id: null, titulo: 'Línea de tiempo del siglo XX en Chile', tipo: 'enlace', url: 'https://www.memoriachilena.gob.cl', created_at: dia(-3) },
    { id: 'm4', asignatura_id: 'a4', profesor_id: 'u-p4', clase_id: 'k4', titulo: 'Mitosis y meiosis explicadas', tipo: 'youtube', url: VIDEO_EJEMPLO, created_at: dia(-4) },
  ],
  evaluaciones: [
    { id: 'e1', asignatura_id: 'a1', profesor_id: 'u-p1', titulo: 'Ensayo PAES Matemática M1', tipo: 'ensayo', fecha: dia(6), detalle: '65 preguntas · 140 minutos' },
    { id: 'e2', asignatura_id: 'a2', profesor_id: 'u-p2', titulo: 'Control de Competencia Lectora', tipo: 'control', fecha: dia(13), detalle: '20 preguntas · 45 minutos' },
    { id: 'e3', asignatura_id: 'a4', profesor_id: 'u-p4', titulo: 'Prueba formación diferenciada técnico-profesional', tipo: 'tecnico', fecha: dia(10), detalle: '40 preguntas' },
  ],
  vistos: [{ estudiante_id: 'u-e1', material_id: 'm1' }],
}

const yo = () => db.usuarios.find((u) => u.id === demoSesion.id)
const esperar = (valor) => new Promise((r) => setTimeout(() => r(structuredClone(valor)), 80))
const asig = (id) => db.asignaturas.find((a) => a.id === id)
const persona = (id) => db.usuarios.find((u) => u.id === id)

// Reproduce lo que hacen las políticas RLS en Supabase.
const visible = (fila) => {
  const u = yo()
  if (u.rol === 'admin') return true
  if (u.rol === 'profesor') return fila.profesor_id === u.id
  return u.asignatura_ids.includes(fila.asignatura_id)
}

const conRelaciones = (f) => ({
  ...f,
  asignatura: { nombre: asig(f.asignatura_id)?.nombre, color: asig(f.asignatura_id)?.color },
  profesor: { nombre: persona(f.profesor_id)?.nombre },
  clase: f.clase_id ? { titulo: db.clases.find((c) => c.id === f.clase_id)?.titulo } : null,
})

export const asignaturas = {
  list: () => esperar(db.asignaturas.filter((a) => a.activa).sort((a, b) => a.nombre.localeCompare(b.nombre))),
  create: async ({ nombre, color }) => {
    db.asignaturas.push({ id: nuevoId(), nombre, color, activa: true })
  },
  remove: async (id) => {
    for (const tabla of ['asignaciones', 'materiales', 'evaluaciones', 'clases']) {
      db[tabla] = db[tabla].filter((f) => f.asignatura_id !== id)
    }
    for (const u of db.usuarios) u.asignatura_ids = u.asignatura_ids.filter((a) => a !== id)
    db.asignaturas = db.asignaturas.filter((a) => a.id !== id)
  },
}

export const usuarios = {
  list: (rol) =>
    esperar(db.usuarios.filter((u) => u.rol === rol).map((u) => ({ ...u, asignaturas: u.asignatura_ids.map((id) => asig(id)?.nombre).filter(Boolean) }))),
  create: async ({ nombre, email, rol, asignatura_ids }) => {
    if (db.usuarios.some((u) => u.email === email)) throw new Error('Ya existe un usuario con ese correo')
    db.usuarios.push({ id: nuevoId(), nombre, email, rol, activo: true, asignatura_ids: rol === 'estudiante' ? (asignatura_ids ?? []) : [] })
  },
  setActivo: async (id, activo) => {
    persona(id).activo = activo
  },
  setAsignaturas: async (id, ids) => {
    persona(id).asignatura_ids = [...ids]
  },
  // Igual que en Supabase: se borra en cascada lo que el usuario creó o tenía asociado.
  remove: async (id) => {
    const u = persona(id)
    if (!u) throw new Error('El usuario no existe')
    if (u.rol === 'admin') throw new Error('No se puede eliminar a un administrador')
    db.usuarios = db.usuarios.filter((x) => x.id !== id)
    for (const tabla of ['asignaciones', 'clases', 'materiales', 'evaluaciones']) {
      db[tabla] = db[tabla].filter((f) => f.profesor_id !== id)
    }
    for (const m of db.materiales) if (m.clase_id && !db.clases.some((c) => c.id === m.clase_id)) m.clase_id = null
    db.vistos = db.vistos.filter((v) => v.estudiante_id !== id && db.materiales.some((m) => m.id === v.material_id))
  },
}

export const matriculas = {
  mias: () => esperar(yo().asignatura_ids),
}

export const asignaciones = {
  list: () => esperar(db.asignaciones.filter(visible).map(conRelaciones)),
  create: async (a) => {
    if (db.asignaciones.some((x) => x.asignatura_id === a.asignatura_id && x.profesor_id === a.profesor_id)) {
      throw new Error('Ese docente ya está asignado a esa asignatura')
    }
    db.asignaciones.push({ id: nuevoId(), ...a })
  },
  remove: async (id) => {
    db.asignaciones = db.asignaciones.filter((a) => a.id !== id)
  },
}

export const materiales = {
  list: () => esperar(db.materiales.filter(visible).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(conRelaciones)),
  create: async ({ asignatura_id, clase_id, titulo, tipo, url, archivo }) => {
    const fila = { id: nuevoId(), asignatura_id, clase_id: clase_id || null, profesor_id: yo().id, titulo, tipo, created_at: new Date().toISOString().slice(0, 10) }
    if (tipo === 'pdf') {
      fila.url = null
      fila.storage_path = URL.createObjectURL(archivo)
    } else fila.url = url
    db.materiales.push(fila)
  },
  remove: async (m) => {
    db.materiales = db.materiales.filter((x) => x.id !== m.id)
  },
  abrir: async (m) => (m.storage_path === 'demo' ? null : (m.storage_path ?? m.url)),
}

export const clases = {
  list: () => esperar(db.clases.filter(visible).sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora ?? '').localeCompare(b.hora ?? '')).map(conRelaciones)),
  create: async (c) => {
    db.clases.push({ id: nuevoId(), profesor_id: yo().id, ...c })
  },
  update: async (id, campos) => {
    Object.assign(db.clases.find((c) => c.id === id), campos)
  },
  remove: async (id) => {
    db.clases = db.clases.filter((c) => c.id !== id)
    for (const m of db.materiales) if (m.clase_id === id) m.clase_id = null
  },
}

export const evaluaciones = {
  list: () => esperar(db.evaluaciones.filter(visible).sort((a, b) => a.fecha.localeCompare(b.fecha)).map(conRelaciones)),
  create: async (e) => {
    db.evaluaciones.push({ id: nuevoId(), profesor_id: yo().id, ...e })
  },
  remove: async (id) => {
    db.evaluaciones = db.evaluaciones.filter((e) => e.id !== id)
  },
}

export const vistos = {
  list: () => esperar(db.vistos.filter((v) => v.estudiante_id === yo().id).map((v) => v.material_id)),
  marcar: async (material_id, visto) => {
    db.vistos = db.vistos.filter((v) => !(v.estudiante_id === yo().id && v.material_id === material_id))
    if (visto) db.vistos.push({ estudiante_id: yo().id, material_id })
  },
}
