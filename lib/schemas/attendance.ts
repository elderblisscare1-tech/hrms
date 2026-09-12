import { z } from "zod";

export const attendanceStatusEnum = z.enum(["present", "absent", "late", "on_leave"]);

export const attendanceRecordSchema = z.object({
  employeeId: z.string(),
  date: z.string(), // YYYY-MM-DD
  checkIn: z.string().optional(), // ISO string or time string
  checkOut: z.string().optional(), // ISO string or time string
  status: attendanceStatusEnum,
  hoursWorked: z.number().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  companyId: z.string().optional(),
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
