"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { resolveLoginRedirect } from "@/lib/auth/rbac";

export default function DashboardRedirect() {
  const { user, claims, roleDoc, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/admin-login");
      return;
    }

    const destination = resolveLoginRedirect(claims, roleDoc);
    router.replace(destination);
  }, [user, claims, roleDoc, loading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[hsl(var(--background))]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent" />
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Routing to your dashboard...</p>
      </div>
    </div>
  );
}
