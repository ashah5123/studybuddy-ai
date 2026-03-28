'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteQuestion(questionId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/notebook')
  return {}
}
