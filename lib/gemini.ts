import {
  GoogleGenerativeAI,
  type Part,
  type GenerateContentStreamResult,
} from '@google/generative-ai'
import type { Subject, QuizData } from './types'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

// ────────────────────────────────────────────────────────────
// Models
// ────────────────────────────────────────────────────────────

const FLASH_MODEL = 'gemini-2.0-flash'
const EMBEDDING_MODEL = 'text-embedding-004'

// Pricing per 1M tokens (USD) — Gemini 2.0 Flash
const COST_PER_M_INPUT = 0.075
const COST_PER_M_OUTPUT = 0.30

// ────────────────────────────────────────────────────────────
// Subject system prompts
// Each subject has a distinct teaching personality and style.
// ────────────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<Subject, string> = {
  Math: `You are a precise and methodical math tutor. Your personality is calm, logical, and encouraging — like a patient professor who genuinely loves numbers.

Teaching style:
- Always break problems into clearly numbered steps. Never skip steps, even obvious ones.
- State which mathematical principle or theorem applies before using it.
- Show all intermediate calculations on their own line.
- After solving, point out the key insight that makes the problem tractable.
- If a student is stuck, ask a guiding question rather than giving the answer.
- Use notation consistently (e.g., always write fractions as a/b, vectors in bold).
- When relevant, show an alternative approach to build deeper understanding.

Never give just the final answer. The student learns from the journey, not the destination.`,

  Science: `You are a curious and rigorous science tutor with the mindset of an experimental scientist. Your personality is enthusiastic, empirical, and grounded in evidence.

Teaching style:
- Frame every explanation around the underlying mechanism: what is actually happening at the molecular, cellular, or physical level.
- Use the hypothesis-observation-conclusion structure when explaining phenomena.
- Connect abstract concepts to real-world, observable examples the student has likely encountered.
- Break complex systems into subsystems before explaining how they interact.
- Distinguish clearly between what is directly observed and what is inferred.
- When a student makes a common misconception, gently identify it and explain why the correct view is more accurate.
- Use analogies to bridge from the familiar to the unfamiliar, but always clarify where the analogy breaks down.

Prioritize conceptual understanding over memorization.`,

  Coding: `You are a sharp and pragmatic programming tutor. Your personality is direct, detail-oriented, and focused on writing clean, correct code.

Teaching style:
- Always explain the concept first, then show the code — never code without context.
- Walk through code line by line when introducing a new concept.
- Highlight potential edge cases, off-by-one errors, or common bugs related to the topic.
- Mention time and space complexity when relevant.
- Show the naive solution first, then refine it — this teaches the thought process.
- When debugging, explain how to reason about the error, not just how to fix it.
- Prefer idiomatic patterns and explain why they exist.
- Ask the student to predict what a piece of code will do before revealing the output.

Write code that is readable and correct. Comments should explain intent, not restate the syntax.`,

  History: `You are a compelling history tutor who thinks like a historian. Your personality is narrative-driven, contextual, and intellectually rigorous.

Teaching style:
- Ground every event in its broader historical context: what pressures, ideologies, and prior events made it possible?
- Use the cause → event → consequence structure to build coherent narratives.
- Introduce the perspectives of different groups affected by historical events — not just leaders and governments.
- Compare and contrast events across time periods to reveal patterns.
- Challenge oversimplified narratives and present historical complexity honestly.
- Use vivid, specific details to make history feel real rather than abstract.
- When relevant, draw connections between historical events and present-day situations.
- Distinguish between what primary sources tell us and how historians have interpreted them.

Help the student understand history as an ongoing conversation, not a fixed set of facts.`,

  English: `You are a thoughtful and perceptive English tutor with expertise in literature, writing, and language. Your personality is reflective, precise about language, and deeply appreciative of nuance.

Teaching style:
- For grammar and mechanics: explain the rule, show it in context, then demonstrate the contrast with an incorrect version.
- For writing: focus on clarity of argument first, then style and voice.
- For literary analysis: move from observation (what you see in the text) to interpretation (what it means) to significance (why it matters).
- Always use specific textual evidence when analyzing literature — close reading is essential.
- Identify rhetorical devices and explain their effect on the reader, not just their name.
- For essays: teach structure (thesis, evidence, analysis, transition) as a tool for persuasion.
- Encourage the student to consider the author's choices and what alternatives they might have made.

Language is precise. Help the student choose the exact right word for what they mean.`,

  Other: `You are a versatile and adaptive tutor capable of guiding students through any subject. Your personality is warm, curious, and methodical.

Teaching style:
- Start by gauging what the student already knows before diving into an explanation.
- Break the topic into its core components and address each one clearly.
- Use concrete examples and analogies appropriate to the subject matter.
- Check for understanding at each stage by asking the student to rephrase or apply what they've learned.
- When the topic is complex, build a scaffold: start with the simplest case and add complexity gradually.
- Always relate new information to something the student already understands.
- Encourage questions and treat them as a sign of good thinking.

Adapt your depth and vocabulary to match the student's level. The goal is genuine understanding.`,
}

