/**
 * Server-side orchestration for a booking submission.
 *
 * Pipeline:
 *   1. Upsert customer (dedup by lowercase email).
 *   2. Insert addresses + booking_request + booking_addresses.
 *   3. Push to Glide (or dry-run if GLIDE_API_KEY missing).
 *   4. Send confirmation email (or dry-run if RESEND_API_KEY missing).
 *   5. Update booking_request with glide_row_id and email_sent_at.
 *
 * Returned shape is what the frontend ConfirmationScreen needs.
 *
 * This file is framework-agnostic — Next.js API routes, Edge Functions,
 * or future React Native backend handlers can all import it.
 */

import { getServiceClient } from "@/lib/supabase/server";
import { calculatePrice, helpersActionFor } from "@/lib/domain/pricing";
import { pushBookingToGlide } from "@/lib/glide/client";
import { sendEmail } from "@/lib/email/resend";
import { renderBookingConfirmationEmail } from "@/lib/email/templates/booking-confirmation";
import { shortRequestId } from "@/lib/utils";
import type { BookingFormInput } from "@/lib/schemas/booking";

export interface SubmitBookingResult {
  bookingId: string;
  requestNumber: string;
  totalPrice: number;
  glide: { rowID: string; dryRun: boolean };
  email: { id: string | null; dryRun: boolean; sentTo: string };
}

export async function submitBooking(
  input: BookingFormInput
): Promise<SubmitBookingResult> {
  const sb = getServiceClient();
  const price = calculatePrice(input.helpers, input.hours);

  // 1. Upsert customer by email (case-insensitive).
  const emailLower = input.customer.email.toLowerCase().trim();

  const { data: existingCustomer } = await sb
    .from("customers")
    .select("id")
    .ilike("email", emailLower)
    .maybeSingle();

  let customerId: string;
  if (existingCustomer) {
    customerId = existingCustomer.id;
    await sb
      .from("customers")
      .update({
        name: input.customer.name,
        phone: input.customer.phone
      })
      .eq("id", customerId);
  } else {
    const { data, error } = await sb
      .from("customers")
      .insert({
        name: input.customer.name,
        email: emailLower,
        phone: input.customer.phone
      })
      .select("id")
      .single();
    if (error) throw new Error(`customers insert: ${error.message}`);
    customerId = data.id;
  }

  // 2. Insert addresses.
  const addressesPayload = input.addresses.map((a) => ({
    customer_id: customerId,
    formatted: a.formatted,
    street: a.street ?? null,
    city: a.city ?? null,
    state: a.state ?? null,
    zip: a.zip ?? null,
    city_code: a.city_code ?? null,
    lat: a.lat ?? null,
    lng: a.lng ?? null
  }));

  const { data: insertedAddresses, error: addrErr } = await sb
    .from("addresses")
    .insert(addressesPayload)
    .select("id");
  if (addrErr) throw new Error(`addresses insert: ${addrErr.message}`);
  if (!insertedAddresses || insertedAddresses.length !== input.addresses.length) {
    throw new Error("addresses insert returned unexpected count");
  }

  // 3. Insert booking_request.
  const { data: bookingRow, error: bookErr } = await sb
    .from("booking_requests")
    .insert({
      customer_id: customerId,
      service_type: input.service_type,
      property_type: input.property_type ?? null,
      truck_size: input.truck_size ?? null,
      helpers_action: helpersActionFor(input.service_type),
      helpers: input.helpers,
      hours: input.hours,
      hourly_rate: price.hourlyRate,
      total_price: price.totalPrice,
      schedule_day: input.schedule_day,
      schedule_date: input.schedule_date ?? null,
      schedule_time_window: input.schedule_time_window,
      time_flexibility_notes: input.time_flexibility_notes ?? null,
      notes: input.notes ?? null,
      source: "customer_portal"
    })
    .select("id")
    .single();
  if (bookErr) throw new Error(`booking_requests insert: ${bookErr.message}`);
  const bookingId = bookingRow.id;

  // 4. Link booking ↔ addresses.
  const linkPayload = input.addresses.map((a, i) => ({
    booking_request_id: bookingId,
    address_id: insertedAddresses[i].id,
    role: a.role,
    sequence: i + 1
  }));
  const { error: linkErr } = await sb.from("booking_addresses").insert(linkPayload);
  if (linkErr) throw new Error(`booking_addresses insert: ${linkErr.message}`);

  // 5. Push to Glide (parallel with email — both are best-effort).
  const requestNumber = shortRequestId(bookingId);

  const [glideResult, emailResult] = await Promise.allSettled([
    pushBookingToGlide(input),
    (async () => {
      const { subject, html } = renderBookingConfirmationEmail({
        requestNumber,
        input,
        totalPrice: price.totalPrice
      });
      return sendEmail({ to: input.customer.email, subject, html });
    })()
  ]);

  const glide =
    glideResult.status === "fulfilled"
      ? glideResult.value
      : (() => {
          console.error("[submit-booking] glide failed:", glideResult.reason);
          return { rowID: "", dryRun: false };
        })();

  const email =
    emailResult.status === "fulfilled"
      ? emailResult.value
      : (() => {
          console.error("[submit-booking] email failed:", emailResult.reason);
          return { id: null, dryRun: false };
        })();

  // 6. Update booking with side-effect markers.
  await sb
    .from("booking_requests")
    .update({
      glide_row_id: glide.rowID || null,
      email_sent_at: emailResult.status === "fulfilled" ? new Date().toISOString() : null
    })
    .eq("id", bookingId);

  return {
    bookingId,
    requestNumber,
    totalPrice: price.totalPrice,
    glide,
    email: { ...email, sentTo: input.customer.email }
  };
}
