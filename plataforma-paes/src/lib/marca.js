// Personalización por institución. Se cambia con variables de entorno, sin tocar el código.
export const marca = {
  nombre: import.meta.env.VITE_APP_NAME || 'Pre PAES',
  color: import.meta.env.VITE_BRAND_COLOR || '#5b3df5',
  maxEstudiantes: Number(import.meta.env.VITE_MAX_ESTUDIANTES) || 150,
}
