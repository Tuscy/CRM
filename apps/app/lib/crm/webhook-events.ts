import type { Deal, Lead } from "@stky/db";
import { dispatchCrmWebhook } from "@/lib/webhooks/dispatch";

export async function notifyLeadCreated(lead: Lead) {
  await dispatchCrmWebhook("lead.created", {
    leadId: lead.id,
    lead,
  });
}

export async function notifyDealCreated(
  deal: Deal & { lead: Lead }
) {
  await dispatchCrmWebhook("deal.created", {
    dealId: deal.id,
    leadId: deal.leadId,
    deal,
  });
}

export async function notifyDealUpdated(
  deal: Deal & { lead: Lead },
  previousStage: string
) {
  await dispatchCrmWebhook("deal.updated", {
    dealId: deal.id,
    leadId: deal.leadId,
    previousStage,
    deal,
  });
}