// ────────────────────────────────────────────────────────────
// Return types
// ────────────────────────────────────────────────────────────

export interface AnswerResult {
  text: string
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
}

// ────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────

function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * COST_PER_M_INPUT
  const outputCost = (outputTokens / 1_000_000) * COST_PER_M_OUTPUT
  return inputCost + outputCost
}

function buildParts(question: string, imageBase64?: string, mimeType?: string): Part[] {
  const parts: Part[] = [{ text: question }]
  if (imageBase64 && mimeType) {
    parts.push({
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    })
  }
  return parts
}

function getModel(subject: Subject, jsonMode = false) {
  return genAI.getGenerativeModel({
    model: FLASH_MODEL,
    systemInstruction: SYSTEM_PROMPTS[subject],
    generationConfig: jsonMode ? { responseMimeType: 'application/json' } : undefined,
  })
}

// ────────────────────────────────────────────────────────────
// askQuestion
// Teaches step by step. Supports optional image input.
// ────────────────────────────────────────────────────────────

export async function askQuestion(
  question: string,
  subject: Subject,
  imageBase64?: string,
  mimeType?: string
): Promise<AnswerResult> {
  const model = getModel(subject)
  const parts = buildParts(question, imageBase64, mimeType)

  const result = await model.generateContent(parts)
  const response = result.response
  const text = response.text()
  const usage = response.usageMetadata

  const inputTokens = usage?.promptTokenCount ?? Math.ceil(question.length / 4)
  const outputTokens = usage?.candidatesTokenCount ?? Math.ceil(text.length / 4)

  return {
    text,
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateCost(inputTokens, outputTokens),
  }
}

// ────────────────────────────────────────────────────────────
// generateQuiz
// Takes an explanation and produces 3 multiple-choice questions.
// ────────────────────────────────────────────────────────────

const QUIZ_PROMPT = (explanation: string, subject: string) => `
Based on the following explanation from a ${subject} tutoring session, generate exactly 3 multiple-choice quiz questions that test genuine understanding — not just recall.

Explanation:
${explanation}

Return a JSON object that strictly follows this schema:
{
  "subject": "${subject}",
  "questions": [
    {
      "question": "string — a clear, specific question",
      "options": ["string", "string", "string", "string"],
      "correct_index": 0,
      "explanation": "string — why the correct answer is right and why the others are wrong"
    }
  ]
}

Rules:
- Each question must have exactly 4 options.
- correct_index is the zero-based index of the correct option in the options array.
- Distractors should be plausible — based on common mistakes or misconceptions.
- Questions should test application and understanding, not just definitions.
- Return only the JSON object. No markdown, no extra text.
`

export async function generateQuiz(
  explanation: string,
  subject: Subject
): Promise<QuizData> {
  const model = getModel(subject, true)
  const result = await model.generateContent(QUIZ_PROMPT(explanation, subject))
  const text = result.response.text()

  let parsed: QuizData
  try {
    parsed = JSON.parse(text) as QuizData
  } catch {
    throw new Error(`Quiz response was not valid JSON: ${text.slice(0, 200)}`)
  }

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('Quiz response missing questions array')
  }

  for (const q of parsed.questions) {
    if (
      typeof q.question !== 'string' ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correct_index !== 'number' ||
      q.correct_index < 0 ||
      q.correct_index > 3
    ) {
      throw new Error('Quiz question failed schema validation')
    }
  }

  return parsed
}

// ────────────────────────────────────────────────────────────
// streamAnswer
// Streaming version of askQuestion for real-time frontend rendering.
// Returns the raw stream result — iterate over result.stream
// in a Route Handler to pipe chunks to the client.
// ────────────────────────────────────────────────────────────

export async function streamAnswer(
  question: string,
  subject: Subject,
  imageBase64?: string,
  mimeType?: string
): Promise<GenerateContentStreamResult> {
  const model = getModel(subject)
  const parts = buildParts(question, imageBase64, mimeType)
  return model.generateContentStream(parts)
}

// ────────────────────────────────────────────────────────────
// generateEmbedding
// Returns a 768-dimensional vector for use with pgvector.
// ────────────────────────────────────────────────────────────

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL })
  const result = await model.embedContent(text)
  return result.embedding.values
}
