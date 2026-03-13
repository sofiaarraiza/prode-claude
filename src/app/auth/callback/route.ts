import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    await supabase.auth.exchangeCodeForSession(code)

    // Si había un código de grupo pendiente en cookie, auto-join
    const inviteCode = cookieStore.get('pending_invite_code')?.value
    if (inviteCode) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: group } = await supabase
          .from('groups').select('id').eq('invite_code', inviteCode.toUpperCase()).single()

        if (group) {
          const { data: existing } = await supabase
            .from('group_members').select('id')
            .eq('group_id', group.id).eq('user_id', session.user.id).single()

          if (!existing) {
            await supabase.from('group_members').insert({ group_id: group.id, user_id: session.user.id })
          }

          const response = NextResponse.redirect(new URL(`/grupos/${group.id}`, requestUrl.origin))
          response.cookies.delete('pending_invite_code')
          return response
        }
      }
      const response = NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
      response.cookies.delete('pending_invite_code')
      return response
    }
  }

  // Check if user needs to set a username
  const cookieStore2 = cookies()
  const supabase2 = createRouteHandlerClient({ cookies: () => cookieStore2 })
  const { data: { session } } = await supabase2.auth.getSession()
  if (session) {
    const { data: profile } = await supabase2
      .from('profiles').select('username').eq('id', session.user.id).single()
    if (!profile?.username) {
      return NextResponse.redirect(new URL('/auth/username', requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
