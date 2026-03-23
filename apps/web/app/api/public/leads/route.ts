import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stky/db";

/**
 * Public lead capture for rendered sites (`apps/web`).
 * POST JSON: { siteId, name, email, company?, message?, source? }
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { siteId, name, email, company, source } = body as Record<string, unknown>;

  if (typeof siteId !== "string" || typeof name !== "string" || typeof email !== "string") {
    return NextResponse.json({ error: "siteId, name, and email are required" }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    return NextResponse.json({ error: "Unknown site" }, { status: 404 });
  }

  await prisma.lead.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: typeof company === "string" ? company : undefined,
      clientId: site.clientId,
      siteId: site.id,
      source: typeof source === "string" ? source : "SITE_FORM",
      status: "NEW",
    },
  });

  return NextResponse.json({ ok: true });
}
