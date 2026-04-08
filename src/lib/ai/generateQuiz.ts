import Groq from 'groq-sdk'
import type { QuizQuestionType } from '@/types/database.types'

export interface GenerateQuizOptions {
  questionCount: 5 | 10 | 20 | 50
  questionType: QuizQuestionType | 'all'
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface GeneratedQuizQuestion {
  type: QuizQuestionType
  question: string
  options?: string[]
  correct_answer: string
  explanation: string
}

export interface GeneratedQuiz {
  questions: GeneratedQuizQuestion[]
}

function extractJson(payload: string): string {
  const start = payload.indexOf('{')
  const end = payload.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('AI response was not valid JSON')
  return payload.slice(start, end + 1)
}

function normalizeType(t: string): QuizQuestionType {
  if (t === 'true_false') return t
  if (t === 'short_answer') return t
  return 'multiple_choice'
}

export async function generateQuiz(
  noteText: string,
  options: GenerateQuizOptions
): Promise<GeneratedQuiz> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Missing GROQ_API_KEY')
  if (!noteText.trim()) throw new Error('Note text is required for quiz generation')

  const clippedText = noteText.slice(0, 40_000)
  const prompt = [
    `You are a teacher creating a quiz from these notes:\n${clippedText}`,
    `Generate ${options.questionCount} questions of type ${options.questionType}.`,
    `Difficulty: ${options.difficulty}.`,
    'Return only strict JSON:',
    '{"questions":[{"type":"multiple_choice","question":"...","options":["A","B","C","D"],"correct_answer":"A","explanation":"..."}]}',
    'For true_false, options must be ["True","False"].',
    'For short_answer, options should be omitted.',
  ].join('\n\n')

  const client = new Groq({ apiKey })
  const completion = await client.chat.completions.create({
    model: process.env.GROQ_MODEL ?? 'llama-3.1-70b-versatile',
    temperature: 0.3,
    max_tokens: 1800,
    messages: [
      {
        role: 'system',
        content:
          'You generate high-quality quizzes from notes and always return valid JSON without markdown.',
      },
      { role: 'user', content: prompt },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  let parsed: { questions?: Array<Record<string, unknown>> }
  try {
    parsed = JSON.parse(extractJson(raw))
  } catch {
    throw new Error('Failed to parse AI quiz response')
  }

  const rows = parsed.questions
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('AI did not return any quiz questions')
  }

  const questions: GeneratedQuizQuestion[] = rows.map((row) => {
    const type = normalizeType(String(row.type ?? 'multiple_choice'))
    const opts = Array.isArray(row.options) ? row.options.map(String) : undefined
    return {
      type,
      question: String(row.question ?? ''),
      options:
        type === 'multiple_choice'
          ? (opts?.length ? opts : ['Option A', 'Option B', 'Option C', 'Option D'])
          : type === 'true_false'
            ? ['True', 'False']
            : undefined,
      correct_answer: String(row.correct_answer ?? ''),
      explanation: String(row.explanation ?? ''),
    }
  })

  const valid = questions.filter((q) => q.question.trim() && q.correct_answer.trim())
  if (valid.length === 0) throw new Error('Generated quiz questions were invalid')
  return { questions: valid.slice(0, options.questionCount) }
}

