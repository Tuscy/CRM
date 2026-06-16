import { logStky } from "@/lib/observability";

export type SendFlowEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string | null;
  fromName?: string | null;
};

export type SendFlowEmailResult =
  | { ok: true; messageId: string | null }
  | { ok: false; error: string };

/**
 * Sends a flow email through Resend and returns the Resend message id (used to
 * match delivery/open/click webhooks back to the EmailFlowSend record).
 * Mirrors the existing portal-magic-link send conventions.
 */
export async function sendFlowEmail(
  input: SendFlowEmailInput
): Promise<SendFlowEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const from = input.fromName ? `${input.fromName} <${fromEmail}>` : fromEmail;

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      logStky("flow_email_dev", { to: input.to, subject: input.subject });
      return { ok: true, messageId: null };
    }
    return {
      ok: false,
      error: "Email is not configured. Set RESEND_API_KEY on the server.",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.text ? { text: input.text } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logStky("flow_email_send_failed", { status: res.status });
    return { ok: false, error: text || `Email send failed (${res.status})` };
  }

  const json = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true, messageId: json.id ?? null };
}
