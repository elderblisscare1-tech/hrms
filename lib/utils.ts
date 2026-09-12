import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string, format: "short" | "long" | "iso" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  switch (format) {
    case "long":
      return d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
    case "iso":
      return d.toISOString().split("T")[0];
    default:
      return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  }
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
