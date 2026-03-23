"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@stky/db";

export async function getDealsByStage() {
  const deals = await prisma.deal.findMany({
    include: { lead: true },
    orderBy: { createdAt: "desc" },
  });
  return deals;
}

export async function updateDealStage(dealId: string, stage: string) {
  const deal = await prisma.deal.update({
    where: { id: dealId },
    data: { stage },
    include: { lead: true },
  });
  revalidatePath("/dashboard/pipeline");
  revalidatePath("/dashboard");
  return deal;
}

export async function createDeal(leadId: string, stage: string, value?: number) {
  const deal = await prisma.deal.create({
    data: { leadId, stage, value },
    include: { lead: true },
  });
  revalidatePath("/dashboard/pipeline");
  revalidatePath("/dashboard");
  return deal;
}
