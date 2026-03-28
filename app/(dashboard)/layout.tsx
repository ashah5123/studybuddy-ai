import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase'
import Sidebar from './sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const user = await getUser(supabase as never, authUser.id)

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} />

      {/* Main content — offset by sidebar width on desktop, add top padding on mobile for hamburger */}
      <main className="lg:pl-64 min-h-screen">
        <div className="pt-16 lg:pt-0 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
