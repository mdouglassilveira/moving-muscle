"use client";

import { Check } from "lucide-react";
import type { SubmitResult } from "./BookingProvider";
import { Logo } from "./Logo";
import { formatCurrency } from "@/lib/utils";

export function ConfirmationScreen({ result }: { result: SubmitResult }) {
  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      <header className="bg-white border-b border-surface-border">
        <div className="max-w-[1200px] mx-auto px-8 h-[72px] flex items-center">
          <Logo />
        </div>
      </header>

      <main className="flex-1 px-6 py-14">
        <div className="max-w-[560px] mx-auto">
          <div className="flex flex-col items-center text-center mb-9">
            <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center mb-5">
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
            <h1 className="text-[32px] font-bold text-ink leading-tight tracking-tight">
              Request Submitted!
            </h1>
            <div className="text-[13px] text-ink-subtle mt-2.5">
              Confirmation #{result.requestNumber}
            </div>
          </div>

          <div className="bg-white border border-surface-border rounded-card p-7">
            <h2 className="text-[16px] font-bold text-ink mb-5">Next Steps</h2>

            <div className="bg-mint-50/70 rounded-card p-5 mb-6">
              <div className="text-[14px] font-semibold text-ink mb-1">
                Our Promise:
              </div>
              <p className="text-[15px] text-ink-muted leading-relaxed">
                You will receive a call from us within 1 hour.
              </p>
            </div>

            <div className="text-[15px] font-semibold text-ink mb-3.5">
              What to Expect:
            </div>
            <ol className="space-y-3 mb-6">
              {[
                "Our team begins reviewing your request immediately",
                "You may receive SMS updates",
                <>
                  Within 1 hour, a concierge will call you from{" "}
                  <span className="text-brand font-semibold">(980) 920-3022</span>
                </>
              ].map((item, i) => (
                <li key={i} className="flex gap-2.5 text-[15px] text-ink-muted">
                  <span className="text-brand font-semibold flex-shrink-0">
                    {i + 1}.
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>

            <div className="border-t border-surface-divider pt-5 flex items-center justify-between">
              <div className="text-[14px] text-ink-subtle">
                Estimated Total
              </div>
              <div className="text-[22px] font-bold text-ink">
                {formatCurrency(result.totalPrice)}
              </div>
            </div>
          </div>

          {(result.email.dryRun || result.glide.dryRun) && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-card px-5 py-4 text-[13px] text-amber-900 leading-relaxed">
              <strong>Dev mode notice:</strong>{" "}
              {result.email.dryRun && "email is in dry-run (no RESEND_API_KEY)"}
              {result.email.dryRun && result.glide.dryRun && " and "}
              {result.glide.dryRun && "Glide push is in dry-run (no GLIDE_API_KEY)"}
              . Booking is saved in Supabase.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
