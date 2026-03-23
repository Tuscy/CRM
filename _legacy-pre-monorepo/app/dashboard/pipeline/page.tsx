import { getDealsByStage } from "@/lib/server/actions/deals";
import { PipelineKanban } from "@/components/crm/pipeline-kanban";

export default async function PipelinePage() {
  const deals = await getDealsByStage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pipeline</h1>
      <p className="text-muted-foreground text-sm">
        Move deals between stages using the menu on each card.
      </p>
      <PipelineKanban deals={deals} />
    </div>
  );
}
