// Edge Function: elimina de forma definitiva a un estudiante o docente. Solo para administradores.
// Al borrar la cuenta se borra en cascada su perfil, matrículas, avance y, si es docente,
// también sus clases, material y evaluaciones. Los PDFs de ese material se quitan del almacenamiento.
// Despliegue: supabase functions deploy eliminar-usuario
import { cors, exigirAdmin, responder } from '../_shared/admin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const auth = await exigirAdmin(req)
  if ('error' in auth) return auth.error
  const { admin, adminId } = auth

  const { id } = await req.json()
  if (!id) return responder({ error: 'Falta el usuario a eliminar' }, 400)
  if (id === adminId) return responder({ error: 'No puedes eliminar tu propia cuenta' }, 400)

  const { data: objetivo } = await admin.from('profiles').select('rol').eq('id', id).maybeSingle()
  if (!objetivo) return responder({ error: 'El usuario no existe' }, 404)
  if (objetivo.rol === 'admin') return responder({ error: 'No se puede eliminar a un administrador' }, 403)

  // Hay que leer las rutas de los PDFs antes de borrar, porque después las filas ya no existen.
  const { data: archivos } = await admin
    .from('materiales')
    .select('storage_path')
    .eq('profesor_id', id)
    .not('storage_path', 'is', null)
  const rutas = (archivos ?? []).map((a: { storage_path: string }) => a.storage_path)

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return responder({ error: error.message }, 400)

  if (rutas.length) await admin.storage.from('materiales').remove(rutas)
  return responder({ ok: true })
})
