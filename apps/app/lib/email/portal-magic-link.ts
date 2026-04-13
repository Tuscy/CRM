import { logStky } from "@/lib/observability";

/** Sends magic link via Resend. If RESEND_API_KEY is unset, logs the URL in development only. */
export async function sendPortalMagicLink(params: {
  email: string;
  verifyUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      logStky("portal_magic_link_dev", {
        email: params.email,
        verifyUrl: params.verifyUrl,
      });
      return { ok: true };
    }
    logStky("portal_magic_link_misconfigured", {});
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
      to: [params.email],
      subject: "Your client portal sign-in link",
      html: `<p>Click to sign in to your client portal (link expires in 15 minutes):</p><p><a href="${params.verifyUrl}">Sign in</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logStky("portal_magic_link_send_failed", { status: res.status });
    return { ok: false, error: text || `Email send failed (${res.status})` };
  }

  return { ok: true };
}
