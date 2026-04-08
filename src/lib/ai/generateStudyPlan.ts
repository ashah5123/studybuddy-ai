import Groq from 'groq-sdk'

export interface StudyPlanExamInput {
  course: string
  date: string
  priority: 'low' | 'medium' | 'high'
}

export interface StudyPlanDayTask {
  course: string
  topic: string
  duration: number
  priority: 'low' | 'medium' | 'high'
}

export interface StudyPlanDay {
  date: string
  tasks: StudyPlanDayTask[]
}

export interface GeneratedStudyPlan {
  days: StudyPlanDay[]
}

function extractJSON(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < 0 || end <= start) throw new Error('AI did not return JSON')
  return text.slice(start, end + 1)
}

export async function generateStudyPlan(
  courses: string[],
  exams: StudyPlanExamInput[],
  hoursPerDay: number,
  difficulty: Record<string, number>
): Promise<GeneratedStudyPlan> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Missing GROQ_API_KEY')

  const prompt = [
    `Create a study schedule for these courses: ${courses.join(', ') || 'none'}.`,
    `Exams on: ${exams.map((e) => `${e.course} (${e.date}, ${e.priority})`).join('; ') || 'none'}.`,
    `Available study time: ${hoursPerDay} hours per day.`,
    `Prioritize based on exam dates and difficulty: ${JSON.stringify(difficulty)}.`,
    'Return strict JSON in this exact shape:',
    '{"days":[{"date":"YYYY-MM-DD","tasks":[{"course":"Course","topic":"Topic","duration":2,"priority":"high"}]}]}',
    'No markdown, no explanation, only JSON.',
  ].join('\n')

  const client = new Groq({ apiKey })
  const response = await client.chat.completions.create({
    model: process.env.GROQ_MODEL ?? 'llama-3.1-70b-versatile',
    temperature: 0.2,
    max_tokens: 1400,
    messages: [
      {
        role: 'system',
        content:
          'You are a study-planning assistant. Always return valid JSON that matches the required schema.',
      },
      { role: 'user', content: prompt },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? ''
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJSON(raw))
  } catch {
    throw new Error('Failed to parse generated study plan JSON')
  }

  const days = (parsed as { days?: unknown[] })?.days
  if (!Array.isArray(days)) throw new Error('Invalid study plan shape: missing days')

  const normalized: GeneratedStudyPlan = {
    days: days
      .map((d) => {
        const day = d as { date?: string; tasks?: unknown[] }
        return {
          date: String(day.date ?? ''),
          tasks: Array.isArray(day.tasks)
            ? day.tasks.map((t) => {
                const task = t as {
                  course?: string
                  topic?: string
                  duration?: number
                  priority?: 'low' | 'medium' | 'high'
                }
                return {
                  course: String(task.course ?? ''),
                  topic: String(task.topic ?? ''),
                  duration: Number(task.duration ?? 1),
                  priority: (task.priority ?? 'medium') as 'low' | 'medium' | 'high',
                }
              })
            : [],
        }
      })
      .filter((d) => d.date),
  }

  return normalized
}

