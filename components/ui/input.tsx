import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: string }>(
  ({ className, type, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";

    return (
      <div className="w-full">
        <div className="relative">
          <input
            type={isPassword && showPassword ? "text" : type}
            className={cn(
              "flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm transition-colors duration-200",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-[hsl(var(--muted-foreground))]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isPassword && "pr-10",
              error && "border-[hsl(var(--destructive))] focus-visible:ring-[hsl(var(--destructive))]",
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-[hsl(var(--destructive))]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
