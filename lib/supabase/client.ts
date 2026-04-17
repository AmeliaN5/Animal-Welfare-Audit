import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function isSupabaseConfigured() {
  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)
  if (typeof window !== "undefined" && !isConfigured) {
    console.warn("[Welfare Audit] Supabase 환경 변수가 설정되지 않았습니다. 데이터가 localStorage에만 저장됩니다. Vercel 프로젝트에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.")
  }
  return isConfigured
}

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
