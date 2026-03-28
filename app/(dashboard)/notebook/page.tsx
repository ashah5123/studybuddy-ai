import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { listQuestions, listQuizzes } from '@/lib/supabase'
import type { TypedSupabaseClient } from '@/lib/supabase'
import NotebookClient from './notebook-client'

export const metadata: Metadata = { title: 'Notebook' }

export default async function NotebookPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const typedDb = supabase as unknown as TypedSupabaseClient

  const [questions, quizzes] = await Promise.all([
    listQuestions(typedDb, authUser.id, { limit: 200 }),
    listQuizzes(typedDb, authUser.id, { limit: 500 }),
  ])

  return <NotebookClient questions={questions} quizzes={quizzes} />
}
