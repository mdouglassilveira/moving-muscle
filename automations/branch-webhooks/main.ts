/**
 * branch-webhooks — receiver for Branch payment webhooks.
 *
 * Follows Branch's webhook implementation guide:
 *   1. Receive POST  2. Deduplicate by event_id  3. Decrypt `data` (AES-256-CBC)
 *   4. Route by event type  5. Store event_id
 *
 * Security layers (defense in depth):
 *   - IP allowlist of Branch's published IPs (log-only until BRANCH_IP_ENFORCE=true)
 *   - Optional capability token in the URL path (active only if BRANCH_WEBHOOK_TOKEN set)
 *   - AES-256-CBC decryption with a shared key = cryptographic proof of authenticity
 *   - event_id dedup (idempotent) + full audit log of every request
 *
 * URL shape:  /branch/{sandbox|production}/wh            (no token)
 *             /branch/{sandbox|production}/wh/{token}    (token enabled)
 *
 * Run locally:  deno task dev
 */

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";

const env = (key: string, required = true) => {
  const v = Deno.env.get(key);
  if (required && !v) throw new Error(`Missing env: ${key}`);
  return v;
};

const PORT = Number(Deno.env.get("PORT") ?? 8000);

const sb = createClient(env("SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Branch's published webhook source IPs (from Rocketlane task).
const BRANCH_IPS = new Set([
  "35.233.214.219",
  "35.203.179.194",
  "34.83.205.133",
  "35.233.209.112",
  "35.192.0.203",
  "34.122.189.221",
  "34.122.107.153",
  "34.29.96.86",
]);
// Log-only until explicitly enforced — avoids dropping sandbox events if the
// published IP list is incomplete and silently failing certification.
const IP_ENFORCE = Deno.env.get("BRANCH_IP_ENFORCE") === "true";

// Optional capability token. If unset, the URL has no token segment.
const WEBHOOK_TOKEN = Deno.env.get("BRANCH_WEBHOOK_TOKEN");

// Per-environment AES keys (base64). Absent → decryption is skipped (event still stored).
const AES_KEYS: Record<string, string | undefined> = {
  sandbox: Deno.env.get("BRANCH_AES_KEY_SANDBOX"),
  production: Deno.env.get("BRANCH_AES_KEY_PRODUCTION"),
};

const HANDLED_EVENTS = new Set([
  "TIN_VERIFICATION_MATCHED",
  "TIN_VERIFICATION_FAILED",
  "PAYMENT_PROFILE_ACTIVATED",
  "PAYMENT_PROFILE_DEACTIVATED",
]);

// ────────────────────────────────────────────────────────────────
// Envelope schema — tolerant: Branch's outer fields are not encrypted.
// ────────────────────────────────────────────────────────────────

const envelopeSchema = z.object({
  event_id: z.string().min(1),
  event: z.string().min(1),
  client_type: z.string().optional(),
  client_id: z.string().optional(),
  // `data` is base64 ciphertext in real webhooks; may be an object in sandbox.
  data: z.union([z.string(), z.record(z.unknown())]).optional(),
});

type Envelope = z.infer<typeof envelopeSchema>;

// ────────────────────────────────────────────────────────────────
// AES-256-CBC decryption (Branch format: base64( IV[16] + ciphertext )).
// Web Crypto strips PKCS#7 padding automatically (compatible with PKCS5).
// ────────────────────────────────────────────────────────────────

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function decryptBranchData(dataB64: string, keyB64: string): Promise<unknown> {
  const keyBytes = b64ToBytes(keyB64);
  const blob = b64ToBytes(dataB64);
  const iv = blob.slice(0, 16);
  const ciphertext = blob.slice(16);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["decrypt"],
  );
  const plain = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, ciphertext);
  const text = new TextDecoder().decode(plain);
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function constantTimeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return null;
}

/** Parse `/branch/{env}/wh` or `/branch/{env}/wh/{token}`. */
function parsePath(pathname: string): { environment: string; token: string | null } | null {
  const m = pathname.match(/^\/branch\/(sandbox|production)\/wh(?:\/([^/]+))?\/?$/);
  if (!m) return null;
  return { environment: m[1], token: m[2] ?? null };
}

// ────────────────────────────────────────────────────────────────
// Event routing — fase 2 (payment-profile state) plugs in here once the
// AES key arrives. For now every event is decrypted (if possible) and stored.
// ────────────────────────────────────────────────────────────────

