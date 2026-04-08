import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getQuizById, getQuizQuestions } from '@/lib/supabase/queries'
import { QuizTakeWorkspace } from '@/components/quiz/QuizTakeWorkspace'

export default async function TakeQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const quiz = await getQuizById(quizId, user.id)
  if (!quiz) notFound()
  const questions = await getQuizQuestions(quizId)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sb-muted)]">Quiz Mode</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          {quiz.title}
        </h1>
      </div>
      <QuizTakeWorkspace quiz={quiz} questions={questions} />
    </div>
  )
}

