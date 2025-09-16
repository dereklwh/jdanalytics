import { createClient } from '@supabase/supabase-js'

// Replace with your own values from Supabase Project Settings → API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)