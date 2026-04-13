"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@stky/db";
import type { Prisma } from "@stky/db";
import { isValidLeadStatus } from "@stky/crm";
import { notifyLeadCreated } from "@/lib/crm/webhook-events";

export type CreateLeadInput = {
  name: string;
  email: string;
  company?: string;
  website?: string;
  source?: string;
  status?: string;
};

export type UpdateLeadInput = Partial<CreateLeadInput>;

export async function createLead(data: CreateLeadInput) {
  const status = data.status ?? "NEW";
  if (!isValidLeadStatus(status)) {
    throw new Error("Invalid lead status");
  }
  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email,
      company: data.company,
      website: data.website,
      source: data.source,
      status,
    },
    include: { deals: true },
  });
  await notifyLeadCreated(lead);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/pipeline");
  return lead;
}

export async function getLeads(filters?: {
  status?: string;
  source?: string;
  q?: string;
}) {
  const where: Prisma.LeadWhereInput = {
    ...(filters?.status && { status: filters.status }),
    ...(filters?.source && { source: filters.source }),
    ...(filters?.q?.trim() && {
      OR: [
        { name: { contains: filters.q.trim(), mode: "insensitive" } },
        { email: { contains: filters.q.trim(), mode: "insensitive" } },
        {
          company: { contains: filters.q.trim(), mode: "insensitive" },
        },
      ],
    }),
  };

  return prisma.lead.findMany({
    where,
    include: {
      deals: true,
      _count: { select: { tasks: true, notes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      deals: true,
      tasks: true,
      notes: true,
    },
  });
}

export async function updateLead(id: string, data: UpdateLeadInput) {
  if (data.status !== undefined && !isValidLeadStatus(data.status)) {
    throw new Error("Invalid lead status");
  }
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.company !== undefined && { company: data.company }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.source !== undefined && { source: data.source }),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: { deals: true, tasks: true, notes: true },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/leads/" + id);
  revalidatePath("/dashboard/pipeline");
  return lead;
}

export async function deleteLead(id: string) {
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/pipeline");
}
