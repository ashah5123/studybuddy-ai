import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SchedulePlanner } from '@/components/schedule/SchedulePlanner'

export default async function SchedulePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600/90">
          Plan
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Schedule
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          Book study blocks and personal time. Pick a highlight color for each block so your month view
          stays easy to scan.
        </p>
      </div>
      <SchedulePlanner />
    </div>
  )
}
