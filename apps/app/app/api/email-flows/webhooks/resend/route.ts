/**
 * POST /api/email-flows/webhooks/resend
 *
 * Receives Resend delivery events and stamps the matching EmailFlowSend record
 * (matched on resendMessageId === data.email_id).
 *
 * If RESEND_WEBHOOK_SECRET is set, the request is verified using Resend's
 * Svix-style signature scheme. Without the secret, events are accepted (dev).
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@stky/db";
import { logStky } from "@/lib/observability";

export const dynamic = "force-dynamic";

type ResendEvent = {
  type: string;
  created_at?: string;
  data?: { email_id?: string };
};

const EVENT_FIELD: Record<string, "deliveredAt" | "openedAt" | "clickedAt" | "bouncedAt" | "complainedAt"> = {
  "email.delivered": "deliveredAt",
  "email.opened": "openedAt",
  "email.clicked": "clickedAt",
  "email.bounced": "bouncedAt",
  "email.complained": "complainedAt",
};

/** Verifies a Resend (Svix) webhook signature over the raw body. */
function verifySvix(rawBody: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true; // not configured — accept (dev)

  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatureHeader = headers.get("svix-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  // Secret format: "whsec_<base64>"; sign with the decoded bytes.
  const key = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const keyBytes = Buffer.from(key, "base64");
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", keyBytes)
    .update(signedContent)
    .digest("base64");

  // Header is space-separated "v1,<sig>" pairs — accept if any matches.
  return signatureHeader.split(" ").some((part) => {
    const sig = part.includes(",") ? part.split(",")[1] : part;
    if (!sig || sig.length !== expected.length) return false;
    try {
      return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!verifySvix(rawBody, request.headers)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(rawBody) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const field = EVENT_FIELD[event.type];
  const messageId = event.data?.email_id;
  if (!field || !messageId) {
    // Unknown event type or missing id — acknowledge so Resend doesn't retry.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const at = event.created_at ? new Date(event.created_at) : new Date();

  const result = await prisma.emailFlowSend.updateMany({
    where: { resendMessageId: messageId },
    data: { [field]: at },
  });

  if (result.count === 0) {
    logStky("flow_resend_webhook_unmatched", { type: event.type, messageId });
  }

  return NextResponse.json({ ok: true, updated: result.count });
}
