/** Shared CRM constants / filters (pure, no DB). */

export const PIPELINE_STAGES = [
  "NEW_LEAD",
  "QUALIFIED",
  "DISCOVERY_CALL",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  NEW_LEAD: "New Lead",
  QUALIFIED: "Qualified",
  DISCOVERY_CALL: "Discovery Call",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "LOST",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** @deprecated Use PIPELINE_STAGES — kept for integrations that expect DEAL_STAGES */
export const DEAL_STAGES = PIPELINE_STAGES;
export type DealStage = PipelineStage;

export function isValidDealStage(s: string): s is PipelineStage {
  return (PIPELINE_STAGES as readonly string[]).includes(s);
}

export function isValidLeadStatus(s: string): s is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(s);
}
