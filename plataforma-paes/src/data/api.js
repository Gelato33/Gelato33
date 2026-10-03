import { configurado } from '../lib/supabase'
import * as demo from './demoApi'
import * as real from './supabaseApi'

// Las pantallas solo conocen este objeto. Qué hay detrás (Supabase o demo) se decide aquí.
export const api = configurado ? real : demo
