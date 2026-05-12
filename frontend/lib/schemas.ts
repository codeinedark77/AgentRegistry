import { z } from 'zod'

export const loginSchema = z.object({
  username: z
    .string()
    .min(3,  'Username must be at least 3 characters')
    .max(64, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = loginSchema.extend({
  role: z.enum(['admin', 'standard']).default('standard'),
})

export const createAgentSchema = z.object({
  model_name: z
    .string()
    .min(1, 'Model name is required')
    .max(128, 'Model name too long'),
  system_prompt: z
    .string()
    .min(10, 'System prompt must be at least 10 characters'),
  temperature: z
    .number()
    .min(0,   'Minimum temperature is 0.0')
    .max(2,   'Maximum temperature is 2.0'),
})

export const updateAgentSchema = createAgentSchema.partial()

export const createWorkspaceSchema = z.object({
  name:        z.string().min(1).max(128),
  description: z.string().max(500).optional(),
})

export type LoginFormData          = z.infer<typeof loginSchema>
export type RegisterFormData       = z.infer<typeof registerSchema>
export type CreateAgentFormData    = z.infer<typeof createAgentSchema>
export type UpdateAgentFormData    = z.infer<typeof updateAgentSchema>
export type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>