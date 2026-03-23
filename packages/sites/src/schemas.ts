import { z } from "zod";

/** Section `type` values (lowercase) — keys must match `sectionMap` in @stky/builder */
export const sectionTypeKeys = ["hero", "cta", "text"] as const;
export type SectionTypeKey = (typeof sectionTypeKeys)[number];

export const heroContentSchema = z.object({
  headline: z.string(),
  subheadline: z.string().optional(),
  imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
});

export type HeroContent = z.infer<typeof heroContentSchema>;

export const ctaContentSchema = z.object({
  title: z.string(),
  body: z.string().optional(),
  buttonLabel: z.string(),
  href: z.string(),
});

export type CtaContent = z.infer<typeof ctaContentSchema>;

export const textContentSchema = z.object({
  heading: z.string().optional(),
  body: z.string(),
  align: z.enum(["left", "center", "right"]).optional(),
});

export type TextContent = z.infer<typeof textContentSchema>;

export const siteBrandingSchema = z
  .object({
    logoUrl: z.string().optional(),
    primaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
  })
  .passthrough();

export type SiteBranding = z.infer<typeof siteBrandingSchema>;

export const siteConfigSchema = z.record(z.unknown()).optional();

export type ParsedSection =
  | { type: "hero"; content: HeroContent }
  | { type: "cta"; content: CtaContent }
  | { type: "text"; content: TextContent }
  | { type: "unknown"; originalType: string; content: Record<string, unknown> };

export function parseSectionContent(
  type: string,
  content: unknown
): { success: true; data: ParsedSection } | { success: false; error: z.ZodError } {
  const t = type.toLowerCase();
  switch (t) {
    case "hero": {
      const r = heroContentSchema.safeParse(content);
      return r.success
        ? { success: true, data: { type: "hero", content: r.data } }
        : { success: false, error: r.error };
    }
    case "cta": {
      const r = ctaContentSchema.safeParse(content);
      return r.success
        ? { success: true, data: { type: "cta", content: r.data } }
        : { success: false, error: r.error };
    }
    case "text": {
      const r = textContentSchema.safeParse(content);
      return r.success
        ? { success: true, data: { type: "text", content: r.data } }
        : { success: false, error: r.error };
    }
    default:
      return {
        success: true,
        data: {
          type: "unknown",
          originalType: t,
          content: typeof content === "object" && content !== null ? (content as Record<string, unknown>) : {},
        },
      };
  }
}

export function defaultContentForType(type: SectionTypeKey): unknown {
  switch (type) {
    case "hero":
      return { headline: "New headline", subheadline: "" };
    case "cta":
      return { title: "Call to action", body: "", buttonLabel: "Get started", href: "#" };
    case "text":
      return { heading: "", body: "Add your copy here.", align: "left" };
    default:
      return {};
  }
}
