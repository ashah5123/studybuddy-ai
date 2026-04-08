'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<{ error?: string; needsConfirmation?: boolean }> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Passed into raw_user_meta_data; the DB trigger reads this to
      // populate the profiles row automatically.
      data: { full_name: fullName },
    },
  })

  if (error) return { error: error.message }

  // When email confirmation is disabled, a session is returned immediately.
  if (data.session) {
    redirect('/dashboard')
  }

  // Email confirmation is enabled — tell the client to show a prompt.
  return { needsConfirmation: true }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// Returns the Google OAuth URL so the client can navigate to it.
// OAuth redirects to external URLs cannot use next/navigation redirect()
// from a server action — the URL must be returned and the browser navigated
// client-side.
export async function signInWithGoogle(): Promise<{
  url?: string
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      skipBrowserRedirect: true,
    },
  })

  if (error) return { error: error.message }
  return { url: data.url ?? undefined }
}
