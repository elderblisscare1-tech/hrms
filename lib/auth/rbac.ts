/**
 * Industrial-Grade Role-Based Access Control (RBAC) Module
 */

import type { UserClaims } from "@/lib/firebase/auth";
import type { Role } from "@/lib/schemas/role";
import { getDocument, listDocuments } from "@/lib/firebase/firestore";

/**
 * Normalizes any section identifier (e.g. "Daily Attendance", "Daily_attendance", "daily-attendance")
 * into a canonical lowercase string without spaces, hyphens, or underscores.
 */
export function normalizeSectionKey(key?: string | null): string {
  if (!key) return "";
  return key.toLowerCase().replace(/[\s_-]+/g, "");
}

/**
 * Mapping between canonical section keys and their admin dashboard routes.
 */
export const SECTION_ROUTES: Record<string, string> = {
  dashboard: "/admin/dashboard",
  employees: "/admin/employees",
  clients: "/admin/clients",
  departments: "/admin/departments",
  designations: "/admin/designations",
  vendors: "/admin/vendors",
  leads: "/admin/leads",
  attendance: "/admin/attendance",
  dailyattendance: "/admin/attendance/daily",
  leave: "/admin/leave",
  payroll: "/admin/payroll",
  reports: "/admin/reports",
  performance: "/admin/performance",
  training: "/admin/training",
  assets: "/admin/assets",
  helpdesk: "/admin/helpdesk",
  compliance: "/admin/compliance",
  roles: "/admin/roles",
  ebcdutys: "/admin/ebc-dutys",
  settings: "/admin/settings",
};

/**
 * All known admin sections for super admin fallback.
 */
export const ALL_ADMIN_SECTIONS = [
  "dashboard",
  "employees",
  "clients",
  "departments",
  "designations",
  "vendors",
  "leads",
  "attendance",
  "daily_attendance",
  "leave",
  "payroll",
  "reports",
  "performance",
  "training",
  "assets",
  "helpdesk",
  "compliance",
  "roles",
  "ebc_dutys",
  "settings",
];

/**
 * Resolves a role definition from Firestore by ID or by Role Name.
 * If not found, falls back to standard enterprise system roles.
 */
export async function fetchRoleDefinition(
  companyId: string,
  roleIdOrName?: string | null
): Promise<Role | null> {
  if (!companyId || !roleIdOrName) return null;

  const trimmed = roleIdOrName.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct fetch by Firestore document ID
  try {
    const docById = (await getDocument<Role>(companyId, "roles", trimmed)) as Role | null;
    if (docById && docById.permissions) {
      return docById;
    }
  } catch {
    // Continue to search by name
  }

  // 2. Fetch all roles in company and match by name or ID (case-insensitive)
  try {
    const allRoles = await listDocuments<Role>(companyId, "roles");
    const matched = allRoles.find(
      (r) =>
        r.id === trimmed ||
        r.name?.trim().toLowerCase() === lower ||
        normalizeSectionKey(r.name) === normalizeSectionKey(trimmed)
    );
    if (matched && matched.permissions) {
      return matched;
    }
  } catch (err) {
    console.error("Error searching roles in Firestore:", err);
  }

  // 3. Fallbacks for standard enterprise roles
  const now = new Date().toISOString();

  if (lower === "super_admin" || lower === "super admin") {
    return {
      name: "Super Admin",
      companyId,
      createdAt: now,
      updatedAt: now,
      permissions: {
        canAccessEmployeePortal: true,
        canAccessAdminPortal: true,
        adminSections: ALL_ADMIN_SECTIONS,
      },
    } as unknown as Role;
  }

  if (lower === "hr_admin" || lower === "admin" || lower === "hr admin") {
    return {
      name: "HR Admin",
      companyId,
      createdAt: now,
      updatedAt: now,
      permissions: {
        canAccessEmployeePortal: true,
        canAccessAdminPortal: true,
        adminSections: ALL_ADMIN_SECTIONS.filter((s) => s !== "settings"),
      },
    } as unknown as Role;
  }

  if (lower === "staff" || lower === "employee") {
    return {
      name: "Staff",
      companyId,
      createdAt: now,
      updatedAt: now,
      permissions: {
        canAccessEmployeePortal: true,
        canAccessAdminPortal: false,
        adminSections: [] as string[],
      },
    } as unknown as Role;
  }

  return null;
}

/**
 * Checks if a user has permission to access a specific admin section.
 */
export function hasSectionPermission(
  section: string,
  claims: UserClaims | null,
  roleDoc: Role | null
): boolean {
  if (!claims) return false;

  const role = (claims.role || "").toLowerCase();
  if (role === "super_admin" || role === "hr_admin" || role === "admin") {
    return true;
  }

  // If roleDoc does not grant admin portal access, reject
  if (!roleDoc?.permissions?.canAccessAdminPortal) {
    return false;
  }

  const target = normalizeSectionKey(section);
  const allowed = roleDoc.permissions.adminSections || [];

  return allowed.some((s) => normalizeSectionKey(s) === target);
}

/**
 * Computes complete access capabilities for the current user session.
 */
export function getUserAccessDetails(
  claims: UserClaims | null,
  roleDoc: Role | null
) {
  const role = (claims?.role || "").toLowerCase();
  const isSuperAdmin = role === "super_admin";
  const isHardcodedAdmin = role === "hr_admin" || role === "admin";

  const canAccessAdminPortal =
    isSuperAdmin ||
    isHardcodedAdmin ||
    Boolean(roleDoc?.permissions?.canAccessAdminPortal);

  const canAccessEmployeePortal =
    isSuperAdmin ||
    isHardcodedAdmin ||
    Boolean(roleDoc?.permissions?.canAccessEmployeePortal ?? true);

  // Compute first allowed admin landing page
  let firstAdminRoute = "/admin/dashboard";
  if (!isSuperAdmin && !isHardcodedAdmin && roleDoc?.permissions?.adminSections) {
    const canonicalAllowed = roleDoc.permissions.adminSections.map(normalizeSectionKey);
    if (!canonicalAllowed.includes("dashboard")) {
      for (const section of canonicalAllowed) {
        if (SECTION_ROUTES[section]) {
          firstAdminRoute = SECTION_ROUTES[section];
          break;
        }
      }
    }
  }

  return {
    isSuperAdmin,
    isAdmin: isHardcodedAdmin || isSuperAdmin,
    canAccessAdminPortal,
    canAccessEmployeePortal,
    firstAdminRoute,
  };
}

/**
 * Intelligently determines where a user should be redirected upon login.
 */
export function resolveLoginRedirect(
  claims: UserClaims | null,
  roleDoc: Role | null,
  currentGateway?: "login" | "admin-login" | "super-admin-gateway"
): string {
  const access = getUserAccessDetails(claims, roleDoc);

  if (access.isSuperAdmin) {
    return "/super-admin/dashboard";
  }

  if (currentGateway === "admin-login") {
    if (access.canAccessAdminPortal) {
      return access.firstAdminRoute;
    }
    // Graceful redirect to employee portal if they have no admin access
    if (access.canAccessEmployeePortal) {
      return "/employee/me";
    }
  }

  if (currentGateway === "login") {
    if (access.canAccessEmployeePortal) {
      return "/employee/me";
    }
    if (access.canAccessAdminPortal) {
      return access.firstAdminRoute;
    }
  }

  // General fallback
  if (access.canAccessAdminPortal) {
    return access.firstAdminRoute;
  }
  return "/employee/me";
}

