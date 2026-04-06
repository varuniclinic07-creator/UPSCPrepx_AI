import { z } from 'zod';

export const generateNotesSchema = z.object({
  topic: z.string().min(3).max(500),
  subject: z.string().min(1),
  level: z.enum(['basic', 'intermediate', 'advanced']).optional(),
});

export const generateQuizSchema = z.object({
  topic: z.string().min(3).max(500),
  subject: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionCount: z.number().int().min(5).max(50).optional(),
});

export const submitQuizSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.number().int(),
    selectedOption: z.number().int(),
  })),
  timeSpent: z.number().int().positive(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  preferences: z.object({
    language: z.enum(['english', 'hindi']).optional(),
    theme: z.enum(['light', 'dark']).optional(),
    notifications: z.boolean().optional(),
  }).optional(),
});

export const createPaymentSchema = z.object({
  planId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('INR'),
});

export type GenerateNotesInput = z.infer<typeof generateNotesSchema>;
export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
