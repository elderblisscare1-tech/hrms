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
      
      let isSuperAdmin = role === "super_admin";

      if (isSuperAdmin) {
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get("callbackUrl");
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push("/super-admin/dashboard");
        }
      } else {
        // Not a super admin
        await import("@/lib/firebase/auth").then(m => m.signOut());
        setError("Access denied. Super Admin privileges required.");
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
      
      let isSuperAdmin = role === "super_admin";

      if (isSuperAdmin) {
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get("callbackUrl");
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push("/super-admin/dashboard");
        }
      } else {
        await import("@/lib/firebase/auth").then(m => m.signOut());
        setError("Access denied. Super Admin privileges required.");
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
          <span className="text-white font-bold text-sm">BV</span>
        </div>
        <div>
          <h1 className="font-bold text-lg">EBC</h1>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest">HRMS</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-1 text-[hsl(var(--primary))]">Super Admin</h2>
      <p className="text-[hsl(var(--muted-foreground))] mb-8">Sign in for master control</p>

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

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[hsl(var(--border))]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[hsl(var(--background))] px-2 text-[hsl(var(--muted-foreground))]">or continue with</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full h-11"
        onClick={handleGoogleSignIn}
        loading={googleLoading}
        type="button"
      >
        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </Button>

      <div className="mt-8 text-center text-sm">
        <p className="text-[hsl(var(--muted-foreground))]">
          Are you an admin?{" "}
          <Link href="/admin-login" className="text-[hsl(var(--primary))] hover:underline font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
