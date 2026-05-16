import { z } from "zod";

export const serviceTypeSchema = z.enum([
  "load_only",
  "unload_only",
  "load_and_unload",
  "in_home_help"
]);

export const propertyTypeSchema = z.enum([
  "apartment",
  "house",
  "storage_unit",
  "office"
]);

export const scheduleDaySchema = z.enum(["today", "tomorrow", "scheduled"]);
export const timeWindowSchema = z.enum(["morning", "afternoon", "evening"]);
export const addressRoleSchema = z.enum(["pickup", "dropoff", "single"]);

export const addressInputSchema = z.object({
  role: addressRoleSchema,
  formatted: z.string().min(3, "Please select an address"),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  city_code: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

export const bookingFormSchema = z.object({
  helpers: z.number().int().min(1).max(12),
  hours: z.number().int().min(1).max(24),

  service_type: serviceTypeSchema,
  property_type: propertyTypeSchema.optional(),
  truck_size: z.string().optional(),
  notes: z.string().max(1000).optional(),

  schedule_day: scheduleDaySchema,
  schedule_date: z.string().optional(),
  schedule_time_window: timeWindowSchema,
  time_flexibility_notes: z.string().max(500).optional(),

  addresses: z.array(addressInputSchema).min(1).max(2),

  customer: z.object({
    name: z.string().min(2, "Please enter your full name"),
    email: z.string().email("Please enter a valid email"),
    phone: z
      .string()
      .min(7, "Please enter a valid phone number")
      .max(25)
  })
});

export type BookingFormInput = z.infer<typeof bookingFormSchema>;
export type AddressInput = z.infer<typeof addressInputSchema>;
