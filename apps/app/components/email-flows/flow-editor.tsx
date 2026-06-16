"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Card, CardContent } from "@stky/ui";
import type { EmailFlowTrigger } from "@stky/db";
import { updateEmailFlow } from "@/lib/email-flows/flows";
import {
  STEP_TYPE_LABELS,
  makeDefaultStep,
  type FlowStep,
  type FlowStepType,
} from "@/lib/email-flows/types";
import { FlowActivation } from "./flow-activation";

const inputClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const labelClass = "text-sm font-medium";

const TRIGGERS: { value: EmailFlowTrigger; label: string }[] = [
  { value: "LEAD_CREATED", label: "Lead created" },
  { value: "LEAD_STATUS_CHANGED", label: "Lead status changed" },
  { value: "DEAL_CREATED", label: "Deal created" },
  { value: "DEAL_STAGE_CHANGED", label: "Deal stage changed" },
  { value: "CLIENT_CREATED", label: "Client created" },
  { value: "TASK_COMPLETED", label: "Task completed" },
  { value: "MANUAL", label: "Manual only" },
];

const STEP_TYPES: FlowStepType[] = ["EMAIL", "WAIT", "CONDITION", "TASK", "END"];

const STEP_BADGE: Record<FlowStepType, string> = {
  EMAIL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  WAIT: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  CONDITION:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  TASK: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  END: "bg-muted text-muted-foreground",
};

type FlowData = {
  id: string;
  name: string;
  description: string | null;
  trigger: EmailFlowTrigger;
  triggerConfig: Record<string, unknown> | null;
  steps: FlowStep[];
  active: boolean;
  n8nWorkflowId: string | null;
};

