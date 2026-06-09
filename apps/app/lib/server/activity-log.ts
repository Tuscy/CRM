import { prisma } from "@stky/db";

export async function logActivity(input: {
  clientId: string;
  type: string;
  body?: string | null;
  actorId: string;
}) {
  return prisma.activityLog.create({
    data: {
      clientId: input.clientId,
      type: input.type,
      body: input.body?.trim() || null,
      actorId: input.actorId,
    },
  });
}
