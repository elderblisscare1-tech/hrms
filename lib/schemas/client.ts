import { z } from "zod";

export const clientStatusEnum = z.enum(["active", "inactive"]);

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required").optional().or(z.literal("")),
  address: z.string().optional(),
  status: clientStatusEnum.default("active"),
  notes: z.string().optional(),
  companyId: z.string().optional(), // For multi-tenant context
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type Client = z.infer<typeof clientSchema>;

export const createClientSchema = clientSchema.extend({});
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const clientStaffAssignmentSchema = z.object({
  clientId: z.string(),
  employeeId: z.string(),
  employeeName: z.string().optional(), // To display without fetching employee details always
  status: z.enum(["active", "completed"]).default("active"),
  assignedAt: z.any(), // Timestamp when assigned
  unassignedAt: z.any().optional(), // Timestamp when unassigned or replaced
  companyId: z.string().optional(),
});

export type ClientStaffAssignment = z.infer<typeof clientStaffAssignmentSchema>;
