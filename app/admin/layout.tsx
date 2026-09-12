"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/shared/admin-sidebar";
import { Topbar } from "@/components/shared/topbar";
import { useAuth } from "@/lib/auth/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, claims, roleDoc, loading } = useAuth();
  const router = useRouter();
  
  const canAccess = claims?.role === "super_admin" || claims?.role === "hr_admin" || (roleDoc?.permissions?.canAccessAdminPortal ?? false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!canAccess) {
        router.push("/employee/me");
      }
    }
  }, [user, canAccess, loading, router]);

  if (loading || !user || !canAccess) {
    return <div className="min-h-screen flex items-center justify-center text-[hsl(var(--muted-foreground))]">Loading dashboard...</div>;
  }
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <AdminSidebar />
      <div className="pl-[280px] transition-all duration-300">
        <Topbar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
