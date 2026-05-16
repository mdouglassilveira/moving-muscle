"use client";

import { useBooking } from "./BookingProvider";
import { AddressAutocomplete } from "./AddressAutocomplete";
import type { AddressInput } from "@/lib/schemas/booking";

export function Step4Location() {
  const { draft, update } = useBooking();
  const isLoadAndUnload = draft.service_type === "load_and_unload";

  const setAddress = (
    role: AddressInput["role"],
    parsed: Omit<AddressInput, "role">
  ) => {
    const next: AddressInput = { role, ...parsed };
    if (isLoadAndUnload) {
      const others = draft.addresses.filter((a) => a.role !== role);
      const ordered = role === "pickup" ? [next, ...others] : [...others, next];
      update({ addresses: ordered });
    } else {
      update({ addresses: [next] });
    }
  };

  const findAddress = (role: AddressInput["role"]) =>
    draft.addresses.find((a) => a.role === role);

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-[32px] font-bold text-ink leading-tight tracking-tight">
          Where's the job?
        </h1>
        <p className="text-[16px] text-ink-muted mt-2">
          Please enter the full address exactly as it appears on Google Maps.
        </p>
      </div>

      {isLoadAndUnload ? (
        <>
          <div>
            <div className="text-[15px] font-semibold text-ink mb-3">
              Pickup Address
            </div>
            <AddressAutocomplete
              value={findAddress("pickup")?.formatted ?? ""}
              onSelect={(p) => setAddress("pickup", p)}
              placeholder="Where are we picking up from?"
            />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-ink mb-3">
              Drop-off Address
            </div>
            <AddressAutocomplete
              value={findAddress("dropoff")?.formatted ?? ""}
              onSelect={(p) => setAddress("dropoff", p)}
              placeholder="Where are we dropping off?"
            />
          </div>
        </>
      ) : (
        <div>
          <div className="text-[15px] font-semibold text-ink mb-3">
            Service Address
          </div>
          <AddressAutocomplete
            value={findAddress("single")?.formatted ?? ""}
            onSelect={(p) => setAddress("single", p)}
          />
        </div>
      )}
    </div>
  );
}
