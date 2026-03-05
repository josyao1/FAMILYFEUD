import { createClient } from '@supabase/supabase-js'
import { GameState } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type GameRow = {
  code: string
  state: GameState
  created_at: string
}
