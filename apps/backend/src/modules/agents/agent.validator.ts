import { z } from "zod";

export const createAgentSchema = z.object({
  projectId: z.string().min(1),

  name: z
    .string()
    .min(2)
    .max(100),

  description: z
    .string()
    .max(1000)
    .optional(),

  systemPrompt: z
    .string()
    .min(1),

  provider: z
    .string()
    .min(1),

  model: z
    .string()
    .min(1),

  temperature: z
    .number()
    .min(0)
    .max(2),

  maxTokens: z
    .number()
    .int()
    .positive(),
});

export const updateAgentSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .optional(),

  description: z
    .string()
    .max(1000)
    .optional(),

  systemPrompt: z
    .string()
    .optional(),

  provider: z
    .string()
    .optional(),

  model: z
    .string()
    .optional(),

  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional(),

  maxTokens: z
    .number()
    .int()
    .positive()
    .optional(),
});

export type CreateAgentInput =
  z.infer<typeof createAgentSchema>;

export type UpdateAgentInput =
  z.infer<typeof updateAgentSchema>;
