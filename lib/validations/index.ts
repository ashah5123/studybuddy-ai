import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export const studySetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  subject: z.string().max(50).optional(),
})

export const flashcardSchema = z.object({
  front: z.string().min(1, 'Front is required').max(500),
  back: z.string().min(1, 'Back is required').max(500),
})

export const generateFlashcardsSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters').max(200),
  count: z.number().int().min(3).max(30).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type StudySetInput = z.infer<typeof studySetSchema>
export type FlashcardInput = z.infer<typeof flashcardSchema>
export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>
