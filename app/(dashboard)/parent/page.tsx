import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TypedSupabaseClient } from '@/lib/supabase'
import type { FamilyMember } from '@/lib/types'
import ParentClient from './parent-client'

export const metadata: Metadata = { title: 'Family Dashboard' }

interface MemberStats {
  member: FamilyMember
  profile: { name: string | null; email: string; streak: number; questions_today: number } | null
  totalQuestions: number
  avgScore: number | null
  subjectBreakdown: { subject: string; count: number }[]
  recentActivity: { question_text: string; subject: string; created_at: string }[]
}

export default async function ParentPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const typedDb = supabase as unknown as TypedSupabaseClient
  const user = await getUser(typedDb, authUser.id)

  if (!user) redirect('/login')
  if (user.plan !== 'family') redirect('/upgrade')

  const { data: membersRaw } = await typedDb
    .from('family_members' as any)
    .select('*')
    .eq('owner_id', authUser.id)
    .neq('status', 'removed')
    .order('invited_at', { ascending: true })

  const members = (membersRaw ?? []) as FamilyMember[]
  const admin = createAdminClient()

  const memberStats: MemberStats[] = await Promise.all(
    members.map(async (member) => {
      if (!member.member_id) {
        return { member, profile: null, totalQuestions: 0, avgScore: null, subjectBreakdown: [], recentActivity: [] }
      }

      const [profileResult, totalResult, quizzesResult, subjectResult, activityResult] =
        await Promise.all([
          admin.from('users').select('name, email, streak, questions_today').eq('id', member.member_id).single(),
          admin.from('questions').select('*', { count: 'exact', head: true }).eq('user_id', member.member_id),
          admin.from('quizzes').select('score').eq('user_id', member.member_id).not('score', 'is', null),
          admin.from('analytics_events')
            .select('subject')
            .eq('user_id', member.member_id)
            .eq('event_type', 'question_asked')
            .not('subject', 'is', null),
          admin.from('questions')
            .select('question_text, subject, created_at')
            .eq('user_id', member.member_id)
            .order('created_at', { ascending: false })
            .limit(5),
        ])

      const scores = (quizzesResult.data ?? []).map((q) => q.score ?? 0)
      const avgScore =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length / 3) * 100)
          : null

      const subjectCounts: Record<string, number> = {}
      for (const row of subjectResult.data ?? []) {
        if (row.subject) subjectCounts[row.subject] = (subjectCounts[row.subject] ?? 0) + 1
      }
      const subjectBreakdown = Object.entries(subjectCounts)
        .map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count)

      return {
        member,
        profile: profileResult.data as MemberStats['profile'],
        totalQuestions: totalResult.count ?? 0,
        avgScore,
        subjectBreakdown,
        recentActivity: (activityResult.data ?? []) as MemberStats['recentActivity'],
      }
    })
  )

  return <ParentClient owner={user} memberStats={memberStats} />
}
