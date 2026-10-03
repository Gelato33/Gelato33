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
  cursos: [
    { id: 'c1', nombre: '4° Medio A' },
    { id: 'c2', nombre: '4° Medio B' },
  ],
  usuarios: [
    { id: 'u-adm', nombre: 'Administración', email: 'admin@demo.cl', rol: 'admin', activo: true, curso_id: null },
    { id: 'u-p1', nombre: 'Rodrigo Soto', email: 'r.soto@demo.cl', rol: 'profesor', activo: true, curso_id: null },
    { id: 'u-p2', nombre: 'Claudia Bravo', email: 'c.bravo@demo.cl', rol: 'profesor', activo: true, curso_id: null },
    { id: 'u-p3', nombre: 'Marcela Pizarro', email: 'm.pizarro@demo.cl', rol: 'profesor', activo: true, curso_id: null },
    { id: 'u-p4', nombre: 'Daniela Fuentes', email: 'd.fuentes@demo.cl', rol: 'profesor', activo: true, curso_id: null },
    { id: 'u-e1', nombre: 'Camila Rojas', email: 'camila@demo.cl', rol: 'estudiante', activo: true, curso_id: 'c1' },
    { id: 'u-e2', nombre: 'Matías Soto', email: 'matias@demo.cl', rol: 'estudiante', activo: true, curso_id: 'c1' },
    { id: 'u-e3', nombre: 'Valentina Núñez', email: 'valentina@demo.cl', rol: 'estudiante', activo: true, curso_id: 'c2' },
    { id: 'u-e4', nombre: 'Benjamín Araya', email: 'benjamin@demo.cl', rol: 'estudiante', activo: false, curso_id: 'c2' },
  ],
  asignaciones: [],
  materiales: [
    { id: 'm1', curso_id: 'c1', asignatura_id: 'a1', profesor_id: 'u-p1', clase_id: 'k1', titulo: 'Funciones lineales y afines', tipo: 'youtube', url: VIDEO_EJEMPLO, created_at: dia(-1) },
    { id: 'm2', curso_id: 'c1', asignatura_id: 'a1', profesor_id: 'u-p1', clase_id: 'k2', titulo: 'Guía 4: ecuaciones cuadráticas', tipo: 'pdf', url: null, storage_path: 'demo', created_at: dia(-2) },
    { id: 'm3', curso_id: 'c1', asignatura_id: 'a3', profesor_id: 'u-p3', titulo: 'Línea de tiempo del siglo XX en Chile', tipo: 'enlace', url: 'https://www.memoriachilena.gob.cl', created_at: dia(-3) },
    { id: 'm4', curso_id: 'c1', asignatura_id: 'a4', profesor_id: 'u-p4', clase_id: 'k4', titulo: 'Mitosis y meiosis explicadas', tipo: 'youtube', url: VIDEO_EJEMPLO, created_at: dia(-4) },
  ],
  clases: [
    { id: 'k1', curso_id: 'c1', asignatura_id: 'a1', profesor_id: 'u-p1', titulo: 'Funciones lineales y afines', fecha: dia(-5), hora: '18:00', contenido: 'Concepto de función. Función lineal y afín: pendiente e intercepto.\nGráficos y tablas de valores.', objetivos: 'Reconocer y graficar funciones lineales y afines.' },
    { id: 'k2', curso_id: 'c1', asignatura_id: 'a1', profesor_id: 'u-p1', titulo: 'Ecuaciones cuadráticas', fecha: dia(2), hora: '18:00', contenido: 'Resolución por factorización y fórmula general.\nDiscriminante y tipos de soluciones.', objetivos: 'Resolver ecuaciones cuadráticas con distintos métodos.' },
    { id: 'k3', curso_id: 'c1', asignatura_id: 'a3', profesor_id: 'u-p3', titulo: 'Chile en el siglo XX: crisis del parlamentarismo', fecha: dia(3), hora: '19:30', contenido: 'Cuestión social, Constitución de 1925 y rol de las Fuerzas Armadas.', objetivos: null },
    { id: 'k4', curso_id: 'c1', asignatura_id: 'a4', profesor_id: 'u-p4', titulo: 'División celular: mitosis y meiosis', fecha: dia(4), hora: '17:00', contenido: 'Fases de la mitosis y la meiosis.\nComparación y variabilidad genética.', objetivos: 'Diferenciar mitosis y meiosis.' },
  ],
  evaluaciones: [
    { id: 'e1', curso_id: 'c1', asignatura_id: 'a1', profesor_id: 'u-p1', titulo: 'Ensayo PAES Matemática M1', tipo: 'ensayo', fecha: dia(6), detalle: '65 preguntas · 140 minutos' },
    { id: 'e2', curso_id: 'c1', asignatura_id: 'a2', profesor_id: 'u-p2', titulo: 'Control de Competencia Lectora', tipo: 'control', fecha: dia(13), detalle: '20 preguntas · 45 minutos' },
    { id: 'e3', curso_id: 'c2', asignatura_id: 'a4', profesor_id: 'u-p4', titulo: 'Prueba formación diferenciada técnico-profesional', tipo: 'tecnico', fecha: dia(10), detalle: '40 preguntas' },
  ],
  vistos: [{ estudiante_id: 'u-e1', material_id: 'm1' }],
}

