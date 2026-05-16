"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center font-semibold rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-200",
  secondary:
    "bg-white text-ink border border-surface-border hover:bg-surface-subtle",
  ghost: "text-ink hover:bg-surface-subtle"
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-[15px] gap-2",
  lg: "h-14 px-8 text-[16px] gap-2"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "lg", ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  )
);
Button.displayName = "Button";
