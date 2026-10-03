// Edge Function: crea estudiantes y docentes. Solo la puede usar un administrador.
// Despliegue: supabase functions deploy crear-usuario
import { cors, exigirAdmin, responder } from '../_shared/admin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const auth = await exigirAdmin(req)
  if ('error' in auth) return auth.error
  const { admin } = auth

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