function routeEvent(eventType: string, decrypted: unknown) {
  if (!HANDLED_EVENTS.has(eventType)) {
    console.log(`[event] unhandled type: ${eventType}`);
    return;
  }
  // TODO(fase 2): update mover payment-profile / TIN status in Supabase.
  console.log(`[event] ${eventType} received`, decrypted ? "(decrypted)" : "(no key)");
}

// ────────────────────────────────────────────────────────────────
// Request handler
// ────────────────────────────────────────────────────────────────

async function handleWebhook(
  req: Request,
  environment: string,
  pathToken: string | null,
): Promise<Response> {
  const ip = clientIp(req);
  const ipAllowed = ip ? BRANCH_IPS.has(ip) : false;

  // Layer 1: IP allowlist (log-only unless enforced).
  if (!ipAllowed) {
    console.warn(`[ip] off-allowlist request from ${ip ?? "unknown"} (enforce=${IP_ENFORCE})`);
    if (IP_ENFORCE) return new Response("Forbidden", { status: 403 });
  }

  // Layer 2: capability token (only if configured). 404 = don't confirm endpoint exists.
  if (WEBHOOK_TOKEN) {
    if (!pathToken || !constantTimeEqual(pathToken, WEBHOOK_TOKEN)) {
      return new Response("Not found", { status: 404 });
    }
  }

  // Parse + validate envelope.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = envelopeSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[envelope] invalid:", parsed.error.issues);
    return Response.json({ error: "Invalid envelope" }, { status: 400 });
  }
  const evt: Envelope = parsed.data;

  // Layer 4: dedup — insert first; a unique violation means we already have it.
  const { error: insertErr } = await sb.from("branch_webhook_events").insert({
    event_id: evt.event_id,
    environment,
    event_type: evt.event,
    client_id: evt.client_id ?? null,
    client_type: evt.client_type ?? null,
    raw_payload: body as Record<string, unknown>,
    source_ip: ip,
    ip_allowed: ipAllowed,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      // Duplicate event_id — already received. Idempotent success.
      console.log(`[dedup] event ${evt.event_id} already stored — ack`);
      return Response.json({ status: "duplicate" }, { status: 200 });
    }
    console.error("[db] insert failed:", insertErr);
    return Response.json({ error: "Storage error" }, { status: 500 });
  }

  // Layer 3: decrypt `data` (only if a key for this environment is configured).
  let decrypted: unknown = null;
  let processingError: string | null = null;
  const aesKey = AES_KEYS[environment];
  if (typeof evt.data === "string" && aesKey) {
    try {
      decrypted = await decryptBranchData(evt.data, aesKey);
    } catch (e) {
      processingError = `decrypt failed: ${e instanceof Error ? e.message : e}`;
      console.error(`[decrypt] ${processingError}`);
    }
  } else if (typeof evt.data === "object" && evt.data !== null) {
    // Sandbox/Postman may deliver an already-plain data block.
    decrypted = evt.data;
  } else if (typeof evt.data === "string" && !aesKey) {
    console.log(`[decrypt] skipped — no AES key for '${environment}' yet`);
  }

  // Route (fase 2 wiring goes in routeEvent).
  try {
    routeEvent(evt.event, decrypted);
  } catch (e) {
    processingError = `routing failed: ${e instanceof Error ? e.message : e}`;
    console.error(`[route] ${processingError}`);
  }

  // Mark processed.
  await sb
    .from("branch_webhook_events")
    .update({
      decrypted_data: decrypted as Record<string, unknown> | null,
      processed_at: new Date().toISOString(),
      processing_error: processingError,
    })
    .eq("event_id", evt.event_id)
    .eq("environment", environment);

  return Response.json({ status: "received" }, { status: 200 });
}

// ────────────────────────────────────────────────────────────────
// Server
// ────────────────────────────────────────────────────────────────

Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    return new Response(
      `branch-webhooks OK\nip_enforce=${IP_ENFORCE} token=${WEBHOOK_TOKEN ? "on" : "off"}\n`,
      { status: 200 },
    );
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const route = parsePath(url.pathname);
  if (!route) {
    return new Response("Not found", { status: 404 });
  }

  try {
    return await handleWebhook(req, route.environment, route.token);
  } catch (err) {
    console.error("[branch-webhooks] unhandled:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
});

console.log(`branch-webhooks listening on http://localhost:${PORT}`);
