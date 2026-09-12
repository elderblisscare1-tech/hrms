import { z } from "zod";

export const assetStatusEnum = z.enum(["available", "assigned", "maintenance", "retired"]);

export const assetSchema = z.object({
  name: z.string(),
  type: z.string(), // e.g. "Laptop", "Monitor"
  serialNumber: z.string().optional(),
  assignedTo: z.string().optional(), // employeeId
  status: assetStatusEnum,
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  companyId: z.string().optional(),
});

export type Asset = z.infer<typeof assetSchema>;
