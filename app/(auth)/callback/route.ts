import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/templates'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/ask'
  const ref = searchParams.get('ref')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('name, welcome_email_sent')
          .eq('id', user.id)
          .single()

        if (profile && !profile.welcome_email_sent) {
          try {
            await sendWelcomeEmail({ to: user.email!, name: profile.name })
            await supabase
              .from('users')
              .update({ welcome_email_sent: true } as any)
              .eq('id', user.id)
          } catch {
            // Email failure is non-fatal
          }
        }

        if (ref) {
          try {
            await fetch(`${origin}/api/referral`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: ref, newUserId: user.id }),
            })
          } catch {
            // Referral failure is non-fatal
          }
        }
      }

      const redirectUrl = new URL(next, origin)
      return NextResponse.redirect(redirectUrl)
    }
  }

  const loginUrl = new URL('/login', origin)
  loginUrl.searchParams.set('error', 'auth_callback_failed')
  return NextResponse.redirect(loginUrl)
}
