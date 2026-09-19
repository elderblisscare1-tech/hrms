"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { signIn, signInWithGoogle, getUserClaims } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError("");
    try {
      const result = await signIn(data.email, data.password);
      const claims = await getUserClaims(result.user);
      const role = claims.role as string;
      const companyId = claims.companyId as string;
      
      let canAccessAdmin = role === "hr_admin" || role === "admin";
      if (!canAccessAdmin && role && companyId) {
        try {
          const { getDocument } = await import("@/lib/firebase/firestore");
          const roleDoc = await getDocument<any>(companyId, "roles", role);
          if (roleDoc?.permissions?.canAccessAdminPortal) {
            canAccessAdmin = true;
          }
        } catch (e) {
          console.error("Failed to fetch role permissions during login", e);
        }
      }

      if (role === "super_admin") {
        await import("@/lib/firebase/auth").then(m => m.signOut());
        setError("Please use the Super Admin login portal.");
        return;
      }

      if (canAccessAdmin) {
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get("callbackUrl");
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        // Not an admin
        await import("@/lib/firebase/auth").then(m => m.signOut());
        setError("Access denied. Admin privileges required.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      if (message.includes("user-not-found") || message.includes("wrong-password")) {
        setError("Invalid email or password");
      } else if (message.includes("too-many-requests")) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError(error || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const result = await signInWithGoogle();
      const claims = await getUserClaims(result.user);
      const role = claims.role as string;
      const companyId = claims.companyId as string;
      
      let canAccessAdmin = role === "hr_admin" || role === "admin";
      if (!canAccessAdmin && role && companyId) {
        try {
          const { getDocument } = await import("@/lib/firebase/firestore");
          const roleDoc = await getDocument<any>(companyId, "roles", role);
          if (roleDoc?.permissions?.canAccessAdminPortal) {
            canAccessAdmin = true;
          }
        } catch (e) {
          console.error("Failed to fetch role permissions during login", e);
        }
      }

      if (role === "super_admin") {
        await import("@/lib/firebase/auth").then(m => m.signOut());
        setError("Please use the Super Admin login portal.");
        return;
      }

      if (canAccessAdmin) {
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get("callbackUrl");
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        await import("@/lib/firebase/auth").then(m => m.signOut());
        setError("Access denied. Admin privileges required.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      if (!message.includes("popup-closed")) {
        setError(error || "Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
          <span className="text-white font-bold text-sm">EBC</span>
        </div>
        <div>
          <h1 className="font-bold text-lg">EBC</h1>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest">HRMS</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-1">Admin Portal</h2>
      <p className="text-[hsl(var(--muted-foreground))] mb-8">Sign in to manage your company</p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.2)] text-[hsl(var(--destructive))] text-sm animate-slide-down">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium mb-1.5 block">Email</label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Link href="/forgot-password" className="text-xs text-[hsl(var(--primary))] hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        <Button type="submit" className="w-full h-11" loading={loading}>
          Sign in
        </Button>
      </form>

    </div>
  );
}
