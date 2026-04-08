import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCourses } from '@/lib/supabase/queries'
import { QuizGeneratorWorkspace } from '@/components/quiz/QuizGeneratorWorkspace'

export default async function QuizGeneratorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const courses = await getCourses(user.id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sb-muted)]">
          AI Practice
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Quiz Generator
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--sb-muted)]">
          Upload notes and generate AI-powered quizzes with explanations, then turn missed concepts
          into flashcards.
        </p>
      </div>

      <QuizGeneratorWorkspace courses={courses} />
    </div>
  )
}

