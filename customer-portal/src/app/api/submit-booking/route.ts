import { NextResponse } from "next/server";
import { bookingFormSchema } from "@/lib/schemas/booking";
import { submitBooking } from "@/lib/domain/submit-booking";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message
        }))
      },
      { status: 400 }
    );
  }

  try {
    const result = await submitBooking(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[submit-booking] failed:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
