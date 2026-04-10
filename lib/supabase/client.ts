import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function isSupabaseConfigured() {
  const configured = Boolean(supabaseUrl && supabaseAnonKey)
  console.log("[v0] Supabase configured:", configured, "URL:", supabaseUrl ? "SET" : "NOT SET", "KEY:", supabaseAnonKey ? "SET" : "NOT SET")
  return configured
}

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
