import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { prisma } from "@stky/db";

/**
 * MCP server for the CRM's personal to-do list — built specifically for the
 * Cowork "Add custom connector" flow, which only supports OAuth or no auth,
 * nowhere to put a static Authorization header. So instead of a real key,
 * this route is gated on two things together:
 *
 *   1. An unguessable secret baked into the URL path itself (MCP_TASKS_SECRET
 *      env var). Not a query param — those get logged by proxies/browsers,
 *      the MCP auth spec explicitly warns against them.
 *   2. The request must originate from Anthropic's published MCP egress
 *      range (160.79.104.0/21). This alone is NOT per-user — it's shared by
 *      every Claude/Cowork user — so it only matters combined with #1.
 *
 * Deliberately minimal output: list_tasks returns only id/title/dueDate/
 * completed, never lead or assignee names/IDs, since this endpoint has no
 * per-user scoping the way the API-key-gated /api/tasks REST route does.
 * If you need lead/assignee detail, use the REST route with a real key.
 */

const ANTHROPIC_MCP_CIDR = "160.79.104.0/21";

function ipToInt(ip: string): number {
  return (
    ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + (parseInt(octet, 10) & 0xff), 0) >>> 0
  );
}

function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = parseInt(bitsStr, 10);
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
}

function clientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const raw = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  if (!raw) return null;
  return raw.replace(/^::ffff:/, "");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

const mcpHandler = createMcpHandler((server) => {
  server.registerTool(
    "list_tasks",
    {
      title: "List CRM tasks",
      description:
        "List tasks from the StickySites CRM to-do list, optionally filtered by completion status. Returns id, title, due date, and completion status only — no lead or assignee detail.",
      inputSchema: z.object({
        completed: z.boolean().optional(),
      }),
    },
    async ({ completed }) => {
      const tasks = await prisma.task.findMany({
        where: { ...(completed !== undefined && { completed }) },
        select: { id: true, title: true, dueDate: true, completed: true },
        orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
      });
      return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] };
    }
  );

  server.registerTool(
    "create_task",
    {
      title: "Create a CRM task",
      description: "Create a new standalone task on the StickySites CRM to-do list.",
      inputSchema: z.object({
        title: z.string().min(1),
        dueDate: z.string().optional().describe("ISO date string, e.g. 2026-08-20"),
      }),
    },
    async ({ title, dueDate }) => {
      const task = await prisma.task.create({
        data: {
          title: title.trim(),
          dueDate: dueDate ? new Date(dueDate) : undefined,
        },
        select: { id: true, title: true, dueDate: true, completed: true },
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
      const existing = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, completed: true, leadId: true },
      });
      if (!existing) {
        return {
          content: [{ type: "text", text: `Task ${taskId} not found.` }],
          isError: true,
        };
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: { completed },
        select: { id: true, title: true, dueDate: true, completed: true, leadId: true },
      });

      // Same false → true trigger as the dashboard toggle and the REST route
      // — leadId is read only to decide whether to fire this, never returned.
      if (task.leadId && task.completed && !existing.completed) {
        const { enrolMatchingFlows } = await import("@/lib/email-flows/trigger");
        await enrolMatchingFlows("TASK_COMPLETED", { leadId: task.leadId });
      }

      const { leadId: _leadId, ...safeTask } = task;
      return { content: [{ type: "text", text: JSON.stringify(safeTask, null, 2) }] };
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

async function guardedHandler(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const expected = process.env.MCP_TASKS_SECRET;
  const { secret } = await params;

  // Fail closed if the env var isn't set — never fall open to "no secret required".
  if (!expected || !timingSafeEqualStr(secret, expected)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ip = clientIp(request);
  if (!ip || !ipInCidr(ip, ANTHROPIC_MCP_CIDR)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return mcpHandler(request);
}

export { guardedHandler as GET, guardedHandler as POST };
