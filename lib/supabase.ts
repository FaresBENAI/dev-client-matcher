import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Pour la compatibilité avec l'ancien code
function createClientFunction() {
  return supabase
}

export { supabase, createClientFunction as createClient }
export default supabase
