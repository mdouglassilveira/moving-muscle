/**
 * onboard-mover — webhook receiver that onboards a new mover.
 *
 * Pipeline:
 *   1. Validate payload { name, email, phone, status?, coassemble_id? }
 *   2. Resolve Coassemble user ID:
 *      payload.coassemble_id → movers.coassemble_id → GET /members?search=email (exact match)
 *      → POST /members (create) → persist ID
 *   3. POST /enrolments user=ID course=141019
 *   4. Send welcome email (dry-run unless RESEND_API_KEY is set)
 *   5. Send welcome SMS (dry-run unless TWILIO_* are set)
 *   6. Upsert audit row in movers
 *
 * Run locally:
 *   deno task dev
 *   curl -X POST http://localhost:8000 -H "Content-Type: application/json" \
 *     -d '{"name":"Test User","email":"test@example.com","phone":"+15555550123"}'
 */

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const env = (key: string, required = true) => {
  const v = Deno.env.get(key);
  if (required && !v) throw new Error(`Missing env: ${key}`);
  return v;
};

const PORT = Number(Deno.env.get("PORT") ?? 8000);

const COA_BASE = env("COASSEMBLE_BASE_URL")!;
const COA_USER = env("COASSEMBLE_USER_ID")!;
const COA_TOKEN = env("COASSEMBLE_API_TOKEN")!;
const COA_COURSE = Number(env("COASSEMBLE_COURSE_ID")!);

const TW_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TW_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TW_FROM = Deno.env.get("TWILIO_FROM_NUMBER");

const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "Moving Muscle <onboarding@resend.dev>";

const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");

const sb = createClient(env("SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ────────────────────────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────────────────────────

const payloadSchema = z.object({
  name: z.string().min(1, "name required"),
  email: z.string().email(),
  phone: z.string().min(7),
  status: z.string().optional(),
  coassemble_id: z.union([z.string(), z.number()]).nullable().optional(),
});

type Payload = z.infer<typeof payloadSchema>;

// ────────────────────────────────────────────────────────────────
// Coassemble client
// ────────────────────────────────────────────────────────────────

const coaHeaders = () => ({
  Authorization: `COASSEMBLE-V1-SHA256 UserId=${COA_USER}, UserToken=${COA_TOKEN}`,
  Accept: "application/json",
});

interface CoaMember {
  id: number;
  email: string;
  username?: string;
  firstname?: string;
  lastname?: string;
}

async function findMemberByEmail(email: string): Promise<CoaMember | null> {
  const url = `${COA_BASE}/members?search=${encodeURIComponent(email)}`;
  const r = await fetch(url, { headers: coaHeaders() });
  if (!r.ok) throw new Error(`coassemble search ${r.status}: ${await r.text()}`);
  const list = (await r.json()) as CoaMember[];
  // search is fuzzy across email/username/firstname/lastname — filter to exact email match
  return list.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function createMember(input: {
  email: string;
  firstname: string;
  lastname: string;
}): Promise<CoaMember> {
  const r = await fetch(`${COA_BASE}/members`, {
    method: "POST",
    headers: { ...coaHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      firstname: input.firstname,
      lastname: input.lastname,
      active: true,
      email_verified: true,
      disable_course_enrolment_notification: true,
    }),
  });
  if (!r.ok) throw new Error(`coassemble create ${r.status}: ${await r.text()}`);
  return r.json();
}

async function enrol(userId: number, courseId: number) {
  // Coassemble's POST /enrolments is NOT idempotent — duplicate POSTs create duplicate
  // "add" events. The enrolment log is event-sourced: a user is currently enrolled iff
  // the MOST RECENT add/remove event for the course is an "add".
  const list = await fetch(`${COA_BASE}/enrolments?user=${userId}`, { headers: coaHeaders() });
  if (list.ok) {
    const events = (await list.json()) as Array<{
      action: string;
      dtype: string;
      date: number;
      course?: { id: number };
    }>;
    const courseEvents = events
      .filter(
        (e) =>
          e.dtype === "course" &&
          e.course?.id === courseId &&
          (e.action === "add" || e.action === "remove"),
      )
      .sort((a, b) => b.date - a.date);
    if (courseEvents[0]?.action === "add") return { alreadyEnrolled: true };
  }

  const fd = new FormData();
  fd.append("user", String(userId));
  fd.append("course", String(courseId));
  const r = await fetch(`${COA_BASE}/enrolments`, {
    method: "POST",
    headers: coaHeaders(),
    body: fd,
  });
  if (r.ok) return { alreadyEnrolled: false };
  throw new Error(`coassemble enrol ${r.status}: ${await r.text()}`);
}

// ────────────────────────────────────────────────────────────────
// SMS (Twilio) — dry-run if creds unset
// ────────────────────────────────────────────────────────────────

async function sendSMS(to: string, body: string) {
  if (!TW_SID || !TW_TOKEN || !TW_FROM) {
    console.log("[sms] DRY-RUN — TWILIO_* not set");
    console.log(`[sms]   to: ${to}`);
    console.log(`[sms]   body: ${body}`);
    return { sid: null, dryRun: true };
  }
  const auth = btoa(`${TW_SID}:${TW_TOKEN}`);
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TW_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: TW_FROM, Body: body }),
  });
  if (!r.ok) throw new Error(`twilio ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return { sid: data.sid as string, dryRun: false };
}

// ────────────────────────────────────────────────────────────────
// Email (Resend) — dry-run if RESEND_API_KEY unset
// ────────────────────────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  body: { text: string; html: string },
) {
  if (!RESEND_KEY) {
    console.log("[email] DRY-RUN — RESEND_API_KEY not set");
    console.log(`[email]   to: ${to}`);
    console.log(`[email]   subject: ${subject}`);
    console.log(`[email]   text:\n${body.text}`);
    return { id: null, dryRun: true };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject,
      text: body.text,
      html: body.html,
    }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return { id: data.id as string, dryRun: false };
}

// ────────────────────────────────────────────────────────────────
// Templates
// ────────────────────────────────────────────────────────────────

const emailTemplate = (firstName: string) => {
  const text =
    `Hey ${firstName},\n\n` +
    `You should have access to the Gig-Mover Foundations Course. Use this link: https://learn.movingmuscle.co/#/courses\n\n` +
    `1) Login using your email used to apply.\n` +
    `2) Complete the full onboarding (2-3 hours).\n` +
    `3) Send your first SMS introducing yourself to the Mover Hotline.\n\n` +
    `Save this contact — Mover Hotline: (980) 202-3698`;
  const html = text
    .split("\n")
    .map((l) => (l.length ? `<p style="margin:0 0 12px 0;">${l}</p>` : `<p style="margin:0 0 12px 0;">&nbsp;</p>`))
    .join("");
  return { text, html };
};

