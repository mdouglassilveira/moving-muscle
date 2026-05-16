import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function shortRequestId(uuid: string) {
  return uuid.replace(/-/g, "").slice(-5).toUpperCase();
}
