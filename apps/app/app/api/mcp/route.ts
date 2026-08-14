import { NextRequest, NextResponse } from "next/server";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { prisma } from "@stky/db";
import { requireAutomationAuth } from "@/lib/api-auth";
import { ApiScope } from "@/lib/api-scopes";

/**
 * MCP server for the CRM's personal to-do list — read and write tools over
 * the same Task model the REST /api/tasks routes and the dashboard UI use.
 *
 * Auth is gated once per request on ApiScope.TASKS_WRITE (not per-tool),
 * since this endpoint exists specifically to give a caller both read and
 * write access — a read-only key should use GET /api/tasks instead.
 */
const mcpHandler = createMcpHandler((server) => {
  server.registerTool(
    "list_tasks",
    {
      title: "List CRM tasks",
      description:
        "List tasks from the StickySites CRM to-do list, optionally filtered by completion status, lead, or assignee.",
      inputSchema: z.object({
        completed: z.boolean().optional(),
        leadId: z.string().optional(),
        assigneeId: z.string().optional(),
      }),
    },
    async ({ completed, leadId, assigneeId }) => {
      const tasks = await prisma.task.findMany({
        where: {
          ...(completed !== undefined && { completed }),
          ...(leadId && { leadId }),
          ...(assigneeId && { assigneeId }),
        },
        include: {
          lead: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
      });
      return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] };
    }
  );

  server.registerTool(
    "create_task",
    {
      title: "Create a CRM task",
      description:
        "Create a new task on the StickySites CRM to-do list. Leave leadId unset for a standalone task not tied to a client.",
      inputSchema: z.object({
        title: z.string().min(1),
        leadId: z.string().optional(),
        dueDate: z.string().optional().describe("ISO date string, e.g. 2026-08-20"),
        assigneeId: z.string().optional(),
      }),
    },
    async ({ title, leadId, dueDate, assigneeId }) => {
      const task = await prisma.task.create({
        data: {
          title: title.trim(),
          leadId: leadId ?? undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          assigneeId: assigneeId ?? undefined,
        },
        include: {
          lead: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
      return { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] };
    }
  );

  server.registerTool(
    "complete_task",
    {
      title: "Complete or reopen a CRM task",
      description: "Mark a CRM task as completed (or reopen it) by task ID.",
      inputSchema: z.object({
        taskId: z.string(),
        completed: z.boolean().default(true),
      }),
    },
    async ({ taskId, completed }) => {
      const existing = await prisma.task.findUnique({ where: { id: taskId } });
      if (!existing) {
        return {
          content: [{ type: "text", text: `Task ${taskId} not found.` }],
          isError: true,
        };
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: { completed },
      });

      // Same false → true trigger as the dashboard toggle and the REST route.
      if (task.leadId && task.completed && !existing.completed) {
        const { enrolMatchingFlows } = await import("@/lib/email-flows/trigger");
        await enrolMatchingFlows("TASK_COMPLETED", { leadId: task.leadId });
      }

      return { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] };
    }
  );

  server.registerTool(
    "delete_task",
    {
      title: "Delete a CRM task",
      description: "Permanently delete a task from the StickySites CRM by task ID.",
      inputSchema: z.object({
        taskId: z.string(),
      }),
    },
    async ({ taskId }) => {
      try {
        await prisma.task.delete({ where: { id: taskId } });
        return { content: [{ type: "text", text: `Deleted task ${taskId}.` }] };
      } catch (error) {
        if ((error as { code?: string })?.code === "P2025") {
          return {
            content: [{ type: "text", text: `Task ${taskId} not found.` }],
            isError: true,
          };
        }
        throw error;
      }
    }
  );
});

async function authedHandler(request: NextRequest) {
  if (
    !(await requireAutomationAuth(request, "MCP /api/mcp", ApiScope.TASKS_WRITE))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return mcpHandler(request);
}

export { authedHandler as GET, authedHandler as POST };
