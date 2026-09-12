import { z } from "zod";
import { timestampSchema, firestoreIdSchema } from "./common";

export const rolePermissionsSchema = z.object({
  canAccessEmployeePortal: z.boolean().default(true),
  canAccessAdminPortal: z.boolean().default(false),
  adminSections: z.array(z.string()).default([]), // e.g. ["dashboard", "employees", "attendance"]
});

export type RolePermissions = z.infer<typeof rolePermissionsSchema>;

export const roleSchema = z.object({
  id: firestoreIdSchema.optional(),
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  permissions: rolePermissionsSchema,
  companyId: firestoreIdSchema,
  ...timestampSchema.shape,
});

export type Role = z.infer<typeof roleSchema>;

export const createRoleSchema = roleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = roleSchema.partial().required({
  companyId: true,
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
