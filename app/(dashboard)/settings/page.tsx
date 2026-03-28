import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUser, getSubscription } from '@/lib/supabase'
import type { TypedSupabaseClient } from '@/lib/supabase'
import SettingsClient from './settings-client'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const typedDb = supabase as unknown as TypedSupabaseClient

  const [user, subscription, totalQuestionsResult] = await Promise.all([
    getUser(typedDb, authUser.id),
    getSubscription(typedDb, authUser.id),
    typedDb
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .then(({ count }) => count ?? 0),
  ])

  if (!user) redirect('/login')

  return (
    <SettingsClient
      user={user}
      subscription={subscription}
      totalQuestions={totalQuestionsResult}
    />
  )
}
