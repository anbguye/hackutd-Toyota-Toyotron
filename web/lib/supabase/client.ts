import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    "Missing env.NEXT_PUBLIC_SUPABASE_URL, see .env.example for required env vars"
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY, see .env.example for required env vars"
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