export function FlowEditor({
  flow,
  templates,
  staff,
}: {
  flow: FlowData;
  templates: { id: string; name: string }[];
  staff: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState(flow.name);
  const [description, setDescription] = useState(flow.description ?? "");
  const [trigger, setTrigger] = useState<EmailFlowTrigger>(flow.trigger);
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(
    flow.triggerConfig ?? {}
  );
  const [steps, setSteps] = useState<FlowStep[]>(flow.steps);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function updateStep(index: number, next: FlowStep) {
    setSteps((prev) => prev.map((s, i) => (i === index ? next : s)));
  }

  function addStep(type: FlowStepType) {
    setSteps((prev) => [...prev, makeDefaultStep(type)]);
    setExpanded(steps.length);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
    setExpanded(null);
  }

  function moveStep(from: number, to: number) {
    if (from === to) return;
    setSteps((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function setTriggerConfigKey(key: string, value: string) {
    setTriggerConfig((prev) => {
      const next = { ...prev };
      if (value.trim() === "") delete next[key];
      else next[key] = value.trim();
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Flow name is required");
      return;
    }
    setSaving(true);
    try {
      await updateEmailFlow(flow.id, {
        name: name.trim(),
        description: description.trim() || null,
        trigger,
        triggerConfig: Object.keys(triggerConfig).length ? triggerConfig : null,
        steps,
      });
      toast.success("Flow saved");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save flow");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/dashboard/email-flows"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to flows
        </Link>
      </div>

      {/* Flow metadata */}
      <Card>
        <CardContent className="space-y-4 py-5">
          <div>
            <label className={labelClass} htmlFor="flow-name">
              Flow name
            </label>
            <input
              id="flow-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="flow-desc">
              Description
            </label>
            <input
              id="flow-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — what this sequence does"
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="flow-trigger">
                Trigger
              </label>
              <select
                id="flow-trigger"
                value={trigger}
                onChange={(e) =>
                  setTrigger(e.target.value as EmailFlowTrigger)
                }
                className={inputClass}
              >
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {trigger === "DEAL_STAGE_CHANGED" && (
              <div>
                <label className={labelClass} htmlFor="tc-stage">
                  Only when stage becomes
                </label>
                <input
                  id="tc-stage"
                  value={(triggerConfig.stage as string) ?? ""}
                  onChange={(e) => setTriggerConfigKey("stage", e.target.value)}
                  placeholder="e.g. QUOTED (blank = any stage)"
                  className={inputClass}
                />
              </div>
            )}
            {trigger === "LEAD_STATUS_CHANGED" && (
              <div>
                <label className={labelClass} htmlFor="tc-status">
                  Only when status becomes
                </label>
                <input
                  id="tc-status"
                  value={(triggerConfig.status as string) ?? ""}
                  onChange={(e) => setTriggerConfigKey("status", e.target.value)}
                  placeholder="e.g. CONTACTED (blank = any status)"
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Steps</h2>
        {steps.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No steps yet. Add your first step below.
          </p>
        )}

        {steps.map((step, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) moveStep(dragIndex, index);
              setDragIndex(null);
            }}
            className={dragIndex === index ? "opacity-50" : ""}
          >
            <StepCard
              step={step}
              index={index}
              expanded={expanded === index}
              onToggle={() =>
                setExpanded((prev) => (prev === index ? null : index))
              }
              onChange={(next) => updateStep(index, next)}
              onRemove={() => removeStep(index)}
              templates={templates}
              staff={staff}
            />
          </div>
        ))}

        <AddStepMenu onAdd={addStep} />
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save draft"}
        </Button>
        <FlowActivation
          flowId={flow.id}
          active={flow.active}
          hasSteps={steps.length > 0}
        />
      </div>
    </div>
  );
}

function AddStepMenu({ onAdd }: { onAdd: (type: FlowStepType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen((v) => !v)}>
        + Add step
      </Button>
      {open && (
        <div className="absolute z-10 mt-1 w-40 rounded-md border border-border bg-background shadow-md">
          {STEP_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onAdd(type);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
            >
              {STEP_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StepCard({
  step,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
  templates,
  staff,
}: {
  step: FlowStep;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (next: FlowStep) => void;
  onRemove: () => void;
  templates: { id: string; name: string }[];
  staff: { id: string; label: string }[];
}) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          <span
            className="cursor-grab select-none text-muted-foreground"
            title="Drag to reorder"
          >
            ⠿
          </span>
          <span className="text-xs font-medium text-muted-foreground w-12">
            Step {index + 1}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STEP_BADGE[step.type]}`}
          >
            {STEP_TYPE_LABELS[step.type]}
          </span>
          <span className="flex-1 truncate text-sm text-muted-foreground">
            {stepSummary(step, templates)}
          </span>
          {step.type !== "END" && (
            <Button variant="outline" size="sm" onClick={onToggle}>
              {expanded ? "Done" : "Edit"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>

        {expanded && step.type !== "END" && (
          <div className="mt-3 border-t border-border pt-3">
            <StepConfig
              step={step}
              onChange={onChange}
              templates={templates}
              staff={staff}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function stepSummary(
  step: FlowStep,
  templates: { id: string; name: string }[]
): string {
  switch (step.type) {
    case "EMAIL": {
      const tpl = templates.find((t) => t.id === step.templateId);
      return tpl ? `Send "${tpl.name}"` : "No template selected";
    }
    case "WAIT":
      return `Wait ${step.duration} ${step.unit}`;
    case "CONDITION":
      return `If ${step.field} ${step.operator} "${step.value}"`;
    case "TASK":
      return step.title ? `Create task: ${step.title}` : "Create task";
    case "END":
      return "End of flow";
  }
}

function StepConfig({
  step,
  onChange,
  templates,
  staff,
}: {
  step: FlowStep;
  onChange: (next: FlowStep) => void;
  templates: { id: string; name: string }[];
  staff: { id: string; label: string }[];
}) {
  if (step.type === "EMAIL") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Template</label>
          <select
            value={step.templateId ?? ""}
            onChange={(e) =>
              onChange({ ...step, templateId: e.target.value || null })
            }
            className={inputClass}
          >
            <option value="">Select a template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {templates.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              No templates yet —{" "}
              <Link
                href="/dashboard/email-flows/templates/new"
                className="underline"
              >
                create one
              </Link>
              .
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>From name (optional)</label>
          <input
            value={step.fromName ?? ""}
            onChange={(e) => onChange({ ...step, fromName: e.target.value })}
            placeholder="e.g. StickySites"
            className={inputClass}
          />
        </div>
      </div>
    );
  }

  if (step.type === "WAIT") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Duration</label>
          <input
            type="number"
            min={1}
            value={step.duration}
            onChange={(e) =>
              onChange({ ...step, duration: Math.max(1, Number(e.target.value)) })
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Unit</label>
          <select
            value={step.unit}
            onChange={(e) =>
              onChange({
                ...step,
                unit: e.target.value as "hours" | "days" | "weeks",
              })
            }
            className={inputClass}
          >
            <option value="hours">Hours</option>
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
          </select>
        </div>
      </div>
    );
  }

  if (step.type === "CONDITION") {
    const trueEnds = step.yesBranch.some((s) => s.type === "END");
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Field</label>
            <input
              value={step.field}
              onChange={(e) => onChange({ ...step, field: e.target.value })}
              placeholder="lead.status"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Operator</label>
            <select
              value={step.operator}
              onChange={(e) =>
                onChange({
                  ...step,
                  operator: e.target.value as "eq" | "neq" | "contains",
                })
              }
              className={inputClass}
            >
              <option value="eq">is</option>
              <option value="neq">is not</option>
              <option value="contains">contains</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Value</label>
            <input
              value={step.value}
              onChange={(e) => onChange({ ...step, value: e.target.value })}
              placeholder="CONTACTED"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>When condition is true</label>
          <select
            value={trueEnds ? "end" : "continue"}
            onChange={(e) =>
              onChange({
                ...step,
                yesBranch: e.target.value === "end" ? [{ type: "END" }] : [],
                noBranch: [],
              })
            }
            className={inputClass}
          >
            <option value="end">End the flow</option>
            <option value="continue">Continue to next step</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Nested branches are coming with the visual canvas. For now a
            condition either ends the flow or lets it continue.
          </p>
        </div>
      </div>
    );
  }

  if (step.type === "TASK") {
    return (
      <div className="space-y-3">
        <div>
          <label className={labelClass}>Task title</label>
          <input
            value={step.title}
            onChange={(e) => onChange({ ...step, title: e.target.value })}
            placeholder="e.g. Manual follow-up call"
            className={inputClass}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Assign to</label>
            <select
              value={step.assigneeId ?? ""}
              onChange={(e) =>
                onChange({ ...step, assigneeId: e.target.value || null })
              }
              className={inputClass}
            >
              <option value="">Unassigned</option>
              {staff.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Due offset (days)</label>
            <input
              type="number"
              min={0}
              value={step.dueOffsetDays}
              onChange={(e) =>
                onChange({
                  ...step,
                  dueOffsetDays: Math.max(0, Number(e.target.value)),
                })
              }
              className={inputClass}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
