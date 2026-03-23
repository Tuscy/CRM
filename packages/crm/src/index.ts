/** Shared CRM constants / filters (pure, no DB). */

export const DEAL_STAGES = ["NEW", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "LOST"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
