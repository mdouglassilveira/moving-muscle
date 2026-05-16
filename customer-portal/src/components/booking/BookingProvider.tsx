"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { bookingFormSchema, type BookingFormInput, type AddressInput } from "@/lib/schemas/booking";

export interface BookingDraft {
  helpers: number;
  hours: number;
  service_type?: BookingFormInput["service_type"];
  property_type?: BookingFormInput["property_type"];
  truck_size?: string;
  notes?: string;
  schedule_day?: BookingFormInput["schedule_day"];
  schedule_time_window?: BookingFormInput["schedule_time_window"];
  time_flexibility_notes?: string;
  addresses: AddressInput[];
  customer: { name: string; email: string; phone: string };
}

const INITIAL: BookingDraft = {
  helpers: 2,
  hours: 2,
  addresses: [],
  customer: { name: "", email: "", phone: "" }
};

export interface SubmitResult {
  bookingId: string;
  requestNumber: string;
  totalPrice: number;
  email: { sentTo: string; dryRun: boolean };
  glide: { dryRun: boolean };
}

interface Ctx {
  step: number;
  totalSteps: number;
  draft: BookingDraft;
  update: (patch: Partial<BookingDraft>) => void;
  next: () => void;
  back: () => void;
  goTo: (step: number) => void;
  isStepValid: (step: number) => boolean;
  submit: () => Promise<void>;
  submitting: boolean;
  result: SubmitResult | null;
  error: string | null;
}

const Ctx = createContext<Ctx | null>(null);

export function useBooking() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBooking must be used inside BookingProvider");
  return ctx;
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<BookingDraft>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback((patch: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const next = useCallback(() => setStep((s) => Math.min(6, s + 1)), []);
  const back = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);
  const goTo = useCallback((s: number) => setStep(Math.max(1, Math.min(6, s))), []);

  const isStepValid = useCallback(
    (s: number): boolean => {
      switch (s) {
        case 1:
          return draft.helpers >= 1 && draft.hours >= 1;
        case 2:
          return Boolean(draft.service_type);
        case 3:
          return Boolean(draft.schedule_day) && Boolean(draft.schedule_time_window);
        case 4:
          return draft.addresses.length >= 1 && draft.addresses[0].formatted.length > 3;
        case 5:
          return (
            draft.customer.name.trim().length >= 2 &&
            /\S+@\S+\.\S+/.test(draft.customer.email) &&
            draft.customer.phone.replace(/\D/g, "").length >= 7
          );
        case 6:
          return true;
        default:
          return false;
      }
    },
    [draft]
  );

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const candidate = {
        helpers: draft.helpers,
        hours: draft.hours,
        service_type: draft.service_type!,
        property_type: draft.property_type,
        truck_size: draft.truck_size,
        notes: draft.notes,
        schedule_day: draft.schedule_day!,
        schedule_time_window: draft.schedule_time_window!,
        time_flexibility_notes: draft.time_flexibility_notes,
        addresses: draft.addresses,
        customer: draft.customer
      };

      const parsed = bookingFormSchema.safeParse(candidate);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new Error(first?.message ?? "Invalid form data");
      }

      const res = await fetch("/api/submit-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Server returned ${res.status}`);
      }

      const data: SubmitResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }, [draft]);

  const value = useMemo<Ctx>(
    () => ({
      step,
      totalSteps: 6,
      draft,
      update,
      next,
      back,
      goTo,
      isStepValid,
      submit,
      submitting,
      result,
      error
    }),
    [step, draft, update, next, back, goTo, isStepValid, submit, submitting, result, error]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
