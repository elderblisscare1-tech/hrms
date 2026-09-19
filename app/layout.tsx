import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";

export const metadata: Metadata = {
  title: "EBC HRMS — Human Resource Management System",
  description: "Production-grade, multi-tenant Human Resource Management System. Manage employees, attendance, leave, payroll, performance, and more.",
  keywords: ["HRMS", "HR Management", "Payroll", "Attendance", "Leave Management", "Employee Management"],
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#10243E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
