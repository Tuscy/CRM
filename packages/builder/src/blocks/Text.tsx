import type { TextContent } from "@stky/sites";
import { cn } from "@stky/ui";

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function TextBlock({ content }: { content: TextContent }) {
  const align = content.align ?? "left";
  return (
    <section className={cn("prose prose-neutral dark:prose-invert max-w-none", alignClass[align])}>
      {content.heading ? <h2 className="mb-4 text-2xl font-semibold">{content.heading}</h2> : null}
      <div className="whitespace-pre-wrap text-muted-foreground">{content.body}</div>
    </section>
  );
}
