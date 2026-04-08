import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuiz } from '@/lib/ai/generateQuiz'

type ReqBody = {
  noteText?: string
  title?: string
  sourceFileUrl?: string
  courseId?: string | null
  options?: {
    questionCount?: 5 | 10 | 20 | 50
    questionType?: 'multiple_choice' | 'true_false' | 'short_answer' | 'all'
    difficulty?: 'easy' | 'medium' | 'hard'
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as ReqBody
  const noteText = body.noteText?.trim() ?? ''
  if (!noteText) return NextResponse.json({ error: 'Note text is required' }, { status: 400 })

  try {
    const generated = await generateQuiz(noteText, {
      questionCount: body.options?.questionCount ?? 10,
      questionType: body.options?.questionType ?? 'all',
      difficulty: body.options?.difficulty ?? 'medium',
    })

    const { data: quiz, error: quizErr } = await supabase
      .from('quizzes')
      .insert({
        user_id: user.id,
        course_id: body.courseId ?? null,
        title: body.title?.trim() || 'Auto Quiz',
        source_file_url: body.sourceFileUrl ?? null,
        total_questions: generated.questions.length,
      })
      .select('id')
      .single()
    if (quizErr || !quiz) {
      return NextResponse.json({ error: quizErr?.message ?? 'Failed to save quiz' }, { status: 500 })
    }

    const rows = generated.questions.map((q) => ({
      quiz_id: quiz.id,
      question_text: q.question,
      type: q.type,
      options: q.options ?? [],
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }))
    const { error: qErr } = await supabase.from('quiz_questions').insert(rows)
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

    return NextResponse.json({ quizId: quiz.id, questions: generated.questions })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}

