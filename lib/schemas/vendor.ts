import { z } from "zod";
import { timestampSchema, firestoreIdSchema } from "./common";

export const vendorStaffSchema = z.object({
  staffType: z.string().min(1, "Staff type is required"),
  hours: z.string().optional(),
  rate: z.string().min(1, "Rate is required")
});

export const vendorSchema = z.object({
  id: firestoreIdSchema.optional(),
  name: z.string().min(1, "Vendor name is required").max(100),
  companyName: z.string().min(1, "Company name is required").max(100),
  phoneNumber: z.string().optional(),
  photoUrl: z.string().optional(),
  staff: z.array(vendorStaffSchema).default([]),
  isActive: z.boolean().default(true),
  companyId: firestoreIdSchema,
  ...timestampSchema.shape,
});

export type Vendor = z.infer<typeof vendorSchema>;

export const createVendorSchema = vendorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const updateVendorSchema = vendorSchema.partial().required({
  companyId: true,
});

export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
