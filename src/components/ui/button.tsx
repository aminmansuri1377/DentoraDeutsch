import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader } from "./loader";
export function Button({
  variant = "primary",
  className,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  return (
    <button
      className={cn("button", variant, className)}
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <Loader className="button-loader" />}
      {children}
    </button>
  );
}
