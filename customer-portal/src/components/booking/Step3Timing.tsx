"use client";

import { Sparkles, CalendarDays, Sun, CloudSun, Moon } from "lucide-react";
import { useBooking } from "./BookingProvider";
import { SelectableCard } from "@/components/ui/SelectableCard";
import { Textarea } from "@/components/ui/Textarea";
import type { BookingFormInput } from "@/lib/schemas/booking";

const DAYS: Array<{
  value: BookingFormInput["schedule_day"];
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    value: "today",
    title: "Today",
    subtitle: "ASAP availability",
    icon: <Sparkles className="w-6 h-6 text-brand" />
  },
  {
    value: "tomorrow",
    title: "Tomorrow",
    subtitle: "Schedule ahead",
    icon: <CalendarDays className="w-6 h-6 text-ink-muted" />
  }
];

const WINDOWS: Array<{
  value: BookingFormInput["schedule_time_window"];
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    value: "morning",
    title: "Morning",
    subtitle: "8am–12pm",
    icon: <Sun className="w-6 h-6" />
  },
  {
    value: "afternoon",
    title: "Afternoon",
    subtitle: "12pm–4pm",
    icon: <CloudSun className="w-6 h-6" />
  },
  {
    value: "evening",
    title: "Evening",
    subtitle: "4pm–8pm",
    icon: <Moon className="w-6 h-6" />
  }
];

export function Step3Timing() {
  const { draft, update } = useBooking();

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-[32px] font-bold text-ink leading-tight tracking-tight">
          When do you need us?
        </h1>
        <p className="text-[16px] text-ink-muted mt-2">
          Choose your preferred time window for us to search for available moving helpers.
        </p>
      </div>

      <div>
        <div className="text-[15px] font-semibold text-ink mb-3">Select Day</div>
        <div className="grid grid-cols-2 gap-3.5">
          {DAYS.map((d) => (
            <SelectableCard
              key={d.value}
              selected={draft.schedule_day === d.value}
              onClick={() => update({ schedule_day: d.value })}
              title={d.title}
              subtitle={d.subtitle}
              icon={d.icon}
              showCheck={false}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-[15px] font-semibold text-ink mb-3">
          Select Time Window
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          {WINDOWS.map((w) => (
            <button
              key={w.value}
              type="button"
              aria-pressed={draft.schedule_time_window === w.value}
              onClick={() => update({ schedule_time_window: w.value })}
              className={
                "flex flex-col items-center justify-center px-3 py-7 rounded-card border bg-white transition " +
                (draft.schedule_time_window === w.value
                  ? "border-brand bg-mint-50/70 text-brand shadow-sm"
                  : "border-surface-border text-ink-muted hover:border-ink-subtle/40")
              }
            >
              <div className="mb-3">{w.icon}</div>
              <div className="text-[15px] font-semibold text-ink">{w.title}</div>
              <div className="text-[13px] text-ink-subtle mt-0.5">{w.subtitle}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[15px] font-semibold text-ink mb-1">
          Time Flexibility Notes{" "}
          <span className="text-ink-subtle font-normal">(optional)</span>
        </div>
        <p className="text-[14px] text-ink-muted mb-3">
          The more flexible your time window, the better our chances of finding available
          movers.
        </p>
        <Textarea
          value={draft.time_flexibility_notes ?? ""}
          onChange={(e) => update({ time_flexibility_notes: e.target.value })}
          placeholder="e.g., I'm flexible between 9am–2pm, or anytime after 3pm works..."
        />
      </div>
    </div>
  );
}
