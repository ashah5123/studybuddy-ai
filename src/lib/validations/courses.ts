import { z } from 'zod'

export const courseSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }).max(80),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Must be a valid hex color (e.g. #3B82F6)' })
    .default('#3B82F6'),
  emoji: z.string().min(1, { message: 'Please choose an emoji' }).default('📚'),
})

export const assignmentSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(200),
  description: z.string().max(2000).optional(),
  course_id: z.string().uuid().nullable().optional(),
  type: z.enum(['homework', 'exam', 'project', 'quiz']).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().nullable().optional(),
})

export type CourseInput = z.input<typeof courseSchema>
export type AssignmentInput = z.input<typeof assignmentSchema>
