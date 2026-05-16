"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SelectableCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  showCheck?: boolean;
  className?: string;
}

export function SelectableCard({
  selected,
  onClick,
  title,
  subtitle,
  icon,
  showCheck = true,
  className
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "w-full text-left rounded-card border bg-white px-5 py-4 transition relative",
        selected
          ? "border-brand bg-mint-50/70 shadow-sm"
          : "border-surface-border hover:border-ink-subtle/40",
        className
      )}
    >
      {icon && <div className="mb-2.5">{icon}</div>}
      <div className="text-[16px] font-medium text-ink">{title}</div>
      {subtitle && (
        <div className="text-[14px] text-ink-subtle mt-0.5">{subtitle}</div>
      )}
      {showCheck && selected && (
        <Check className="absolute top-4 right-4 w-5 h-5 text-brand" />
      )}
    </button>
  );
}
