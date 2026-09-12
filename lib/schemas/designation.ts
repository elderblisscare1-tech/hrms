import { z } from "zod";
import { timestampSchema, firestoreIdSchema } from "./common";

export const designationSchema = z.object({
  id: firestoreIdSchema.optional(),
  title: z.string().min(1, "Designation title is required").max(100),
  level: z.number().int().positive().optional(),
  departmentId: firestoreIdSchema.optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  companyId: firestoreIdSchema,
  ...timestampSchema.shape,
});

export type Designation = z.infer<typeof designationSchema>;

export const createDesignationSchema = designationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
