import { z } from "zod";
export const registerSchema = z.object({
    email: z.email(),
    username: z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/),
    password: z.string().min(8).max(128),
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
});
export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8).max(128),
});
