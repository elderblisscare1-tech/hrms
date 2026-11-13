"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomTabBar } from "@/components/shared/bottom-tab-bar";
import { useAuth } from "@/lib/auth/auth-context";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, access } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!access.canAccessEmployeePortal) {
        if (access.canAccessAdminPortal) {
          router.push(access.firstAdminRoute);
        } else {
          router.push("/login");
        }
      }
    }
  }, [user, access, loading, router]);

  if (loading || !user || !access.canAccessEmployeePortal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
          <p className="text-sm">Verifying portal access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] pb-20">
      <main className="max-w-lg mx-auto px-4 pt-4">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
