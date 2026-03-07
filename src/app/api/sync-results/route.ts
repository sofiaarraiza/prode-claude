import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cliente con service role para poder actualizar matches sin RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!

// ID de la Copa del Mundo 2026 en API-Football
// Este ID puede necesitar actualizarse cuando la API lo confirme
const WORLD_CUP_2026_ID = 1 // placeholder - ver nota abajo

export async function POST(request: Request) {
  try {
    // Verificar que viene del admin (chequeo simple por header)
    const authHeader = request.headers.get('x-admin-token')
    if (authHeader !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 1. Obtener el ID correcto del Mundial 2026 de la API
    const leaguesRes = await fetch(
      'https://api-football-v1.p.rapidapi.com/v3/leagues?name=FIFA%20World%20Cup&season=2026',
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
        },
      }
    )

    const leaguesData = await leaguesRes.json()
    const league = leaguesData.response?.[0]

    if (!league) {
      // Si no encuentra el Mundial 2026 todavía, intentar con 2022 para testing
      return NextResponse.json({
        error: 'Mundial 2026 no disponible aún en la API',
        message: 'La API-Football agrega torneos futuros cuando se aproximan. Por ahora usá carga manual.',
        leagues: leaguesData.response?.map((l: any) => ({
          id: l.league.id,
          name: l.league.name,
          season: l.seasons?.[0]?.year
        }))
      }, { status: 404 })
    }

    const leagueId = league.league.id

    // 2. Obtener fixtures terminados
    const fixturesRes = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${leagueId}&season=2026&status=FT`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
        },
      }
    )

    const fixturesData = await fixturesRes.json()
    const fixtures = fixturesData.response ?? []

    if (fixtures.length === 0) {
      return NextResponse.json({ message: 'No hay partidos terminados todavía', updated: 0 })
    }

    // 3. Actualizar cada partido en Supabase
    let updated = 0
    let errors = []

    for (const fixture of fixtures) {
      const homeTeam = fixture.teams.home.name
      const awayTeam = fixture.teams.away.name
      const homeScore = fixture.goals.home
      const awayScore = fixture.goals.away

      // Buscar el partido en nuestra DB por equipos
      const { data: match } = await supabaseAdmin
        .from('matches')
        .select('id, status')
        .ilike('home_team', `%${normalizeTeamName(homeTeam)}%`)
        .ilike('away_team', `%${normalizeTeamName(awayTeam)}%`)
        .single()

      if (match && match.status !== 'finished') {
        const { error } = await supabaseAdmin
          .from('matches')
          .update({
            home_score: homeScore,
            away_score: awayScore,
            status: 'finished'
          })
          .eq('id', match.id)

        if (error) {
          errors.push({ match: `${homeTeam} vs ${awayTeam}`, error: error.message })
        } else {
          updated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      total_finished: fixtures.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Normalizar nombres de equipos para el matching
// API-Football usa nombres en inglés, nuestra DB en español
function normalizeTeamName(name: string): string {
  const map: Record<string, string> = {
    'Argentina': 'Argentina',
    'France': 'Francia',
    'Brazil': 'Brasil',
    'England': 'Inglaterra',
    'Spain': 'España',
    'Germany': 'Alemania',
    'Portugal': 'Portugal',
    'Netherlands': 'Países Bajos',
    'Belgium': 'Bélgica',
    'Uruguay': 'Uruguay',
    'Colombia': 'Colombia',
    'Mexico': 'México',
    'USA': 'USA',
    'Japan': 'Japón',
    'South Korea': 'Corea del Sur',
    'Morocco': 'Marruecos',
    'Senegal': 'Senegal',
    'Nigeria': 'Nigeria',
    'Switzerland': 'Suiza',
    'Croatia': 'Croacia',
    'Italy': 'Italia',
    'Serbia': 'Serbia',
    'Ukraine': 'Ucrania',
    'Norway': 'Noruega',
    'Australia': 'Australia',
    'Ecuador': 'Ecuador',
    'Peru': 'Perú',
    'Chile': 'Chile',
    'Panama': 'Panamá',
    'Costa Rica': 'Costa Rica',
    'Honduras': 'Honduras',
    'Bolivia': 'Bolivia',
    'Paraguay': 'Paraguay',
    'Tunisia': 'Túnez',
    'Ghana': 'Ghana',
    'Algeria': 'Argelia',
    'Cameroon': 'Camerún',
    'Czech Republic': 'Rep. Checa',
    'Slovakia': 'Eslovaquia',
    'Slovenia': 'Eslovenia',
    'Hungary': 'Hungría',
    'Saudi Arabia': 'Arabia Saudita',
    'Iraq': 'Irak',
    'Indonesia': 'Indonesia',
    'New Zealand': 'Nueva Zelanda',
    'Angola': 'Angola',
    'Burkina Faso': 'Burkina Faso',
    'Guatemala': 'Guatemala',
    'Cuba': 'Cuba',
  }
  return map[name] ?? name
}
