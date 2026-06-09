import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { prisma } from "@stky/db";
import { notifyLeadCreated } from "@/lib/crm/webhook-events";

export const dynamic = "force-dynamic";

type LeadWebhookBody = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  message?: string;
};

function verifySecret(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const provided = request.headers.get("x-webhook-secret") ?? "";
  if (!verifySecret(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: LeadWebhookBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!name || !email || !email.includes("@")) {
    return NextResponse.json(
      { error: "name and a valid email are required" },
      { status: 400 }
    );
  }

  const phone = body.phone?.trim() || null;
  const message = body.message?.trim() || null;

  const lead = await prisma.lead.create({
    data: {
      name,
      email,
      phone,
      company: body.company?.trim() || null,
      source: body.source?.trim() || null,
      status: "NEW",
      ...(message
        ? {
            notes: {
              create: {
                content: phone
                  ? `${message}\n\nPhone: ${phone}`
                  : message,
              },
            },
          }
        : phone
          ? {
              notes: {
                create: { content: `Phone: ${phone}` },
              },
            }
          : {}),
    },
    include: { deals: true, notes: true },
  });

  await notifyLeadCreated(lead);

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
