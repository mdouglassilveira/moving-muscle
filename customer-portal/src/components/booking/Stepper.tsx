"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  "Request",
  "Details",
  "Timing",
  "Location",
  "Contact",
  "Review"
] as const;

export function Stepper({ current }: { current: number }) {
  return (
    <div className="w-full max-w-[720px] mx-auto">
      <div className="flex items-start justify-between">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const done = stepNum < current;
          const active = stepNum === current;
          return (
            <div
              key={label}
              className="flex flex-col items-center flex-1"
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-semibold transition-colors",
                  done && "bg-brand text-white",
                  active && "bg-white border-2 border-brand text-brand",
                  !done && !active &&
                    "bg-white border border-surface-border text-ink-subtle"
                )}
              >
                {done ? <Check className="w-4 h-4" strokeWidth={3} /> : stepNum}
              </div>
              <div
                className={cn(
                  "mt-2.5 text-[12px] font-medium",
                  active && "text-ink",
                  done && "text-ink-muted",
                  !done && !active && "text-ink-subtle"
                )}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
