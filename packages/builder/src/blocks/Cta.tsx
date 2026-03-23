import type { CtaContent } from "@stky/sites";
import { Button } from "@stky/ui";

export function CtaBlock({ content }: { content: CtaContent }) {
  return (
    <section className="rounded-xl border bg-card p-8 text-center shadow-sm">
      <h2 className="text-2xl font-semibold">{content.title}</h2>
      {content.body ? <p className="mt-2 text-muted-foreground">{content.body}</p> : null}
      <div className="mt-6">
        <Button asChild>
          <a href={content.href}>{content.buttonLabel}</a>
        </Button>
      </div>
    </section>
  );
}
