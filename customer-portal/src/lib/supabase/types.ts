/**
 * Hand-typed mirror of the schema. Replace with output of:
 *   supabase gen types typescript --project-id uefwlvmtitrrjzbisbwq
 * once Supabase CLI is installed.
 */

export type ServiceType = "load_only" | "unload_only" | "load_and_unload" | "in_home_help";
export type PropertyType = "apartment" | "house" | "storage_unit" | "office";
export type BookingStatus =
  | "pending"
  | "contacted"
  | "confirmed"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";
export type AddressRole = "pickup" | "dropoff" | "single";
export type ScheduleDay = "today" | "tomorrow" | "scheduled";
export type TimeWindow = "morning" | "afternoon" | "evening";
export type HelpersAction = "loading" | "unloading" | "both" | "in_home";

export interface CustomerRow {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddressRow {
  id: string;
  customer_id: string | null;
  formatted: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  city_code: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface BookingRequestRow {
  id: string;
  customer_id: string;
  service_type: ServiceType;
  property_type: PropertyType | null;
  truck_size: string | null;
  helpers_action: HelpersAction | null;
  helpers: number;
  hours: number;
  hourly_rate: number;
  total_price: number;
  schedule_day: ScheduleDay;
  schedule_date: string | null;
  schedule_time_window: TimeWindow;
  time_flexibility_notes: string | null;
  notes: string | null;
  status: BookingStatus;
  source: string;
  glide_row_id: string | null;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
}
