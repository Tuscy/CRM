/**
 * Pure helpers for email templates — safe to import from both server and client
 * code (no "use server" directive, no DB access).
 */

/**
 * Scans a body of text (HTML and/or subject) for `{{ variableName }}` patterns
 * and returns the unique, ordered list of declared variable names.
 *
 * Matches: {{name}}, {{ company }}, {{lead.status}} — allows letters, digits,
 * underscore and dot, with optional surrounding whitespace.
 */
export function detectVariables(...sources: string[]): string[] {
  const pattern = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
  const seen = new Set<string>();
  for (const source of sources) {
    if (!source) continue;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      seen.add(match[1]);
    }
  }
  return Array.from(seen);
}

/**
 * Substitutes `{{ var }}` placeholders in a string using a flat data object.
 * Supports dotted keys (e.g. `{{lead.status}}`) by also trying the literal key.
 * Unknown variables are replaced with an empty string.
 */
export function substituteVariables(
  input: string,
  data: Record<string, unknown>
): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_full, key: string) => {
    const value =
      key in data
        ? data[key]
        : // allow dotted key like "lead.name" to resolve "name" too
          data[key.split(".").pop() ?? key];
    return value == null ? "" : String(value);
  });
}

/**
 * The Unlayer editor needs its "design" JSON to reopen a template for editing,
 * but the schema only stores a single HTML column. We persist the design as a
 * base64 marker comment appended to the HTML, and strip it before sending.
 */
const DESIGN_MARKER = /\n?<!--unlayer-design:([A-Za-z0-9+/=]+)-->\s*$/;

export function embedDesign(html: string, design: unknown): string {
  const encoded =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(JSON.stringify(design))))
      : Buffer.from(JSON.stringify(design), "utf8").toString("base64");
  return `${stripDesign(html)}\n<!--unlayer-design:${encoded}-->`;
}

export function extractDesign(html: string): unknown | null {
  const match = html.match(DESIGN_MARKER);
  if (!match) return null;
  try {
    const json =
      typeof atob === "function"
        ? decodeURIComponent(escape(atob(match[1])))
        : Buffer.from(match[1], "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Removes the embedded Unlayer design marker so only clean HTML is sent. */
export function stripDesign(html: string): string {
  return html.replace(DESIGN_MARKER, "");
}

export type RenderedTemplate = {
  subject: string;
  html: string;
  text: string | null;
};

/**
 * Renders a template against a contact data snapshot, substituting all
 * `{{ var }}` placeholders in the subject, HTML body and text body.
 */
export function renderTemplate(
  template: { subject: string; htmlBody: string; textBody: string | null },
  data: Record<string, unknown>
): RenderedTemplate {
  return {
    subject: substituteVariables(template.subject, data),
    html: substituteVariables(stripDesign(template.htmlBody), data),
    text: template.textBody ? substituteVariables(template.textBody, data) : null,
  };
}
