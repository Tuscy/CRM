import { parseSectionContent } from "@stky/sites";
import { HeroBlock } from "./blocks/Hero";
import { CtaBlock } from "./blocks/Cta";
import { TextBlock } from "./blocks/Text";
import { UnknownSection } from "./blocks/UnknownSection";

/** Matches Prisma `Section` fields used for rendering */
export type SectionRow = {
  id: string;
  type: string;
  content: unknown;
  order: number;
};

export type SectionRendererProps = {
  sections: SectionRow[];
  dev?: boolean;
};

export function SectionRenderer({ sections, dev }: SectionRendererProps) {
  const isDev = dev ?? (typeof process !== "undefined" && process.env.NODE_ENV === "development");
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-8">
      {sorted.map((section) => {
        const parsed = parseSectionContent(section.type, section.content);
        if (!parsed.success) {
          return (
            <UnknownSection
              key={section.id}
              type={`${section.type} (invalid JSON)`}
              dev={isDev}
            />
          );
        }
        const { data } = parsed;

        switch (data.type) {
          case "hero":
            return <HeroBlock key={section.id} content={data.content} />;
          case "cta":
            return <CtaBlock key={section.id} content={data.content} />;
          case "text":
            return <TextBlock key={section.id} content={data.content} />;
          default:
            return <UnknownSection key={section.id} type={data.originalType} dev={isDev} />;
        }
      })}
    </div>
  );
}
