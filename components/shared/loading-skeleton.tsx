import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "table" | "card" | "list" | "detail" | "form";
  rows?: number;
  className?: string;
}

function SkeletonBox({ className }: { className?: string }) {
  return <div className={cn("animate-shimmer rounded-lg", className)} />;
}

export function LoadingSkeleton({ variant = "table", rows = 5, className }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[hsl(var(--border))] p-6 space-y-3">
            <SkeletonBox className="h-4 w-1/3" />
            <SkeletonBox className="h-8 w-2/3" />
            <SkeletonBox className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-4">
          <SkeletonBox className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <SkeletonBox className="h-6 w-48" />
            <SkeletonBox className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBox className="h-3 w-20" />
              <SkeletonBox className="h-5 w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("space-y-6", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBox className="h-3 w-24" />
            <SkeletonBox className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // Default: table variant
  return (
    <div className={cn("space-y-3", className)}>
      {/* Table header */}
      <div className="flex gap-4 px-4 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBox key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-4 rounded-lg border border-[hsl(var(--border)/0.5)]">
          <SkeletonBox className="h-8 w-8 rounded-full shrink-0" />
          {Array.from({ length: 4 }).map((_, j) => (
            <SkeletonBox key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
