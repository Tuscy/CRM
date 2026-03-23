"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getClients() {
  return prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { leads: true, clientUsers: true, analytics: true } },
    },
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      leads: true,
      clientUsers: true,
      analytics: true,
    },
  });
}

export async function createClient(data: {
  name: string;
  primaryContactEmail: string;
}) {
  const client = await prisma.client.create({
    data: {
      name: data.name,
      primaryContactEmail: data.primaryContactEmail,
    },
  });
  revalidatePath("/dashboard/clients");
  return client;
}

export async function updateClient(
  id: string,
  data: Partial<{ name: string; primaryContactEmail: string }>
) {
  const client = await prisma.client.update({
    where: { id },
    data,
  });
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return client;
}

