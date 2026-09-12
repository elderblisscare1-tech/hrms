import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in", className)}>
      <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--destructive)/0.1)] flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-[hsl(var(--destructive))]" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      )}
    </div>
  );
}
