import { z } from "zod";
import { timestampSchema, firestoreIdSchema } from "./common";

export const companySchema = z.object({
  id: firestoreIdSchema.optional(),
  name: z.string().min(2, "Company name is required").max(100),
  logoUrl: z.string().url().optional().or(z.literal("")),
  address: z.object({
    line1: z.string().min(1, "Address is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(6, "Valid pincode required").max(6),
    country: z.string().default("India"),
  }),
  industry: z.string().min(1, "Industry is required"),
  brandColors: z.object({
    primary: z.string().default("#1B4F91"),
    secondary: z.string().default("#10243E"),
  }).optional(),
  subscriptionPlan: z.enum(["free", "starter", "professional", "enterprise"]).default("free"),
  employeeCount: z.number().int().nonnegative().default(0),
  ...timestampSchema.shape,
});

export type Company = z.infer<typeof companySchema>;

export const createCompanySchema = companySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  employeeCount: true,
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Consulting",
  "Real Estate",
  "Hospitality",
  "Media & Entertainment",
  "Other",
] as const;