const PROFESOR_DE = { a1: 'u-p1', a2: 'u-p2', a3: 'u-p3', a4: 'u-p4', a5: 'u-p4', a6: 'u-p4' }
for (const curso of db.cursos) {
  for (const a of db.asignaturas) {
    db.asignaciones.push({ id: nuevoId(), curso_id: curso.id, asignatura_id: a.id, profesor_id: PROFESOR_DE[a.id] })
  }
}

const yo = () => db.usuarios.find((u) => u.id === demoSesion.id)
const esperar = (valor) => new Promise((r) => setTimeout(() => r(structuredClone(valor)), 80))
const asig = (id) => db.asignaturas.find((a) => a.id === id)
const curso = (id) => db.cursos.find((c) => c.id === id)
const persona = (id) => db.usuarios.find((u) => u.id === id)
const cursoDelEstudiante = () => (yo()?.rol === 'estudiante' ? yo().curso_id : null)

// Reproduce lo que hacen las políticas RLS en Supabase.
const visible = (fila) => {
  const u = yo()
  if (u.rol === 'admin') return true
  if (u.rol === 'profesor') return fila.profesor_id === u.id
  return fila.curso_id === u.curso_id
}

const conRelaciones = (m) => ({
  ...m,
  asignatura: { nombre: asig(m.asignatura_id)?.nombre, color: asig(m.asignatura_id)?.color },
  profesor: { nombre: persona(m.profesor_id)?.nombre },
  curso: { nombre: curso(m.curso_id)?.nombre },
  clase: m.clase_id ? { titulo: db.clases.find((c) => c.id === m.clase_id)?.titulo } : null,
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
    db.asignaturas = db.asignaturas.filter((a) => a.id !== id)
  },
}

export const cursos = {
  list: () => esperar(db.cursos),
  create: async ({ nombre }) => {
    db.cursos.push({ id: nuevoId(), nombre })
  },
}

export const usuarios = {
  list: (rol) =>
    esperar(db.usuarios.filter((u) => u.rol === rol).map((u) => ({ ...u, curso: curso(u.curso_id)?.nombre ?? null }))),
  create: async ({ nombre, email, rol, curso_id }) => {
    if (db.usuarios.some((u) => u.email === email)) throw new Error('Ya existe un usuario con ese correo')
    db.usuarios.push({ id: nuevoId(), nombre, email, rol, activo: true, curso_id: rol === 'estudiante' ? curso_id || null : null })
  },
  setActivo: async (id, activo) => {
    persona(id).activo = activo
  },
}

export const asignaciones = {
  list: () =>
    esperar(
      db.asignaciones
        .filter((a) => {
          const u = yo()
          if (u.rol === 'admin') return true
          if (u.rol === 'profesor') return a.profesor_id === u.id
          return a.curso_id === cursoDelEstudiante()
        })
        .map(conRelaciones),
    ),
  create: async (a) => {
    if (db.asignaciones.some((x) => x.curso_id === a.curso_id && x.asignatura_id === a.asignatura_id)) {
      throw new Error('Ese curso ya tiene docente para esa asignatura')
    }
    db.asignaciones.push({ id: nuevoId(), ...a })
  },
  remove: async (id) => {
    db.asignaciones = db.asignaciones.filter((a) => a.id !== id)
  },
}

export const materiales = {
  list: () => esperar(db.materiales.filter(visible).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(conRelaciones)),
  create: async ({ curso_id, asignatura_id, clase_id, titulo, tipo, url, archivo }) => {
    const fila = { id: nuevoId(), curso_id, asignatura_id, clase_id: clase_id || null, profesor_id: yo().id, titulo, tipo, created_at: new Date().toISOString().slice(0, 10) }
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
