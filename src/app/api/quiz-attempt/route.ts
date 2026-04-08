import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ReqBody = {
  quizId?: string
  timeTakenSeconds?: number
  answers?: Array<{ questionId: string; answer: string }>
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as ReqBody
  if (!body.quizId || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: 'quizId and answers are required' }, { status: 400 })
  }

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', body.quizId)
    .eq('user_id', user.id)
    .single()
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })

  const { data: questions, error: qErr } = await supabase
    .from('quiz_questions')
    .select('id, correct_answer')
    .eq('quiz_id', body.quizId)
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  const correctMap = new Map((questions ?? []).map((q) => [q.id, q.correct_answer]))
  const scored = body.answers.map((a) => {
    const correctAnswer = (correctMap.get(a.questionId) ?? '').trim().toLowerCase()
    const userAnswer = (a.answer ?? '').trim().toLowerCase()
    const isCorrect = userAnswer.length > 0 && userAnswer === correctAnswer
    return { ...a, isCorrect }
  })

  const total = Math.max(1, scored.length)
  const scoreCount = scored.filter((s) => s.isCorrect).length
  const pct = Number(((scoreCount / total) * 100).toFixed(2))

  const { data: attempt, error: attemptErr } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: body.quizId,
      user_id: user.id,
      score: pct,
      completed_at: new Date().toISOString(),
      time_taken_seconds: Math.max(0, body.timeTakenSeconds ?? 0),
    })
    .select('id')
    .single()
  if (attemptErr || !attempt) {
    return NextResponse.json({ error: attemptErr?.message ?? 'Failed to save attempt' }, { status: 500 })
  }

  const { error: responseErr } = await supabase.from('quiz_responses').insert(
    scored.map((s) => ({
      attempt_id: attempt.id,
      question_id: s.questionId,
      user_answer: s.answer || null,
      is_correct: s.isCorrect,
    }))
  )
  if (responseErr) return NextResponse.json({ error: responseErr.message }, { status: 500 })

  return NextResponse.json({
    attemptId: attempt.id,
    scorePercent: pct,
    scoreCorrect: scoreCount,
    total,
    correctness: scored.map((s) => ({ questionId: s.questionId, isCorrect: s.isCorrect })),
  })
}

