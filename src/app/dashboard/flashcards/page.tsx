import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFlashcardDecks } from '@/lib/supabase/queries'
import { FlashcardsManager } from '@/components/flashcards/FlashcardsManager'

export default async function FlashcardsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const decks = await getFlashcardDecks(user.id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600/90">
          Practice
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Flashcards
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          Decks and Q&amp;A cards for repetition — stored on your account.
        </p>
      </div>
      <FlashcardsManager initialDecks={decks} />
    </div>
  )
}
