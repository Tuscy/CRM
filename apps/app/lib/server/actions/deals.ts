"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@stky/db";
import { isValidDealStage } from "@stky/crm";
import {
  notifyDealCreated,
  notifyDealUpdated,
} from "@/lib/crm/webhook-events";

export async function getDealsByStage() {
  const deals = await prisma.deal.findMany({
    include: { lead: true },
    orderBy: { createdAt: "desc" },
  });
  return deals;
}

export async function updateDealStage(dealId: string, stage: string) {
  if (!isValidDealStage(stage)) {
    throw new Error("Invalid deal stage");
  }
  const existing = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { lead: true },
  });
  if (!existing) {
    throw new Error("Deal not found");
  }
  const deal = await prisma.deal.update({
    where: { id: dealId },
    data: { stage },
    include: { lead: true },
  });
  await notifyDealUpdated(deal, existing.stage);
  revalidatePath("/dashboard/pipeline");
  revalidatePath("/dashboard");
  return deal;
}

export async function createDeal(leadId: string, stage: string, value?: number) {
  if (!isValidDealStage(stage)) {
    throw new Error("Invalid deal stage");
  }
  const deal = await prisma.deal.create({
    data: { leadId, stage, value },
    include: { lead: true },
  });
  await notifyDealCreated(deal);
  revalidatePath("/dashboard/pipeline");
  revalidatePath("/dashboard");
  return deal;
}
