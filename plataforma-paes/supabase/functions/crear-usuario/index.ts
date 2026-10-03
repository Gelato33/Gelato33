// Edge Function: crea estudiantes y docentes. Solo la puede usar un administrador.
// Crear usuarios requiere la service role key, que nunca debe estar en el navegador.
// Despliegue: supabase functions deploy crear-usuario
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const url = Deno.env.get('SUPABASE_URL')!
  const llamante = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: { user } } = await llamante.auth.getUser()
  if (!user) return responder({ error: 'No autenticado' }, 401)

  const { data: perfil } = await admin.from('profiles').select('rol, activo').eq('id', user.id).single()
  if (perfil?.rol !== 'admin' || !perfil.activo) return responder({ error: 'Solo un administrador puede crear usuarios' }, 403)

  const { nombre, email, password, rol, asignatura_ids } = await req.json()
  if (!nombre?.trim() || !email?.trim() || !password || password.length < 8) {
    return responder({ error: 'Completa nombre, correo y una contraseña de al menos 8 caracteres' }, 400)
  }
  if (!['estudiante', 'profesor'].includes(rol)) return responder({ error: 'Rol no válido' }, 400)

  const { data: creado, error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  })
  if (error || !creado.user) return responder({ error: error?.message ?? 'No se pudo crear el usuario' }, 400)

  // Si algo falla después de crear la cuenta, se borra para no dejar usuarios a medias.
  const id = creado.user.id
  const revertir = async (mensaje: string) => {
    await admin.auth.admin.deleteUser(id)
    return responder({ error: mensaje }, 400)
  }

  const { error: errPerfil } = await admin
    .from('profiles')
    .insert({ id, nombre: nombre.trim(), email: email.trim(), rol })
  if (errPerfil) return await revertir(errPerfil.message)

  if (rol === 'estudiante' && Array.isArray(asignatura_ids) && asignatura_ids.length) {
    const { error: errMat } = await admin
      .from('matriculas')
      .insert(asignatura_ids.map((asignatura_id: string) => ({ asignatura_id, estudiante_id: id })))
    if (errMat) return await revertir(errMat.message)
  }
  return responder({ id })
})
