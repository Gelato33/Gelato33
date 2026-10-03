// Piezas comunes de las Edge Functions de administración.
// Crear y borrar cuentas requiere la service role key, que nunca debe estar en el navegador.
import { createClient } from 'jsr:@supabase/supabase-js@2'

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

// Comprueba que quien llama es un administrador activo.
// Devuelve el cliente con permisos totales, o la respuesta de error que hay que enviar.
export async function exigirAdmin(req: Request) {
  const url = Deno.env.get('SUPABASE_URL')!
  const llamante = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: { user } } = await llamante.auth.getUser()
  if (!user) return { error: responder({ error: 'No autenticado' }, 401) }

  const { data: perfil } = await admin.from('profiles').select('rol, activo').eq('id', user.id).single()
  if (perfil?.rol !== 'admin' || !perfil.activo) {
    return { error: responder({ error: 'Solo un administrador puede hacer esto' }, 403) }
  }
  return { admin, adminId: user.id }
}
