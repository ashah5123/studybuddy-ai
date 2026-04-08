import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountSettingsForm } from '@/components/settings/AccountSettingsForm'
import type { Profile } from '@/types/database.types'

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const p = profile as Profile | null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600/90">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Manage your profile details, email, and password.
        </p>
      </div>

      <AccountSettingsForm
        initialEmail={user.email ?? p?.email ?? ''}
        initialFullName={p?.full_name ?? ''}
        initialBio={p?.bio ?? ''}
      />
    </div>
  )
}
