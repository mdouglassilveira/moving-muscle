"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CounterProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  hint?: string;
}

export function Counter({
  label,
  value,
  onChange,
  min = 1,
  max = 12,
  hint
}: CounterProps) {
  const dec = () => value > min && onChange(value - 1);
  const inc = () => value < max && onChange(value + 1);

  return (
    <div className="bg-white rounded-card border border-surface-border px-6 py-5 flex items-center justify-between">
      <div>
        <div className="text-[16px] text-ink font-medium">{label}</div>
        {hint && (
          <div className="text-[14px] text-ink-subtle mt-0.5">{hint}</div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={dec}
          disabled={value <= min}
          className={cn(
            "w-10 h-10 rounded-full border border-surface-border flex items-center justify-center text-ink-muted",
            "hover:border-brand hover:text-brand disabled:opacity-40 disabled:hover:border-surface-border disabled:hover:text-ink-muted transition"
          )}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-7 text-center text-[22px] font-bold text-ink tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={inc}
          disabled={value >= max}
          className={cn(
            "w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center",
            "hover:bg-brand-200 disabled:opacity-40 disabled:hover:bg-brand transition"
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
