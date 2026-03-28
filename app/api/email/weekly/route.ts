import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWeeklyReportEmail } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, streak')
    .not('email', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  let sent = 0
  let failed = 0

  for (const user of users ?? []) {
    try {
      const [questionsResult, subjectResult, quizResult] = await Promise.all([
        supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', oneWeekAgo.toISOString()),
        supabase
          .from('analytics_events')
          .select('subject')
          .eq('user_id', user.id)
          .eq('event_type', 'question_asked')
          .gte('created_at', oneWeekAgo.toISOString())
          .not('subject', 'is', null),
        supabase
          .from('quizzes')
          .select('score')
          .eq('user_id', user.id)
          .not('score', 'is', null)
          .gte('completed_at', oneWeekAgo.toISOString()),
      ])

      const questionsThisWeek = questionsResult.count ?? 0
      if (questionsThisWeek === 0) continue

      const subjectCounts: Record<string, number> = {}
      for (const row of subjectResult.data ?? []) {
        if (row.subject) subjectCounts[row.subject] = (subjectCounts[row.subject] ?? 0) + 1
      }
      const topSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

      const scores = (quizResult.data ?? []).map((q) => q.score ?? 0)
      const avgQuizScore =
        scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length / 3) * 100) : null

      await sendWeeklyReportEmail({
        to: user.email,
        name: user.name,
        streak: user.streak,
        questionsThisWeek,
        avgQuizScore,
        topSubject,
      })
      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
