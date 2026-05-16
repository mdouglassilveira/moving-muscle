"use client";

import {
  Users,
  Clock,
  Package,
  Calendar,
  Sun,
  MapPin,
  User,
  Mail,
  Phone
} from "lucide-react";
import { useBooking } from "./BookingProvider";
import { calculatePrice } from "@/lib/domain/pricing";

const SERVICE_LABELS = {
  load_only: "Load Only",
  unload_only: "Unload Only",
  load_and_unload: "Load & Unload",
  in_home_help: "In-Home Moving Help"
} as const;

const WINDOW_LABELS = {
  morning: "Morning (8am–12pm)",
  afternoon: "Afternoon (12pm–4pm)",
  evening: "Evening (4pm–8pm)"
} as const;

const DAY_LABELS = {
  today: "Today",
  tomorrow: "Tomorrow",
  scheduled: "Scheduled"
} as const;

export function Step6Review() {
  const { draft } = useBooking();
  const { totalPrice } = calculatePrice(draft.helpers, draft.hours);
  const primaryAddress = draft.addresses[0]?.formatted ?? "—";

  return (
    <div className="flex flex-col gap-7">
      <div className="text-center">
        <h1 className="text-[32px] font-bold text-ink leading-tight tracking-tight">
          Review your booking request
        </h1>
        <p className="text-[16px] text-ink-muted mt-2">
          Double-check everything looks good before submitting
        </p>
      </div>

      <div className="bg-brand rounded-card py-9 px-8 text-center text-white">
        <div className="text-[12px] font-semibold opacity-80 uppercase tracking-[0.1em]">
          Estimated Total
        </div>
        <div className="mt-2 leading-none">
          <span className="text-[36px] opacity-80 font-semibold align-top mt-2 inline-block">
            $
          </span>
          <span className="text-[60px] font-bold tracking-tight">
            {totalPrice}
          </span>
        </div>
        <div className="text-[14px] mt-3 opacity-90">
          {draft.helpers} moving helper{draft.helpers > 1 ? "s" : ""} ×{" "}
          {draft.hours} hour{draft.hours > 1 ? "s" : ""} × $65/hr
        </div>
      </div>

      <div className="bg-white border border-surface-border rounded-card p-7">
        <h2 className="text-[16px] font-bold text-ink mb-5">Booking Details</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <DetailItem
            icon={<Users className="w-4 h-4" />}
            label="Moving Helpers"
            value={`${draft.helpers} helper${draft.helpers > 1 ? "s" : ""}`}
          />
          <DetailItem
            icon={<Clock className="w-4 h-4" />}
            label="Duration"
            value={`${draft.hours} hour${draft.hours > 1 ? "s" : ""}`}
          />
          {draft.service_type && (
            <DetailItem
              icon={<Package className="w-4 h-4" />}
              label="Service Type"
              value={SERVICE_LABELS[draft.service_type]}
            />
          )}
          {draft.schedule_day && (
            <DetailItem
              icon={<Calendar className="w-4 h-4" />}
              label="Day"
              value={DAY_LABELS[draft.schedule_day]}
            />
          )}
          {draft.schedule_time_window && (
            <DetailItem
              icon={<Sun className="w-4 h-4" />}
              label="Time Window"
              value={WINDOW_LABELS[draft.schedule_time_window]}
            />
          )}
          <DetailItem
            icon={<MapPin className="w-4 h-4" />}
            label="Address"
            value={primaryAddress}
          />
          <DetailItem
            icon={<User className="w-4 h-4" />}
            label="Name"
            value={draft.customer.name}
          />
          <DetailItem
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            value={draft.customer.email}
          />
          <DetailItem
            icon={<Phone className="w-4 h-4" />}
            label="Phone"
            value={draft.customer.phone}
            full
          />
        </div>
      </div>

      <div className="bg-surface-subtle rounded-card px-5 py-4 text-center">
        <p className="text-[14px] text-ink-muted">
          <span className="font-semibold text-ink">No payment required now.</span>{" "}
          Our team will confirm availability and coordinate final details.
        </p>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
  full = false
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={"flex items-start gap-2.5 " + (full ? "col-span-2" : "")}>
      <div className="text-ink-subtle mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-ink-subtle">{label}</div>
        <div className="text-[15px] text-ink font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
