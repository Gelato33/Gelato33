// Personalización por institución. Se cambia con variables de entorno, sin tocar el código.
// Los logos son archivos de public/marca/. Para otra institución reemplaza esos archivos
// (o apunta las variables a otros) y deja VITE_LOGO vacío para usar solo el nombre.
const base = import.meta.env.BASE_URL

const LOGOS_INSTITUCIONALES = [
  { src: `${base}marca/logo-municipalidad.png`, alt: 'Municipalidad de Loncoche' },
  { src: `${base}marca/logo-daem.png`, alt: 'DAEM Loncoche' },
]

const desdeEntorno = (valor, porDefecto) => (valor === undefined ? porDefecto : valor)

export const marca = {
  nombre: import.meta.env.VITE_APP_NAME || 'Abre Tu Futuro Loncoche',
  color: import.meta.env.VITE_BRAND_COLOR || '#5b3df5',
  maxEstudiantes: Number(import.meta.env.VITE_MAX_ESTUDIANTES) || 150,
  // Logo principal. Vacío = se muestra la inicial del nombre.
  logo: desdeEntorno(import.meta.env.VITE_LOGO, `${base}marca/logo-preu.png`),
  // Logos de las instituciones que respaldan el programa (aparecen en el pie y en el ingreso).
  institucionales: import.meta.env.VITE_LOGOS_INSTITUCIONALES === undefined
    ? LOGOS_INSTITUCIONALES
    : import.meta.env.VITE_LOGOS_INSTITUCIONALES.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((src) => ({ src, alt: 'Logo institucional' })),
}