const smsTemplate = (firstName: string) =>
  `Hey ${firstName}!\n\n` +
  `You have just received access to the Gig-Mover Foundations Onboarding — it walks you through everything step by step.\n\n` +
  `Access here: https://learn.movingmuscle.co/#/courses\n\n` +
  `The process takes roughly 2-3 hours. Take your time!`;

// ────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return {
    firstname: parts[0] ?? full,
    lastname: parts.slice(1).join(" ") || "-",
  };
}

/**
 * Normalize US phone numbers to E.164 (+1XXXXXXXXXX).
 * Accepts: "9843637221", "(984) 363-7221", "+1 984-363-7221", "1984363722", "+19843637221".
 * Throws if it can't produce a valid 10-digit US number.
 */
function normalizePhoneUS(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (input.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  throw new Error(`invalid phone (got ${digits.length} digits): ${input}`);
}

interface OnboardResult {
  mover_id: string;
  coassemble_id: number;
  user_source: "payload" | "db" | "coassemble_search" | "created";
  already_enrolled: boolean;
  email: { id: string | null; dryRun: boolean };
  sms: { sid: string | null; dryRun: boolean };
}

async function onboard(payload: Payload): Promise<OnboardResult> {
  const email = payload.email.toLowerCase().trim();
  const phone = normalizePhoneUS(payload.phone);
  const { firstname, lastname } = splitName(payload.name);

  // Existing audit row (if any)
  const { data: existing } = await sb
    .from("movers")
    .select("id, coassemble_id")
    .ilike("email", email)
    .maybeSingle();

  // Resolve coassemble user id
  let coassembleId: number | null = null;
  let source: OnboardResult["user_source"] = "created";

  if (payload.coassemble_id) {
    coassembleId = Number(payload.coassemble_id);
    source = "payload";
  } else if (existing?.coassemble_id) {
    coassembleId = Number(existing.coassemble_id);
    source = "db";
  } else {
    const found = await findMemberByEmail(email);
    if (found) {
      coassembleId = found.id;
      source = "coassemble_search";
    }
  }

  if (!coassembleId) {
    const created = await createMember({ email, firstname, lastname });
    coassembleId = created.id;
    source = "created";
  }

  // Upsert mover audit row
  let moverId: string;
  if (existing) {
    moverId = existing.id;
    await sb
      .from("movers")
      .update({
        coassemble_id: String(coassembleId),
        name: payload.name,
        phone,
        status: payload.status ?? "onboarding",
      })
      .eq("id", existing.id);
  } else {
    const { data, error } = await sb
      .from("movers")
      .insert({
        name: payload.name,
        email,
        phone,
        status: payload.status ?? "onboarding",
        coassemble_id: String(coassembleId),
      })
      .select("id")
      .single();
    if (error) throw new Error(`movers insert: ${error.message}`);
    moverId = data.id;
  }

  // Enrol in course
  const enrolResult = await enrol(coassembleId, COA_COURSE);

  // Notifications in parallel
  const [emailRes, smsRes] = await Promise.all([
    sendEmail(payload.email, "Welcome to Moving Muscle — Get started", emailTemplate(firstname)),
    sendSMS(phone, smsTemplate(firstname)),
  ]);

  return {
    mover_id: moverId,
    coassemble_id: coassembleId,
    user_source: source,
    already_enrolled: enrolResult.alreadyEnrolled,
    email: emailRes,
    sms: smsRes,
  };
}

// ────────────────────────────────────────────────────────────────
// HTTP
// ────────────────────────────────────────────────────────────────

Deno.serve({ port: PORT }, async (req) => {
  if (req.method === "GET") return new Response("onboard-mover OK\n", { status: 200 });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  if (WEBHOOK_SECRET) {
    const got = req.headers.get("Authorization");
    if (got !== `Bearer ${WEBHOOK_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", details: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await onboard(parsed.data);
    return Response.json(result, { status: 200 });
  } catch (err) {
    console.error("[onboard] failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
});

console.log(`onboard-mover listening on http://localhost:${PORT}`);
