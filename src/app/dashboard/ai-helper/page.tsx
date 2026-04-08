import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConversationHistory, getCourses } from '@/lib/supabase/queries'
import { AIHelperWorkspace } from '@/components/ai/AIHelperWorkspace'

export default async function AIHelperPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [courses, conversations] = await Promise.all([
    getCourses(user.id),
    getConversationHistory(user.id, 30),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sb-muted)]">
          Personalized AI
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          AI Homework Helper
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--sb-muted)]">
          Context-aware support using your courses, recent study notes, and prior conversation history.
        </p>
      </div>
      <AIHelperWorkspace courses={courses} initialConversations={conversations} />
    </div>
  )
}

