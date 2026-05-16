export const HOURLY_RATE = 65;

export interface PriceBreakdown {
  helpers: number;
  hours: number;
  hourlyRate: number;
  totalPrice: number;
}

export function calculatePrice(helpers: number, hours: number): PriceBreakdown {
  return {
    helpers,
    hours,
    hourlyRate: HOURLY_RATE,
    totalPrice: helpers * hours * HOURLY_RATE
  };
}

import type { ServiceType, HelpersAction } from "@/lib/supabase/types";

export function helpersActionFor(serviceType: ServiceType): HelpersAction {
  switch (serviceType) {
    case "load_only":
      return "loading";
    case "unload_only":
      return "unloading";
    case "load_and_unload":
      return "both";
    case "in_home_help":
      return "in_home";
  }
}
