import { z } from "zod";
export const createProjectSchema = z.object({
    name: z
        .string()
        .min(3)
        .max(100),
    description: z
        .string()
        .max(1000)
        .optional(),
});
export const updateProjectSchema = z.object({
    name: z
        .string()
        .min(3)
        .max(100)
        .optional(),
    description: z
        .string()
        .max(1000)
        .optional(),
});
