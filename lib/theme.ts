/**
 * EBC HRMS — Theme Configuration
 * Brand tokens and design system values. Never hardcode hex in components.
 */

export const theme = {
  colors: {
    brand: {
      navy: "hsl(var(--brand-navy))",
      royalBlue: "hsl(var(--brand-royal-blue))",
      lightBlue: "hsl(var(--brand-light-blue))",
    },
    background: {
      primary: "hsl(var(--background))",
      secondary: "hsl(var(--background-secondary))",
      card: "hsl(var(--card))",
      sidebar: "hsl(var(--sidebar-background))",
    },
    text: {
      primary: "hsl(var(--foreground))",
      secondary: "hsl(var(--muted-foreground))",
      accent: "hsl(var(--accent-foreground))",
    },
    status: {
      success: "hsl(var(--success))",
      warning: "hsl(var(--warning))",
      error: "hsl(var(--destructive))",
      info: "hsl(var(--info))",
    },
  },
  spacing: {
    sidebar: {
      expanded: "280px",
      collapsed: "72px",
    },
    topbar: "64px",
    bottomTab: "64px",
  },
  animation: {
    fast: "150ms",
    normal: "250ms",
    slow: "400ms",
  },
} as const;

export const ROLES = {
  HR_ADMIN: "hr_admin",
  MANAGER: "manager",
  EMPLOYEE: "employee",
  SUPER_ADMIN: "super_admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  hr_admin: "HR Admin",
  manager: "Manager",
  employee: "Employee",
  super_admin: "Super Admin",
};

export const EMPLOYMENT_STATUS = {
  ACTIVE: "active",
  ON_NOTICE: "on_notice",
  RESIGNED: "resigned",
  TERMINATED: "terminated",
  ON_LEAVE: "on_leave",
} as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUS)[keyof typeof EMPLOYMENT_STATUS];

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Active",
  on_notice: "On Notice",
  resigned: "Resigned",
  terminated: "Terminated",
  on_leave: "On Leave",
};
