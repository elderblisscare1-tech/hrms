import { z } from "zod";

export const ticketStatusEnum = z.enum(["open", "in_progress", "resolved", "closed"]);
export const ticketPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);

export const helpdeskTicketSchema = z.object({
  employeeId: z.string(),
  subject: z.string(),
  description: z.string(),
  status: ticketStatusEnum,
  priority: ticketPriorityEnum,
  category: z.string(), // e.g. "IT", "HR", "Facilities"
  assignedTo: z.string().optional(), // admin/IT user id
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  companyId: z.string().optional(),
});

export type HelpdeskTicket = z.infer<typeof helpdeskTicketSchema>;
