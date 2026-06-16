/**
 * Compiles an EmailFlow's step list into an n8n workflow JSON document.
 *
 * Design: n8n owns *orchestration* (the webhook trigger, timed Wait nodes, and
 * the ordering of steps). All side effects — sending email via Resend, creating
 * tasks, marking completion — are delegated back to the CRM through an HTTP
 * callback to `/api/email-flows/internal/step-complete`. This keeps the Resend
 * API key and DB writes server-side rather than embedding secrets in n8n.
 *
 * The callback carries only `{ enrollmentId, stepIndex }`; the CRM looks up the
 * step from the enrollment's flow and performs the right action. The webhook
 * path is a UUID generated here and embedded on the Webhook trigger node.
 */

import { randomUUID } from "crypto";
import type { FlowStep, WaitUnit } from "./types";

function crmBaseUrl(): string {
  const url =
    process.env.CRM_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    "";
  return url.replace(/\/$/, "");
}

function internalSecret(): string {
  return process.env.EMAIL_FLOWS_INTERNAL_SECRET ?? "";
}

const STEP_COMPLETE_PATH = "/api/email-flows/internal/step-complete";

type N8nNode = {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  webhookId?: string;
  notes?: string;
};

type N8nConnections = Record<
  string,
  { main: Array<Array<{ node: string; type: "main"; index: number }>> }
>;

export type CompiledFlow = {
  workflow: {
    name: string;
    nodes: N8nNode[];
    connections: N8nConnections;
    settings: Record<string, unknown>;
  };
  webhookPath: string;
};

const N8N_WAIT_UNIT: Record<WaitUnit, string> = {
  hours: "hours",
  days: "days",
  weeks: "weeks",
};

function webhookNode(path: string): N8nNode {
  return {
    id: randomUUID(),
    name: "Webhook",
    type: "n8n-nodes-base.webhook",
    typeVersion: 2,
    position: [240, 300],
    webhookId: path,
    parameters: {
      httpMethod: "POST",
      path,
      responseMode: "onReceived",
      options: {},
    },
  };
}

function waitNode(index: number, x: number, duration: number, unit: WaitUnit): N8nNode {
  return {
    id: randomUUID(),
    name: `Wait ${index + 1}`,
    type: "n8n-nodes-base.wait",
    typeVersion: 1.1,
    position: [x, 300],
    parameters: {
      resume: "timeInterval",
      amount: duration,
      unit: N8N_WAIT_UNIT[unit],
    },
  };
}

function callbackNode(index: number, x: number, label: string): N8nNode {
  const body = `={{ JSON.stringify({ enrollmentId: $('Webhook').item.json.body.enrollmentId, stepIndex: ${index} }) }}`;
  return {
    id: randomUUID(),
    name: `${label} ${index + 1}`,
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [x, 300],
    parameters: {
      method: "POST",
      url: `${crmBaseUrl()}${STEP_COMPLETE_PATH}`,
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "x-internal-secret", value: internalSecret() },
        ],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: body,
      options: {},
    },
  };
}

function conditionStubNode(index: number, x: number): N8nNode {
  // TODO: Condition branching is stubbed for v1 (linear sequences only).
  // The real IF node + Yes/No branch routing lands with the visual canvas
  // (Phase H). For now the condition is a labelled pass-through so existing
  // linear flows compile and run unchanged.
  return {
    id: randomUUID(),
    name: `Condition ${index + 1}`,
    type: "n8n-nodes-base.noOp",
    typeVersion: 1,
    position: [x, 300],
    notes: "Condition branching not yet evaluated (v1 stub — pass-through).",
    parameters: {},
  };
}

/**
 * Builds the n8n workflow for a flow. Pass `existingWebhookPath` when
 * re-compiling an already-activated flow to keep its public URL stable.
 */
export function compileFlow(
  flow: { name: string; steps: FlowStep[] },
  existingWebhookPath?: string | null
): CompiledFlow {
  const webhookPath = existingWebhookPath || randomUUID();
  const nodes: N8nNode[] = [];
  const connections: N8nConnections = {};

  const trigger = webhookNode(webhookPath);
  nodes.push(trigger);

  let prevName = trigger.name;
  let x = 460;

  flow.steps.forEach((step, index) => {
    let node: N8nNode;
    switch (step.type) {
      case "WAIT":
        node = waitNode(index, x, step.duration, step.unit);
        break;
      case "CONDITION":
        node = conditionStubNode(index, x);
        break;
      case "EMAIL":
        node = callbackNode(index, x, "Email");
        break;
      case "TASK":
        node = callbackNode(index, x, "Task");
        break;
      case "END":
        node = callbackNode(index, x, "End");
        break;
    }
    nodes.push(node);
    connections[prevName] = {
      main: [[{ node: node.name, type: "main", index: 0 }]],
    };
    prevName = node.name;
    x += 220;
  });

  return {
    workflow: {
      name: `Email Flow: ${flow.name}`,
      nodes,
      connections,
      settings: { executionOrder: "v1" },
    },
    webhookPath,
  };
}
