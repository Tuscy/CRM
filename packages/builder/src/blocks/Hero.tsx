import type { HeroContent } from "@stky/sites";

export function HeroBlock({ content }: { content: HeroContent }) {
  return (
    <section className="relative overflow-hidden rounded-xl border bg-muted/30 px-6 py-16 md:py-24">
      {content.imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${content.imageUrl})` }}
          aria-hidden
        />
      ) : null}
      <div className="relative mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{content.headline}</h1>
        {content.subheadline ? (
          <p className="mt-4 text-lg text-muted-foreground">{content.subheadline}</p>
        ) : null}
      </div>
    </section>
  );
}
