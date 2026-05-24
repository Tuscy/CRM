"use server";

import { revalidatePath } from "next/cache";
import { prisma, Prisma } from "@stky/db";

const BILLING_PERIODS = ["monthly", "annual", "quarterly", "one-time"] as const;

export type CreateClientInput = {
  name: string;
  companyName?: string;
  companiesHouseNumber?: string;
  industry?: string;
  services?: string;
  primaryContactEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  billingPeriod?: string;
  billingPrice?: string | number;
  billingCurrency?: string;
  billingNotes?: string;
};

export type UpdateClientInput = Partial<CreateClientInput>;

function validateCreateInput(data: CreateClientInput) {
  const name = data.name?.trim();
  if (!name) {
    throw new Error("Name is required");
  }

  const email = data.primaryContactEmail?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("A valid primary contact email is required");
  }

  const billingPeriod = data.billingPeriod?.trim();
  if (billingPeriod && !BILLING_PERIODS.includes(billingPeriod as (typeof BILLING_PERIODS)[number])) {
    throw new Error("Invalid billing period");
  }

  let billingPrice: Prisma.Decimal | null = null;
  if (data.billingPrice !== undefined && data.billingPrice !== null && data.billingPrice !== "") {
    const raw = String(data.billingPrice).trim();
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) {
      throw new Error("Billing price must be a valid non-negative number");
    }
    billingPrice = new Prisma.Decimal(raw);
  }

  const companiesHouseNumber = data.companiesHouseNumber?.trim() || null;

  return {
    name,
    companyName: data.companyName?.trim() || null,
    companiesHouseNumber,
    industry: data.industry?.trim() || null,
    services: data.services?.trim() || null,
    primaryContactEmail: email,
    contactPhone: data.contactPhone?.trim() || null,
    contactAddress: data.contactAddress?.trim() || null,
    billingPeriod: billingPeriod || null,
    billingPrice,
    billingCurrency: data.billingCurrency?.trim() || "USD",
    billingNotes: data.billingNotes?.trim() || null,
  };
}

export async function getClients() {
  return prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { leads: true, memberships: true, analytics: true } },
    },
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      leads: true,
      memberships: { include: { user: true } },
      analytics: true,
      googleAdsConnections: true,
    },
  });
}

export async function createClient(data: CreateClientInput) {
  const validated = validateCreateInput(data);
  const client = await prisma.client.create({ data: validated });
  revalidatePath("/dashboard/clients");
  return client;
}

export async function updateClient(id: string, data: UpdateClientInput) {
  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.companyName !== undefined && {
        companyName: data.companyName.trim() || null,
      }),
      ...(data.companiesHouseNumber !== undefined && {
        companiesHouseNumber: data.companiesHouseNumber.trim() || null,
      }),
      ...(data.industry !== undefined && { industry: data.industry.trim() || null }),
      ...(data.services !== undefined && { services: data.services.trim() || null }),
      ...(data.primaryContactEmail !== undefined && {
        primaryContactEmail: data.primaryContactEmail.trim().toLowerCase(),
      }),
      ...(data.contactPhone !== undefined && {
        contactPhone: data.contactPhone.trim() || null,
      }),
      ...(data.contactAddress !== undefined && {
        contactAddress: data.contactAddress.trim() || null,
      }),
      ...(data.billingPeriod !== undefined && {
        billingPeriod: data.billingPeriod.trim() || null,
      }),
      ...(data.billingCurrency !== undefined && {
        billingCurrency: data.billingCurrency.trim() || null,
      }),
      ...(data.billingNotes !== undefined && {
        billingNotes: data.billingNotes.trim() || null,
      }),
      ...(data.billingPrice !== undefined && {
        billingPrice:
          data.billingPrice === "" || data.billingPrice === null
            ? null
            : new Prisma.Decimal(String(data.billingPrice)),
      }),
    },
  });
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return client;
}
