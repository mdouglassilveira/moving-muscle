"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBooking } from "./BookingProvider";
import { Stepper } from "./Stepper";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";
import { Step1Request } from "./Step1Request";
import { Step2Details } from "./Step2Details";
import { Step3Timing } from "./Step3Timing";
import { Step4Location } from "./Step4Location";
import { Step5Contact } from "./Step5Contact";
import { Step6Review } from "./Step6Review";
import { ConfirmationScreen } from "./ConfirmationScreen";

export function WizardShell() {
  const { step, totalSteps, next, back, isStepValid, result, submit, submitting, error } = useBooking();

  if (result) {
    return <ConfirmationScreen result={result} />;
  }

  const isLast = step === totalSteps;
  const valid = isStepValid(step);

  const handleContinue = () => {
    if (!valid || submitting) return;
    if (isLast) {
      submit();
    } else {
      next();
    }
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      <header className="bg-white border-b border-surface-border">
        <div className="max-w-[1200px] mx-auto px-8 h-[72px] flex items-center justify-between">
          <Logo />
          <span className="text-[14px] text-ink-muted">
            Step {step} of {totalSteps}
          </span>
        </div>
      </header>

      <div className="bg-white border-b border-surface-border">
        <div className="px-8 py-7">
          <Stepper current={step} />
        </div>
      </div>

      <main className="flex-1 px-6 py-12 pb-40">
        <div className="max-w-[760px] mx-auto">
          {step === 1 && <Step1Request />}
          {step === 2 && <Step2Details />}
          {step === 3 && <Step3Timing />}
          {step === 4 && <Step4Location />}
          {step === 5 && <Step5Contact />}
          {step === 6 && <Step6Review />}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-[760px] mx-auto px-6 py-5 flex items-center gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={back}
            disabled={step === 1 || submitting}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            type="button"
            onClick={handleContinue}
            disabled={!valid || submitting}
            className="flex-1"
          >
            {submitting
              ? "Submitting..."
              : isLast
              ? "Submit Request"
              : "Continue"}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
        {error && (
          <div className="max-w-[760px] mx-auto px-6 pb-3 text-[13px] text-red-600 text-center">
            {error}
          </div>
        )}
        {step === 6 && !error && (
          <div className="max-w-[760px] mx-auto px-6 pb-4 text-[13px] text-ink-subtle text-center">
            No payment required — We'll review your request and reach out within 1 hour
          </div>
        )}
      </footer>
    </div>
  );
}
