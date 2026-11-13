"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/shared/admin-sidebar";
import { Topbar } from "@/components/shared/topbar";
import { useAuth } from "@/lib/auth/auth-context";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function getSectionFromPathname(pathname: string): string | null {
  const clean = pathname.replace(/^\/admin\/?/, "");
  if (!clean || clean === "") return "dashboard";
  
  if (clean.startsWith("attendance/daily")) return "daily_attendance";
  if (clean.startsWith("attendance")) return "attendance";
  if (clean.startsWith("ebc-dutys")) return "ebc_dutys";
  
  const firstSegment = clean.split("/")[0];
  return firstSegment || null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, access, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/admin-login");
      } else if (!access.canAccessAdminPortal) {
        if (access.canAccessEmployeePortal) {
          router.push("/employee/me");
        } else {
          router.push("/login");
        }
      }
    }
  }, [user, access, loading, router]);

  if (loading || !user || !access.canAccessAdminPortal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
          <p className="text-sm">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Check section-level permissions
  const currentSection = getSectionFromPathname(pathname);
  const isSectionAllowed = !currentSection || access.isSuperAdmin || hasPermission(currentSection);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <AdminSidebar />
      <div className="pl-[280px] transition-all duration-300">
        <Topbar />
        <main className="p-6">
          {!isSectionAllowed ? (
            <div className="max-w-md mx-auto my-16 p-8 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
              <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Access Restricted</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                Your role does not have permission to view the <strong className="capitalize">{currentSection?.replace(/_/g, " ")}</strong> module.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={() => router.push(access.firstAdminRoute)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Go to Allowed Section
                </Button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
