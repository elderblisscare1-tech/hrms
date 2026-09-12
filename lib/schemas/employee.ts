import { z } from "zod";
import { timestampSchema, firestoreIdSchema } from "./common";

export const employeeSchema = z.object({
  id: firestoreIdSchema.optional(),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number required").max(15),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  employmentStatus: z.enum(["active", "on_notice", "resigned", "terminated", "on_leave"]),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern", "staff"]),
  departmentId: firestoreIdSchema.optional().or(z.literal("")),
  designationId: firestoreIdSchema.optional().or(z.literal("")),
  reportingManagerId: firestoreIdSchema.optional().or(z.literal("")),
  vendorId: firestoreIdSchema.optional().or(z.literal("")),
  role: z.string().min(1, "Role is required"),
  workLocation: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
  currentAddress: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  permanentAddress: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    branchName: z.string().optional(),
    upiId: z.string().optional(),
  }).optional(),
  paymentQrUrl: z.string().url().optional().or(z.literal("")),
  bankDetailsRef: z.string().optional(),
  documentsRef: z.array(z.string()).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  aadharNumber: z.string().optional(),
  aadharUrl: z.string().url().optional().or(z.literal("")),
  panNumber: z.string().optional(),
  panUrl: z.string().url().optional().or(z.literal("")),
  password: z.string().optional(),
  targetWorkingDays: z.number().optional(),
  companyId: firestoreIdSchema,
  authUid: z.string().optional(),
  ...timestampSchema.shape,
});

export type Employee = z.infer<typeof employeeSchema>;

export const createEmployeeSchema = employeeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  authUid: true,
  bankDetailsRef: true,
  documentsRef: true,
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = employeeSchema.partial().required({
  companyId: true,
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

/** Fields an employee can edit on their own profile */
export const selfEditSchema = z.object({
  phone: z.string().min(10).max(15).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
  currentAddress: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  permanentAddress: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
});

export type SelfEditInput = z.infer<typeof selfEditSchema>;
