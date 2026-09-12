import { z } from "zod";

export const leadStatusEnum = z.enum(["new", "contacted", "qualified", "lost", "converted"]);

export const leadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: leadStatusEnum,
  source: z.string().min(1, "Source is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  notes: z.string().optional(),
  date: z.string(), // ISO string or simple YYYY-MM-DD
  companyId: z.string().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type Lead = z.infer<typeof leadSchema>;

export const createLeadSchema = leadSchema.extend({});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
