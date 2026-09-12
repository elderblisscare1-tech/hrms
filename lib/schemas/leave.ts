import { z } from "zod";

export const leaveTypeEnum = z.enum(["sick", "casual", "annual", "maternity", "paternity", "unpaid"]);
export const leaveStatusEnum = z.enum(["pending", "approved", "rejected", "cancelled"]);

export const leaveRequestSchema = z.object({
  employeeId: z.string(),
  type: leaveTypeEnum,
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(), // YYYY-MM-DD
  days: z.number(),
  reason: z.string(),
  status: leaveStatusEnum,
  managerId: z.string().optional(),
  managerComments: z.string().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  companyId: z.string().optional(),
});

export type LeaveRequest = z.infer<typeof leaveRequestSchema>;
