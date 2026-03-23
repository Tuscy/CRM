import type { HeroContent, CtaContent, TextContent } from "@stky/sites";
import { HeroBlock } from "./blocks/Hero";
import { CtaBlock } from "./blocks/Cta";
import { TextBlock } from "./blocks/Text";

export type SectionPropsMap = {
  hero: { content: HeroContent };
  cta: { content: CtaContent };
  text: { content: TextContent };
};

/** Registry keyed by section `type` (lowercase). */
export const sectionMap = {
  hero: HeroBlock,
  cta: CtaBlock,
  text: TextBlock,
} as const;
