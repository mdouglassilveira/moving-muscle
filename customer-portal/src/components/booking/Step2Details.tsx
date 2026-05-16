"use client";

import { Info } from "lucide-react";
import { useBooking } from "./BookingProvider";
import { SelectableCard } from "@/components/ui/SelectableCard";
import { Textarea } from "@/components/ui/Textarea";
import type { BookingFormInput } from "@/lib/schemas/booking";

const SERVICES: Array<{ value: BookingFormInput["service_type"]; label: string }> = [
  { value: "load_only", label: "Load Only" },
  { value: "unload_only", label: "Unload Only" },
  { value: "load_and_unload", label: "Load & Unload" },
  { value: "in_home_help", label: "In-Home Moving Help" }
];

const PROPERTY_TYPES: Array<{ value: BookingFormInput["property_type"]; label: string }> = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "storage_unit", label: "Storage Unit" },
  { value: "office", label: "Office" }
];

const TRUCK_OPTIONS = [
  "Pickup truck",
  "Cargo van",
  "10ft truck",
  "16ft truck",
  "20ft truck",
  "26ft truck",
  "Storage container (POD/U-Box)",
  "Other"
];

export function Step2Details() {
  const { draft, update } = useBooking();
  const isLaborOnly =
    draft.service_type === "load_only" || draft.service_type === "unload_only";
  const showTruck =
    draft.service_type === "load_only" ||
    draft.service_type === "unload_only" ||
    draft.service_type === "load_and_unload";

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-[32px] font-bold text-ink leading-tight tracking-tight">
          What type of moving help do you need?
        </h1>
        <p className="text-[16px] text-ink-muted mt-2">
          Select the service that best fits your needs
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {SERVICES.map((s) => (
          <SelectableCard
            key={s.value}
            selected={draft.service_type === s.value}
            onClick={() => update({ service_type: s.value })}
            title={s.label}
          />
        ))}
      </div>

      <div>
        <div className="text-[15px] font-semibold text-ink mb-3">
          Property Type
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PROPERTY_TYPES.map((p) => (
            <SelectableCard
              key={p.value}
              selected={draft.property_type === p.value}
              onClick={() => update({ property_type: p.value })}
              title={p.label}
              showCheck={false}
              className="text-center !py-4"
            />
          ))}
        </div>
      </div>

      {showTruck && (
        <div>
          <div className="text-[15px] font-semibold text-ink mb-3">
            Helpers will be {draft.service_type === "unload_only" ? "unloading:" : "loading:"}
          </div>
          <select
            value={draft.truck_size ?? ""}
            onChange={(e) => update({ truck_size: e.target.value || undefined })}
            className="w-full h-14 bg-white border border-surface-border rounded-card px-5 text-[16px] text-ink outline-none focus:border-brand"
          >
            <option value="">Select truck or container type...</option>
            {TRUCK_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLaborOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-card px-5 py-4 flex gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[14px] text-amber-900 leading-relaxed">
            <span className="font-semibold">Labor-only service — no truck included.</span>{" "}
            Please make sure you have your own truck and driver arranged for move day.
          </p>
        </div>
      )}

      <div>
        <div className="text-[15px] font-semibold text-ink mb-3">
          Notes <span className="text-ink-subtle font-normal">(Optional)</span>
        </div>
        <Textarea
          value={draft.notes ?? ""}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Heavy items, stairs, parking instructions, special requests..."
        />
      </div>
    </div>
  );
}
