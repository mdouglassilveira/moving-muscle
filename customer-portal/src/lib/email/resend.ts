/**
 * Email sender — uses Resend when RESEND_API_KEY is present;
 * otherwise logs the email to stdout (dry-run).
 *
 * To enable real sending:
 *   1. Create account at resend.com, verify the getmovingmuscle.com domain (DNS).
 *   2. Add to .env: RESEND_API_KEY=re_xxx and EMAIL_FROM="Moving Muscle <help@getmovingmuscle.com>"
 */

import { Resend } from "resend";

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  id: string | null;
  dryRun: boolean;
}

export async function sendEmail({
  to,
  subject,
  html
}: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "Moving Muscle <onboarding@resend.dev>";

  if (!apiKey) {
    console.log("[email] DRY-RUN — no RESEND_API_KEY set.");
    console.log(`[email]   to:      ${to}`);
    console.log(`[email]   from:    ${from}`);
    console.log(`[email]   subject: ${subject}`);
    console.log(`[email]   html:    ${html.length} chars (preview suppressed)`);
    return { id: null, dryRun: true };
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from, to, subject, html });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  return { id: result.data?.id ?? null, dryRun: false };
}
