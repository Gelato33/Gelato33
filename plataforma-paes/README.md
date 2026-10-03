# Plataforma PAES

Aula virtual para pre-universitarios con tres roles: **administrador**, **docente** y **estudiante**.
Hecha con Vite + React + Supabase y pensada para desplegarse en Netlify.

| Rol | Qué puede hacer |
|---|---|
| Administrador | Inscribir estudiantes y elegir en qué asignaturas participan, agregar docentes, crear y eliminar asignaturas, asignar docentes a cada asignatura, desactivar cuentas |
| Docente | Crear las clases de cada asignatura (fecha, hora, contenidos y objetivos), subir su propio material (PDF, video de YouTube o enlace) asociado a una clase y programar evaluaciones, solo en las asignaturas que tiene asignadas |
| Estudiante | Ver las clases, el material y las evaluaciones de las asignaturas en que está inscrito, reproducir videos y marcar lo que ya vio (alimenta su avance) |

## Probarla ahora (modo demo)

Sin configurar nada, la app funciona con datos de ejemplo en memoria:

```bash
cd plataforma-paes
npm install
npm run dev
```

Abre la URL que muestra la terminal y elige un rol en la pantalla de ingreso.

## Conectarla a Supabase (modo real)

1. Crea un proyecto en [supabase.com](https://supabase.com) (uno por institución).
2. En **SQL Editor**, pega y ejecuta `supabase/migrations/001_esquema.sql`. Crea las tablas (asignaturas, clases, material, evaluaciones), las reglas de seguridad por rol, el almacenamiento privado de PDFs y las 6 asignaturas iniciales.
3. Crea el primer administrador:
   - En **Authentication > Users** crea un usuario con correo y contraseña (marca "Auto Confirm User").
   - En el SQL Editor ejecuta, cambiando el correo y el nombre:
     ```sql
     insert into profiles (id, nombre, email, rol)
     select id, 'Tu Nombre', email, 'admin' from auth.users where email = 'tu@correo.cl';
     ```
4. Despliega la función que crea usuarios (necesita la [CLI de Supabase](https://supabase.com/docs/guides/cli)):
   ```bash
   supabase login
   supabase link --project-ref TU-REF
   supabase functions deploy crear-usuario
   ```
5. Copia `.env.example` como `.env.local` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (en **Project Settings > API**). Reinicia `npm run dev`.

## Publicar en Netlify

Conecta el repositorio, define **Base directory** = `plataforma-paes` y agrega las mismas variables `VITE_*` en **Site settings > Environment variables**. El archivo `netlify.toml` ya trae el comando de build y la regla para rutas.

## Personalizar para otra institución

Todo se cambia con variables de entorno, sin tocar código:

| Variable | Qué cambia |
|---|---|
| `VITE_APP_NAME` | Nombre que se ve en la barra y la pestaña |
| `VITE_BRAND_COLOR` | Color principal |
| `VITE_MAX_ESTUDIANTES` | Cupo de estudiantes activos del plan |

Cada cliente tiene su propio proyecto Supabase y su propio sitio Netlify, así los datos quedan completamente separados.

## Estructura

```
src/
  data/        api.js elige entre supabaseApi.js (real) y demoApi.js (ejemplo)
  auth/        sesión y perfil del usuario
  pages/       una pantalla por archivo
  components/  piezas compartidas
supabase/
  migrations/  esquema y reglas de seguridad (RLS)
  functions/   crear-usuario (Edge Function)
```

La seguridad vive en la base de datos (RLS), no en el navegador: aunque alguien modifique la app, Supabase solo entrega lo que su rol permite.

## Pendiente para siguientes fases

- Banco de preguntas y ensayos con corrección automática.
- Libro de calificaciones.
- Restablecer contraseña desde el panel del administrador.
- Importar estudiantes desde Excel/CSV.
- Límite de cupo aplicado también en el servidor (hoy se controla en la interfaz).
