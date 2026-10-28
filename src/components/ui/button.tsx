import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return <button className={cn("button", variant, className)} {...props} />;
}
