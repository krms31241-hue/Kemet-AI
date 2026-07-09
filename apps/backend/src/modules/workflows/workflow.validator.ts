import { z } from "zod";

export const createWorkflowSchema = z.object({
  projectId: z.string().min(1),

  name: z.string().min(3).max(100),

  description: z.string().max(1000).optional(),

  nodes: z.array(z.unknown()),

  edges: z.array(z.unknown()),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(3).max(100).optional(),

  description: z.string().max(1000).optional(),

  nodes: z.array(z.unknown()).optional(),

  edges: z.array(z.unknown()).optional(),
});

export type CreateWorkflowInput =
  z.infer<typeof createWorkflowSchema>;

export type UpdateWorkflowInput =
  z.infer<typeof updateWorkflowSchema>;
