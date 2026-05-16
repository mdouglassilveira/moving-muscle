"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, invalid, ...rest }, ref) => {
    return (
      <div
        className={cn(
          "relative flex items-center bg-white rounded-card border h-14 px-5 transition-colors",
          invalid
            ? "border-red-300 focus-within:border-red-400"
            : "border-surface-border focus-within:border-brand"
        )}
      >
        {icon && (
          <span className="text-ink-subtle mr-3 flex-shrink-0">{icon}</span>
        )}
        <input
          ref={ref}
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-[16px] text-ink placeholder:text-ink-subtle",
            className
          )}
          {...rest}
        />
      </div>
    );
  }
);
Input.displayName = "Input";
