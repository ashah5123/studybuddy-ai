import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendDailyReminderEmail } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, streak, last_active')
    .lt('last_active', twoDaysAgo.toISOString())
    .gt('streak', 0)
    .not('email', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let failed = 0

  for (const user of users ?? []) {
    try {
      const daysSince = Math.floor(
        (Date.now() - new Date(user.last_active!).getTime()) / (1000 * 60 * 60 * 24)
      )
      await sendDailyReminderEmail({
        to: user.email,
        name: user.name,
        streak: user.streak,
        daysSinceLastStudy: daysSince,
      })
      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
