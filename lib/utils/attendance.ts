/**
 * Attendance Utilities & Business Rules
 *
 * Strict Rule: An employee's attendance CANNOT be marked or recorded
 * for any date prior to their date of joining (or account creation).
 */

import type { Employee } from "@/lib/schemas/employee";
import type { AttendanceRecord } from "@/lib/schemas/attendance";

/**
 * Returns a local YYYY-MM-DD date string without UTC timezone offset distortions.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Extracts and normalizes the employee's joining date into "YYYY-MM-DD".
 * Falls back to createdAt if dateOfJoining is missing.
 */
export function getEmployeeJoiningDate(
  emp: { dateOfJoining?: string; createdAt?: any } | null | undefined
): string | null {
  if (!emp) return null;

  if (emp.dateOfJoining && typeof emp.dateOfJoining === "string") {
    const trimmed = emp.dateOfJoining.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return getLocalDateString(d);
    }
  }

  // Fallback to createdAt
  if (emp.createdAt) {
    let d: Date | null = null;
    if (typeof emp.createdAt.toDate === "function") {
      d = emp.createdAt.toDate();
    } else if (emp.createdAt instanceof Date) {
      d = emp.createdAt;
    } else if (typeof emp.createdAt === "string" || typeof emp.createdAt === "number") {
      d = new Date(emp.createdAt);
    }
    if (d && !isNaN(d.getTime())) {
      return getLocalDateString(d);
    }
  }

  return null;
}

/**
 * Checks if targetDate (YYYY-MM-DD) is strictly prior to employee's joining date.
 */
export function isDateBeforeJoining(
  targetDate: string,
  emp: { dateOfJoining?: string; createdAt?: any } | null | undefined
): boolean {
  const joiningDate = getEmployeeJoiningDate(emp);
  if (!joiningDate) return false; // If joining date is unknown, we cannot reject on this basis
  return targetDate < joiningDate;
}

/**
 * Validates whether an employee is eligible to have attendance recorded for targetDate.
 * - Must have joined on or before targetDate (targetDate >= joiningDate)
 * - Must be active, on notice, or on leave (not terminated before target date)
 */
export function isEligibleForAttendance(
  emp: { dateOfJoining?: string; createdAt?: any; employmentStatus?: string } | null | undefined,
  targetDate: string
): boolean {
  if (!emp) return false;
  
  const joiningDate = getEmployeeJoiningDate(emp);
  if (joiningDate && targetDate < joiningDate) {
    return false;
  }

  // Exclude terminated/resigned employees if applicable
  if (emp.employmentStatus === "terminated" || emp.employmentStatus === "resigned") {
    return false;
  }

  return true;
}

/**
 * Validates attendance marking and returns an explicit error reason if invalid.
 */
export function validateAttendanceEligibility(
  emp: { dateOfJoining?: string; createdAt?: any; firstName?: string; lastName?: string } | null | undefined,
  targetDate: string
): { eligible: boolean; reason?: string; joiningDate?: string | null } {
  const joiningDate = getEmployeeJoiningDate(emp);
  const empName = emp ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Employee" : "Employee";

  if (joiningDate && targetDate < joiningDate) {
    return {
      eligible: false,
      reason: `${empName} joined on ${joiningDate}. Attendance cannot be marked for prior dates (${targetDate}).`,
      joiningDate,
    };
  }

  return { eligible: true, joiningDate };
}

/**
 * Categorizes a list of employees for a given target date into:
 * 1. eligible: Joined on or before targetDate
 * 2. notJoinedYet: Joining date is strictly AFTER targetDate
 */
export function categorizeEmployeesByJoiningDate<T extends { dateOfJoining?: string; createdAt?: any; employmentStatus?: string }>(
  employees: T[],
  targetDate: string
): { eligible: T[]; notJoinedYet: T[] } {
  const eligible: T[] = [];
  const notJoinedYet: T[] = [];

  for (const emp of employees) {
    const joiningDate = getEmployeeJoiningDate(emp);
    if (joiningDate && targetDate < joiningDate) {
      notJoinedYet.push(emp);
    } else {
      eligible.push(emp);
    }
  }

  return { eligible, notJoinedYet };
}

