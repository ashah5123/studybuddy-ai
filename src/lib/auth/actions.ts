'use server'

import { revalidatePath } from 'next/cache'
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

export async function resendConfirmationEmail(
  email: string
): Promise<{ error?: string; sent?: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) return { error: error.message }
  return { sent: true }
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
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/callback`,
      skipBrowserRedirect: true,
    },
  })

  if (error) return { error: error.message }
  return { url: data.url ?? undefined }
}

type MutationResult = { success: true; message?: string } | { success: false; error: string }

export async function updateAccountProfile(input: {
  fullName: string
  bio: string
}): Promise<MutationResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const fullName = input.fullName.trim()
  const bio = input.bio.trim()

  if (!fullName) return { success: false, error: 'Full name is required' }
  if (fullName.length > 120) return { success: false, error: 'Full name is too long' }
  if (bio.length > 500) return { success: false, error: 'Bio must be 500 characters or less' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      bio: bio || null,
    })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true, message: 'Profile updated.' }
}

export async function updateAccountEmail(email: string): Promise<MutationResult> {
  const supabase = await createClient()
  const nextEmail = email.trim().toLowerCase()

  if (!nextEmail) return { success: false, error: 'Email is required' }

  const { error } = await supabase.auth.updateUser({
    email: nextEmail,
    data: { email: nextEmail },
  })

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/settings')
  return {
    success: true,
    message: 'Check your inbox to confirm the email change.',
  }
}

export async function updateAccountPassword(
  password: string,
  confirmPassword: string
): Promise<MutationResult> {
  const supabase = await createClient()
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }
  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { success: false, error: error.message }
  return { success: true, message: 'Password updated.' }
}
