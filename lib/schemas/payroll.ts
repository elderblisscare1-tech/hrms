import { z } from "zod";

export const payrollRunStatusEnum = z.enum(["draft", "processing", "completed", "failed"]);

export const payrollRunSchema = z.object({
  month: z.number(),
  year: z.number(),
  status: payrollRunStatusEnum,
  processedBy: z.string(), // employeeId or adminId
  totalGrossPay: z.number().optional(),
  totalDeductions: z.number().optional(),
  totalNetPay: z.number().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  companyId: z.string().optional(),
});

export const payslipSchema = z.object({
  employeeId: z.string(),
  runId: z.string(),
  month: z.number(),
  year: z.number(),
  basicPay: z.number(),
  allowances: z.record(z.string(), z.number()).optional(),
  deductions: z.record(z.string(), z.number()).optional(),
  grossPay: z.number(),
  netPay: z.number(),
  status: z.enum(["pending", "paid"]),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  companyId: z.string().optional(),
});

export type PayrollRun = z.infer<typeof payrollRunSchema>;
export type Payslip = z.infer<typeof payslipSchema>;
