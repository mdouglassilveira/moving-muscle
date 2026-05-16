"use client";

import { useBooking } from "./BookingProvider";
import { Counter } from "@/components/ui/Counter";
import { calculatePrice } from "@/lib/domain/pricing";
import { formatCurrency } from "@/lib/utils";

export function Step1Request() {
  const { draft, update } = useBooking();
  const { totalPrice, hourlyRate } = calculatePrice(draft.helpers, draft.hours);

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-[32px] font-bold text-ink leading-tight tracking-tight">
          Choose your request
        </h1>
        <p className="text-[16px] text-ink-muted mt-2">
          Adjust the number of moving helpers and hours needed
        </p>
      </div>

      <div className="bg-mint-50/70 rounded-card py-9 px-8 text-center">
        <div className="text-[12px] font-semibold text-ink-subtle uppercase tracking-[0.1em]">
          Estimated Total
        </div>
        <div className="mt-2 leading-none">
          <span className="text-[36px] text-ink-subtle font-semibold align-top mt-2 inline-block">
            $
          </span>
          <span className="text-[60px] font-bold text-ink tracking-tight">
            {totalPrice}
          </span>
        </div>
        <div className="text-[14px] text-ink-muted mt-3">
          {draft.helpers} moving helper{draft.helpers > 1 ? "s" : ""} ×{" "}
          {draft.hours} hour{draft.hours > 1 ? "s" : ""} ×{" "}
          {formatCurrency(hourlyRate)}/hr
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Counter
          label="Number of Moving Helpers"
          value={draft.helpers}
          onChange={(v) => update({ helpers: v })}
          min={1}
          max={6}
        />
        <Counter
          label="Hours Needed"
          value={draft.hours}
          onChange={(v) => update({ hours: v })}
          min={1}
          max={12}
        />
      </div>

      <div className="text-[14px] text-ink-subtle text-center">
        Items weighing 300+ lbs require 4 moving helpers.
      </div>
    </div>
  );
}
