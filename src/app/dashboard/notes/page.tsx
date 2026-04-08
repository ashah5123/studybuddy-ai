import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNotes } from '@/lib/supabase/queries'
import { NotesManager } from '@/components/notes/NotesManager'

export default async function NotesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const notes = await getNotes(user.id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sb-muted)]">
          Capture
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Notes
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--sb-muted)]">
          Jot summaries and reminders. Everything syncs to your Supabase project.
        </p>
      </div>
      <NotesManager initialNotes={notes} />
    </div>
  )
}
