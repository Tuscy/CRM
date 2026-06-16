"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@stky/ui";
import {
  activateEmailFlow,
  pauseEmailFlow,
  testEmailFlow,
} from "@/lib/email-flows/activation";

export function FlowActivation({
  flowId,
  active,
  hasSteps,
}: {
  flowId: string;
  active: boolean;
  hasSteps: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(
    fn: () => Promise<unknown>,
    success: string
  ) {
    startTransition(async () => {
      try {
        await fn();
        toast.success(success);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {active ? (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => run(() => pauseEmailFlow(flowId), "Flow paused")}
        >
          {pending ? "Working…" : "Pause"}
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled={pending || !hasSteps}
          title={hasSteps ? undefined : "Add at least one step first"}
          onClick={() =>
            run(
              () => activateEmailFlow(flowId),
              "Flow activated — save your draft first if you made changes"
            )
          }
        >
          {pending ? "Working…" : "Activate"}
        </Button>
      )}
      <Button
        variant="outline"
        disabled={pending || !hasSteps}
        title="Sends the first email step to your own address"
        onClick={() => run(() => testEmailFlow(flowId), "Test email sent")}
      >
        Test
      </Button>
    </div>
  );
}
