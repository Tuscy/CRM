/**
 * Shared types for Email Flow steps — the shape stored as JSON in
 * `EmailFlow.steps` and consumed by the editor UI and the n8n compiler.
 */

export type WaitUnit = "hours" | "days" | "weeks";

export type ConditionOperator = "eq" | "neq" | "contains";

export type EmailStep = {
  type: "EMAIL";
  templateId: string | null;
  fromName?: string;
};

export type WaitStep = {
  type: "WAIT";
  duration: number;
  unit: WaitUnit;
};

export type ConditionStep = {
  type: "CONDITION";
  field: string;
  operator: ConditionOperator;
  value: string;
  yesBranch: FlowStep[];
  noBranch: FlowStep[];
};

export type TaskStep = {
  type: "TASK";
  title: string;
  assigneeId: string | null;
  dueOffsetDays: number;
};

export type EndStep = {
  type: "END";
};

export type FlowStep =
  | EmailStep
  | WaitStep
  | ConditionStep
  | TaskStep
  | EndStep;

export type FlowStepType = FlowStep["type"];

export const STEP_TYPE_LABELS: Record<FlowStepType, string> = {
  EMAIL: "Email",
  WAIT: "Wait",
  CONDITION: "Condition",
  TASK: "Task",
  END: "End",
};

/** Factory for a fresh step of the given type with sensible defaults. */
export function makeDefaultStep(type: FlowStepType): FlowStep {
  switch (type) {
    case "EMAIL":
      return { type: "EMAIL", templateId: null };
    case "WAIT":
      return { type: "WAIT", duration: 2, unit: "days" };
    case "CONDITION":
      return {
        type: "CONDITION",
        field: "lead.status",
        operator: "eq",
        value: "",
        yesBranch: [{ type: "END" }],
        noBranch: [],
      };
    case "TASK":
      return { type: "TASK", title: "", assigneeId: null, dueOffsetDays: 0 };
    case "END":
      return { type: "END" };
  }
}

/**
 * Walks a step list (including condition branches) and yields every EMAIL step's
 * templateId. Used to find which templates a flow references.
 */
export function collectTemplateIds(steps: FlowStep[]): string[] {
  const ids: string[] = [];
  const walk = (list: FlowStep[]) => {
    for (const step of list) {
      if (step.type === "EMAIL" && step.templateId) {
        ids.push(step.templateId);
      } else if (step.type === "CONDITION") {
        walk(step.yesBranch);
        walk(step.noBranch);
      }
    }
  };
  walk(steps);
  return ids;
}

/** Safely coerces an unknown JSON value into a FlowStep[]. */
export function parseSteps(value: unknown): FlowStep[] {
  if (!Array.isArray(value)) return [];
  return value as FlowStep[];
}
