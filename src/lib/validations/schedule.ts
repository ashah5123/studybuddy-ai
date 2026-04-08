import { z } from 'zod'

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Pick a valid hex color')

export const scheduleEventSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional().nullable(),
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
    color: hexColor.default('#6366f1'),
    course_id: z.preprocess(
      (v) => (v === '' || v === undefined ? null : v),
      z.string().uuid().nullable().optional()
    ),
  })
  .refine((d) => new Date(d.ends_at).getTime() > new Date(d.starts_at).getTime(), {
    message: 'End time must be after start time',
    path: ['ends_at'],
  })

export type ScheduleEventInput = z.infer<typeof scheduleEventSchema>
