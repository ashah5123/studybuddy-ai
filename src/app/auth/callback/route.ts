import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // The DB trigger handle_new_user() auto-creates the profile row on
      // first sign-in, so no manual insert is needed here.
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — send the user back to login with an error hint.
  return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`)
}
