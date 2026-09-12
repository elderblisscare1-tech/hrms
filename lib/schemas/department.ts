import { z } from "zod";
import { timestampSchema, firestoreIdSchema } from "./common";

export const departmentSchema = z.object({
  id: firestoreIdSchema.optional(),
  name: z.string().min(1, "Department name is required").max(100),
  description: z.string().max(500).optional(),
  headId: firestoreIdSchema.optional(),
  parentDepartmentId: firestoreIdSchema.optional(),
  employeeCount: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  companyId: firestoreIdSchema,
  ...timestampSchema.shape,
});

export type Department = z.infer<typeof departmentSchema>;

export const createDepartmentSchema = departmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  employeeCount: true,
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
