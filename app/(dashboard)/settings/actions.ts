'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateUser } from '@/lib/supabase'
import type { TypedSupabaseClient } from '@/lib/supabase'

export async function updateProfile(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const name = (formData.get('name') as string)?.trim()
  const avatarUrl = (formData.get('avatar_url') as string)?.trim() || null

  if (!name) return { error: 'Name is required' }

  try {
    await updateUser(supabase as unknown as TypedSupabaseClient, user.id, {
      name,
      avatar_url: avatarUrl,
    })

    revalidatePath('/settings')
    return {}
  } catch {
    return { error: 'Failed to update profile. Please try again.' }
  }
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  try {
    const admin = createAdminClient()
    await admin.auth.admin.deleteUser(user.id)
    await supabase.auth.signOut()
  } catch {
    return { error: 'Failed to delete account. Please contact support.' }
  }

  redirect('/')
}
