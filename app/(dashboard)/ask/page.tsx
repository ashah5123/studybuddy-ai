import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase'
import AskInterface from './ask-interface'

export const metadata: Metadata = { title: 'Ask' }

export default async function AskPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const user = await getUser(supabase as never, authUser.id)

  if (!user) redirect('/login')

  return <AskInterface user={user} />
}
