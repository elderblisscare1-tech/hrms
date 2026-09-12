import { z } from "zod";

export const trainingStatusEnum = z.enum(["active", "upcoming", "completed", "cancelled"]);
export const enrollmentStatusEnum = z.enum(["enrolled", "in_progress", "completed", "dropped"]);

export const trainingSchema = z.object({
  title: z.string(),
  description: z.string(),
  instructor: z.string(),
  durationHours: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  status: trainingStatusEnum,
  capacity: z.number().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  companyId: z.string().optional(),
});

export const enrollmentSchema = z.object({
  employeeId: z.string(),
  trainingId: z.string(),
  status: enrollmentStatusEnum,
  progressScore: z.number().optional(), // 0 to 100
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  companyId: z.string().optional(),
});

export type Training = z.infer<typeof trainingSchema>;
export type Enrollment = z.infer<typeof enrollmentSchema>;
