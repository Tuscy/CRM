"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@stky/ui";
import { createEmailFlow } from "@/lib/email-flows/flows";

export function NewFlowButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const flow = await createEmailFlow();
        router.push(`/dashboard/email-flows/${flow.id}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to create flow");
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      {pending ? "Creating…" : "New flow"}
    </Button>
  );
}
