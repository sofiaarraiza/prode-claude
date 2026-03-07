import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-admin-token')
    if (authHeader !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { match_id, home_score, away_score, status } = await request.json()

    if (!match_id) {
      return NextResponse.json({ error: 'match_id requerido' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('matches')
      .update({
        home_score: home_score ?? null,
        away_score: away_score ?? null,
        status: status ?? 'finished'
      })
      .eq('id', match_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, match: data })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
