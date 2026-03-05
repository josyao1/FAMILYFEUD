import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getInitialState } from '@/lib/gameActions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST() {
  let code = generateCode()
  let attempts = 0

  // Ensure uniqueness
  while (attempts < 10) {
    const { data } = await supabase.from('familyfeud_games').select('code').eq('code', code).single()
    if (!data) break
    code = generateCode()
    attempts++
  }

  const state = getInitialState()

  const { error } = await supabase.from('familyfeud_games').insert({ code, state })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ code })
}
