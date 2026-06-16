/**
 * POST /api/email-flows/internal/step-complete
 *
 * Called by n8n once per side-effecting step. The body carries only
 * { enrollmentId, stepIndex } — this endpoint looks up the step from the
 * enrollment's flow and performs the action server-side (so the Resend key and
 * DB writes stay in the CRM), records an EmailFlowSend for email steps, advances
 * currentStep, and marks the enrollment COMPLETED on the final step.
 *
 * Secured by a shared secret header (x-internal-secret) matching
 * EMAIL_FLOWS_INTERNAL_SECRET. n8n is the only caller.
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { prisma } from "@stky/db";
import { logStky } from "@/lib/observability";
import { parseSteps } from "@/lib/email-flows/types";
import { renderTemplate } from "@/lib/email-flows/template-utils";
import { sendFlowEmail } from "@/lib/email-flows/send";

export const dynamic = "force-dynamic";

function secretOk(request: NextRequest): boolean {
  const expected = process.env.EMAIL_FLOWS_INTERNAL_SECRET;
  if (!expected) {
    // No secret configured — allow (dev) but warn so it's visible in logs.
    logStky("flow_internal_secret_unset", {});
    return true;
  }
  const provided = request.headers.get("x-internal-secret") ?? "";
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!secretOk(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { enrollmentId?: string; stepIndex?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const enrollmentId = body.enrollmentId;
  const stepIndex = Number(body.stepIndex);
  if (!enrollmentId || !Number.isInteger(stepIndex) || stepIndex < 0) {
    return NextResponse.json(
      { error: "enrollmentId and a valid stepIndex are required" },
      { status: 400 }
    );
  }

  const enrollment = await prisma.emailFlowEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { flow: true },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  // Ignore callbacks for enrollments that are no longer running.
  if (enrollment.status !== "ACTIVE") {
    return NextResponse.json({ ok: true, skipped: enrollment.status });
  }

  const steps = parseSteps(enrollment.flow.steps);
  const step = steps[stepIndex];
  if (!step) {
    return NextResponse.json({ error: "Step not found" }, { status: 400 });
  }

  const snapshot =
    (enrollment.contactSnapshot as Record<string, unknown> | null) ?? {};

  try {
    if (step.type === "EMAIL" && step.templateId) {
      const template = await prisma.emailFlowTemplate.findUnique({
        where: { id: step.templateId },
      });
      if (template) {
        const rendered = renderTemplate(template, snapshot);
        const to = typeof snapshot.email === "string" ? snapshot.email : null;
        if (to) {
          const result = await sendFlowEmail({
            to,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
            fromName: step.fromName ?? null,
          });
          await prisma.emailFlowSend.create({
            data: {
              enrollmentId: enrollment.id,
              stepIndex,
              subject: rendered.subject,
              resendMessageId: result.ok ? result.messageId : null,
            },
          });
          if (!result.ok) {
            logStky("flow_step_email_failed", {
              enrollmentId,
              stepIndex,
              error: result.error,
            });
          }
        } else {
          logStky("flow_step_email_no_address", { enrollmentId, stepIndex });
        }
      }
    } else if (step.type === "TASK") {
      // Tasks attach to leads (schema), so only create for lead enrollments.
      if (enrollment.leadId) {
        const dueDate =
          step.dueOffsetDays > 0
            ? new Date(Date.now() + step.dueOffsetDays * 86_400_000)
            : null;
        await prisma.task.create({
          data: {
            leadId: enrollment.leadId,
            title: step.title || "Follow-up",
            assigneeId: step.assigneeId || null,
            dueDate: dueDate ?? undefined,
          },
        });
      } else {
        logStky("flow_step_task_skipped_no_lead", { enrollmentId, stepIndex });
      }
    }
  } catch (e) {
    logStky("flow_step_action_failed", {
      enrollmentId,
      stepIndex,
      type: step.type,
      error: e instanceof Error ? e.message : "unknown",
    });
  }

  // Advance progress; complete on the final step or an explicit END.
  const isFinal = step.type === "END" || stepIndex >= steps.length - 1;
  await prisma.emailFlowEnrollment.update({
    where: { id: enrollment.id },
    data: {
      currentStep: stepIndex + 1,
      ...(isFinal
        ? { status: "COMPLETED", completedAt: new Date() }
        : {}),
    },
  });

  return NextResponse.json({ ok: true, completed: isFinal });
}
