"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@stky/db";
import { enrolMatchingFlows } from "@/lib/email-flows/trigger";

export async function createTask(
  leadId: string,
  title: string,
  opts?: { dueDate?: Date; assigneeId?: string }
) {
  const task = await prisma.task.create({
    data: {
      leadId,
      title,
      dueDate: opts?.dueDate,
      assigneeId: opts?.assigneeId || null,
    },
  });
  revalidatePath(`/dashboard/leads/${leadId}`);
  return task;
}

export async function toggleTaskCompleted(taskId: string, leadId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { completed: !task.completed },
  });
  // Fire only on the false → true transition.
  if (updated.completed && !task.completed) {
    await enrolMatchingFlows("TASK_COMPLETED", { leadId: updated.leadId });
  }
  revalidatePath(`/dashboard/leads/${leadId}`);
  return updated;
}

export async function getStaffUsers() {
  return prisma.user.findMany({
    where: { isStaff: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}
