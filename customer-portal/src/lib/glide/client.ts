/**
 * Glide API client — pushes a new booking row into the existing Glide app
 * (native-table-mVdR6ZqxjFevX1Wk4acu in app jeREtmUweqaIJ1Ozr5m2).
 *
 * Dry-run mode: when GLIDE_API_KEY is missing, logs the payload and returns
 * a synthetic rowID so the rest of the flow can be exercised without hitting
 * the real Glide API. Flip the switch by setting GLIDE_API_KEY in .env.
 */

import type { BookingFormInput } from "@/lib/schemas/booking";

const GLIDE_API_URL = "https://api.glideapp.io/api/function/mutateTables";
const GLIDE_APP_ID = process.env.GLIDE_APP_ID ?? "jeREtmUweqaIJ1Ozr5m2";
const GLIDE_TABLE = process.env.GLIDE_TABLE_ID ?? "native-table-mVdR6ZqxjFevX1Wk4acu";

// Column code mapping — extracted from the Make blueprint.
const COL = {
  service_type: "QcCtX",
  helpers: "xS3kc",
  hours: "nMr2i",
  total_price: "FauqA",
  schedule_day: "ZUXFU",
  schedule_time_window: "4l0EV",
  time_flexibility_notes: "IAkbI",
  loc1_address: "mOCJI",
  loc1_city_code: "8oziB",
  loc1_city: "KPXOu",
  loc2_city_code: "CTzey",
  loc2_address: "JUKtR",
  loc2_city: "s0p30",
  customer_name: "WK2Ae",
  customer_email: "4Tmbc",
  customer_phone: "zv1lC",
  notes: "IMauS",
  created_at: "90fC9",
  truck_size: "0ROiQ",
  property_type: "YyCoD"
} as const;

export interface GlidePushResult {
  rowID: string;
  dryRun: boolean;
}

export async function pushBookingToGlide(
  input: BookingFormInput
): Promise<GlidePushResult> {
  const apiKey = process.env.GLIDE_API_KEY;

  const loc1 = input.addresses[0];
  const loc2 = input.addresses[1];

  const columnValues: Record<string, string | number | null> = {
    [COL.service_type]: humanizeServiceType(input.service_type),
    [COL.helpers]: input.helpers,
    [COL.hours]: input.hours,
    [COL.total_price]: input.helpers * input.hours * 65,
    [COL.schedule_day]: humanizeScheduleDay(input.schedule_day),
    [COL.schedule_time_window]: humanizeTimeWindow(input.schedule_time_window),
    [COL.time_flexibility_notes]: input.time_flexibility_notes ?? null,
    [COL.loc1_address]: loc1?.formatted ?? null,
    [COL.loc1_city_code]: loc1?.city_code ?? null,
    [COL.loc1_city]: loc1?.city ?? null,
    [COL.loc2_address]: loc2?.formatted ?? null,
    [COL.loc2_city_code]: loc2?.city_code ?? null,
    [COL.loc2_city]: loc2?.city ?? null,
    [COL.customer_name]: input.customer.name,
    [COL.customer_email]: input.customer.email,
    [COL.customer_phone]: input.customer.phone,
    [COL.notes]: input.notes ?? null,
    [COL.created_at]: new Date().toISOString(),
    [COL.truck_size]: input.truck_size ?? null,
    [COL.property_type]: humanizePropertyType(input.property_type)
  };

  const body = {
    appID: GLIDE_APP_ID,
    mutations: [
      {
        kind: "add-row-to-table",
        tableName: GLIDE_TABLE,
        columnValues
      }
    ]
  };

  if (!apiKey) {
    const fakeRowID = `dry-${cryptoRandom()}`;
    console.log("[glide] DRY-RUN — no GLIDE_API_KEY set. Payload:");
    console.dir(body, { depth: 4 });
    console.log(`[glide] Returning synthetic rowID: ${fakeRowID}`);
    return { rowID: fakeRowID, dryRun: true };
  }

  const res = await fetch(GLIDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Glide API ${res.status}: ${text}`);
  }

  const data = (await res.json()) as Array<{ rowID: string }>;
  const rowID = data?.[0]?.rowID;
  if (!rowID) throw new Error("Glide API: missing rowID in response");

  return { rowID, dryRun: false };
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2, 10);
}

function humanizeServiceType(t: BookingFormInput["service_type"]) {
  return {
    load_only: "Load Only",
    unload_only: "Unload Only",
    load_and_unload: "Load & Unload",
    in_home_help: "In-Home Moving Help"
  }[t];
}

function humanizePropertyType(t: BookingFormInput["property_type"]) {
  if (!t) return null;
  return {
    apartment: "Apartment",
    house: "House",
    storage_unit: "Storage Unit",
    office: "Office"
  }[t];
}

function humanizeScheduleDay(d: BookingFormInput["schedule_day"]) {
  return { today: "Today", tomorrow: "Tomorrow", scheduled: "Scheduled" }[d];
}

function humanizeTimeWindow(w: BookingFormInput["schedule_time_window"]) {
  return {
    morning: "Morning (8am–12pm)",
    afternoon: "Afternoon (12pm–4pm)",
    evening: "Evening (4pm–8pm)"
  }[w];
}
