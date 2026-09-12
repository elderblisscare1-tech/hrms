import { z } from "zod";

export const reviewStatusEnum = z.enum(["draft", "submitted", "acknowledged"]);

export const performanceReviewSchema = z.object({
  employeeId: z.string(),
  reviewerId: z.string(),
  reviewCycle: z.string(), // e.g. "Q3 2026"
  rating: z.number().min(1).max(5).optional(), // 1 to 5 scale
  feedback: z.string(),
  goals: z.array(z.string()).optional(),
  status: reviewStatusEnum,
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  companyId: z.string().optional(),
});

export type PerformanceReview = z.infer<typeof performanceReviewSchema>;
