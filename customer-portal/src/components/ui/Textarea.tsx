"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...rest }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full min-h-[120px] bg-white rounded-card border border-surface-border px-5 py-4 text-[16px] text-ink placeholder:text-ink-subtle outline-none focus:border-brand resize-y",
      className
    )}
    {...rest}
  />
));
Textarea.displayName = "Textarea";
