"use client";

import { Mail, Phone, User, Check } from "lucide-react";
import { useBooking } from "./BookingProvider";
import { Input } from "@/components/ui/Input";

export function Step5Contact() {
  const { draft, update, isStepValid } = useBooking();

  const set = (patch: Partial<typeof draft.customer>) =>
    update({ customer: { ...draft.customer, ...patch } });

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-[32px] font-bold text-ink leading-tight tracking-tight">
          How can we reach you?
        </h1>
        <p className="text-[16px] text-ink-muted mt-2">
          We'll use this information to confirm your booking request.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <div className="text-[15px] font-semibold text-ink mb-3">Full Name</div>
          <Input
            icon={<User className="w-5 h-5" />}
            value={draft.customer.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="John Smith"
            autoComplete="name"
          />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-ink mb-3">Email Address</div>
          <Input
            icon={<Mail className="w-5 h-5" />}
            type="email"
            value={draft.customer.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="john@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-ink mb-3">Phone Number</div>
          <Input
            icon={<Phone className="w-5 h-5" />}
            type="tel"
            value={draft.customer.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="(555) 123-4567"
            autoComplete="tel"
          />
        </div>
      </div>

      {isStepValid(5) && (
        <div className="bg-mint-50/70 border border-mint-100 rounded-card px-5 py-4 flex items-center gap-2.5 text-[14px] text-ink">
          <Check className="w-5 h-5 text-brand flex-shrink-0" strokeWidth={2.5} />
          <span>
            <span className="font-semibold">Almost done!</span> Just one more step to
            review your booking
          </span>
        </div>
      )}
    </div>
  );
}
