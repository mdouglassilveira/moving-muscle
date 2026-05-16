import { formatCurrency } from "@/lib/utils";
import type { BookingFormInput } from "@/lib/schemas/booking";

interface RenderArgs {
  requestNumber: string;
  input: BookingFormInput;
  totalPrice: number;
}

export function renderBookingConfirmationEmail({
  requestNumber,
  input,
  totalPrice
}: RenderArgs) {
  const subject = "Booking Request Received";

  const dateStr = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  const primaryAddress = input.addresses[0]?.formatted ?? "";
  const serviceLabel = SERVICE_LABELS[input.service_type];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} - Moving Muscle</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f6f8;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

          <tr>
            <td align="center" style="padding: 36px 40px 24px 40px;">
              <img src="https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/jeREtmUweqaIJ1Ozr5m2/pub/d9C8hWggfD2z3DhwC39R.png" alt="Moving Muscle" width="180" style="display: block; max-width: 180px; height: auto;" />
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 0 40px 8px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #e8f7f5; border-radius: 20px; padding: 6px 18px;">
                    <span style="font-size: 13px; font-weight: 600; color: #3cd3d6; letter-spacing: 0.5px;">REQUEST #${requestNumber}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 12px 40px 8px 40px;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #1a2332; line-height: 1.3;">Booking Request Received</h1>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 0 40px 32px 40px;">
              <p style="margin: 0; font-size: 15px; color: #6b7a8d; line-height: 1.5;">We've received your request and our team is on it. This is <strong style="color: #1a2332;">not yet a confirmed booking</strong> — we'll be in touch shortly to finalize the details.</p>
            </td>
          </tr>

          <tr><td style="padding: 0 40px;"><div style="border-top: 1px solid #e9edf1;"></div></td></tr>

          <tr>
            <td style="padding: 28px 40px 8px 40px;">
              <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: #1a2332; text-transform: uppercase; letter-spacing: 0.8px;">Your Request Details</h2>
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 40px 28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fb; border-radius: 10px;">
                ${row("Name", input.customer.name)}
                ${divider()}
                ${row("Service", serviceLabel)}
                ${divider()}
                ${row("Requested Date & Time", dateStr)}
                ${divider()}
                ${row("Address", primaryAddress)}
                ${divider()}
                ${twoColRow("Movers", String(input.helpers), "Hours", String(input.hours))}
                ${divider()}
                ${priceRow(totalPrice)}
              </table>
            </td>
          </tr>

          <tr><td style="padding: 0 40px;"><div style="border-top: 1px solid #e9edf1;"></div></td></tr>

          <tr>
            <td style="padding: 28px 40px 8px 40px;">
              <h2 style="margin: 0; font-size: 14px; font-weight: 700; color: #1a2332; text-transform: uppercase; letter-spacing: 0.8px;">Next Steps</h2>
            </td>
          </tr>

          ${stepRow("✓", "Request submitted", "We have your details and preferred time.", true)}
          ${connector()}
          ${stepRow("2", "Searching for available movers", "We're matching you with movers in your area. You'll get text updates.", false)}
          ${connector()}
          ${stepRow("3", "You'll hear from us within 1 hour", "Your moving concierge will call to confirm availability and finalize your booking.", false)}

          <tr><td style="padding: 32px 40px 0 40px;"><div style="border-top: 1px solid #e9edf1;"></div></td></tr>

          <tr>
            <td align="center" style="padding: 24px 40px 12px 40px;">
              <p style="margin: 0; font-size: 15px; color: #1a2332; font-weight: 600;">Have questions?</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 32px 40px;">
              <p style="margin: 0; font-size: 14px; color: #6b7a8d; line-height: 1.5;">Call or text us at <a href="tel:9809203022" style="color: #3cd3d6; text-decoration: none; font-weight: 600;">(980) 920-3022</a></p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fb; padding: 24px 40px; border-top: 1px solid #e9edf1;">
              <p style="margin: 0; font-size: 12px; color: #8d99a8; line-height: 1.6; text-align: center;">
                Moving Muscle &bull; Charlotte<br/>
                <a href="https://www.getmovingmuscle.com/" style="color: #3cd3d6; text-decoration: none;">getmovingmuscle.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

const SERVICE_LABELS = {
  load_only: "Load Only",
  unload_only: "Unload Only",
  load_and_unload: "Load & Unload",
  in_home_help: "In-Home Moving Help"
} as const;

function row(label: string, value: string) {
  return `
    <tr><td style="padding: 16px 20px 0 20px;">
      <div style="font-size: 12px; font-weight: 600; color: #8d99a8; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">${escape(label)}</div>
      <div style="font-size: 15px; color: #1a2332; font-weight: 500;">${escape(value)}</div>
    </td></tr>`;
}

function twoColRow(l1: string, v1: string, l2: string, v2: string) {
  return `
    <tr><td style="padding: 12px 20px 0 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="50%" valign="top">
            <div style="font-size: 12px; font-weight: 600; color: #8d99a8; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">${escape(l1)}</div>
            <div style="font-size: 15px; color: #1a2332; font-weight: 500;">${escape(v1)}</div>
          </td>
          <td width="50%" valign="top">
            <div style="font-size: 12px; font-weight: 600; color: #8d99a8; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">${escape(l2)}</div>
            <div style="font-size: 15px; color: #1a2332; font-weight: 500;">${escape(v2)}</div>
          </td>
        </tr>
      </table>
    </td></tr>`;
}

function priceRow(total: number) {
  return `
    <tr><td style="padding: 12px 20px 16px 20px;">
      <div style="font-size: 12px; font-weight: 600; color: #8d99a8; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px;">Estimated Price</div>
      <div style="font-size: 20px; color: #3cd3d6; font-weight: 700;">${formatCurrency(total)}</div>
    </td></tr>`;
}

function divider() {
  return `<tr><td style="padding: 12px 20px 0 20px;"><div style="border-top: 1px solid #e3e7ec;"></div></td></tr>`;
}

function stepRow(badge: string, title: string, body: string, done: boolean) {
  const badgeBg = done ? "#3cd3d6" : "#e8f7f5";
  const badgeColor = done ? "#ffffff" : "#3cd3d6";
  const titleColor = done ? "#3cd3d6" : "#1a2332";
  return `
    <tr><td style="padding: 16px 40px 0 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="40" valign="top" style="padding-top: 2px;">
            <div style="width: 32px; height: 32px; background-color: ${badgeBg}; border-radius: 8px; text-align: center; line-height: 32px; font-size: 15px; font-weight: 700; color: ${badgeColor};">${badge}</div>
          </td>
          <td style="padding-left: 12px;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: ${titleColor};">${escape(title)}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #8d99a8; line-height: 1.4;">${escape(body)}</p>
          </td>
        </tr>
      </table>
    </td></tr>`;
}

function connector() {
  return `
    <tr><td style="padding: 0 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="40" align="center"><div style="width: 2px; height: 20px; background-color: #e3e7ec; margin: 0 auto;"></div></td>
          <td></td>
        </tr>
      </table>
    </td></tr>`;
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
