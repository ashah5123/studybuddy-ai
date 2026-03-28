import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuiz } from '@/lib/gemini'
import { createQuiz } from '@/lib/supabase'
import { trackQuizGenerated } from '@/lib/analytics'
import type { Subject, Plan } from '@/lib/types'
import type { TypedSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = (await createClient()) as unknown as TypedSupabaseClient

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    questionId: string
    answer: string
    subject: Subject
    sessionId?: string
  }

  const { questionId, answer, subject, sessionId } = body

  if (!questionId || !answer || !subject) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as Plan

  const quizData = await generateQuiz(answer, subject)

  const saved = await createQuiz(supabase, {
    question_id: questionId,
    user_id: user.id,
    quiz_data: quizData,
    score: null,
    completed_at: null,
  })

  await trackQuizGenerated(supabase, {
    userId: user.id,
    subject,
    plan,
    sessionId,
  })

  return NextResponse.json({ quiz: quizData, quizId: saved.id })
}
