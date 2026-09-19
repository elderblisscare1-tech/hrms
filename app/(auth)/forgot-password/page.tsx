"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { directResetPasswordSchema, type DirectResetPasswordInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<DirectResetPasswordInput>({
    resolver: zodResolver(directResetPasswordSchema),
  });

  const onSubmit = async (data: DirectResetPasswordInput) => {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
    } finally {
      setLoading(false);
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

      <h2 className="text-2xl font-bold mb-1">Reset Password</h2>
      <p className="text-[hsl(var(--muted-foreground))] mb-8">Set a new password directly</p>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.2)] text-[hsl(var(--destructive))] text-sm animate-slide-down">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm animate-slide-down">
          Password updated successfully! Redirecting to login...
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
            disabled={success}
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium mb-1.5 block">New Password</label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
            disabled={success}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="text-sm font-medium mb-1.5 block">Confirm Password</label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
            disabled={success}
          />
        </div>

        <Button type="submit" className="w-full h-11" loading={loading} disabled={success}>
          Reset Password
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <Link href="/login" className="text-[hsl(var(--primary))] hover:underline font-medium">
          &larr; Back to login
        </Link>
      </div>
    </div>
  );
}
