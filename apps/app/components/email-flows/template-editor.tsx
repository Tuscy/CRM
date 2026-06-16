"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { EmailEditorProps } from "react-email-editor";
import { Button } from "@stky/ui";
import {
  createEmailTemplate,
  updateEmailTemplate,
} from "@/lib/email-flows/templates";
import {
  detectVariables,
  embedDesign,
  extractDesign,
  stripDesign,
} from "@/lib/email-flows/template-utils";

// react-email-editor touches `window` on load — render it client-side only.
// next/dynamic does not forward refs, so we capture the Unlayer instance from
// the onReady callback instead of via a component ref.
const EmailEditor = dynamic(() => import("react-email-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-md border border-border text-sm text-muted-foreground">
      Loading editor…
    </div>
  ),
});

type Unlayer = Parameters<NonNullable<EmailEditorProps["onReady"]>>[0];

const inputClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const labelClass = "text-sm font-medium";

type InitialTemplate = {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  variables: string[];
};

export function TemplateEditor({
  initial,
}: {
  initial: InitialTemplate | null;
}) {
  const router = useRouter();
  const unlayerRef = useRef<Unlayer | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [textBody, setTextBody] = useState(initial?.textBody ?? "");
  const [variables, setVariables] = useState<string[]>(initial?.variables ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onReady: EmailEditorProps["onReady"] = (unlayer) => {
    unlayerRef.current = unlayer;
    if (initial) {
      const design = extractDesign(initial.htmlBody);
      if (design) {
        unlayer.loadDesign(design as Parameters<typeof unlayer.loadDesign>[0]);
      }
    }
  };

  function handleSave() {
    const unlayer = unlayerRef.current;
    if (!unlayer) {
      toast.error("Editor still loading — try again in a moment");
      return;
    }
    if (!name.trim()) {
      setError("Template name is required");
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }

    setSaving(true);
    setError(null);

    unlayer.exportHtml(async (data) => {
      try {
        const cleanHtml = stripDesign(data.html ?? "");
        const htmlBody = embedDesign(cleanHtml, data.design);
        const detected = detectVariables(cleanHtml, subject, textBody);
        setVariables(detected);

        const payload = {
          name: name.trim(),
          subject: subject.trim(),
          htmlBody,
          textBody: textBody.trim() || null,
        };

        if (initial) {
          await updateEmailTemplate(initial.id, payload);
          toast.success("Template saved");
          router.refresh();
        } else {
          const created = await createEmailTemplate(payload);
          toast.success("Template created");
          router.push(`/dashboard/email-flows/templates/${created.id}`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to save template";
        setError(msg);
        toast.error(msg);
      } finally {
        setSaving(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/email-flows/templates"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to templates
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : initial ? "Save template" : "Create template"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="tpl-name">
            Template name *
          </label>
          <input
            id="tpl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lead Welcome"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="tpl-subject">
            Subject line *
          </label>
          <input
            id="tpl-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Welcome to {{company}}"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="tpl-text">
          Plain-text fallback
        </label>
        <textarea
          id="tpl-text"
          value={textBody}
          onChange={(e) => setTextBody(e.target.value)}
          rows={3}
          placeholder="Plain-text version for clients that block HTML…"
          className={inputClass}
        />
      </div>

      {variables.length > 0 && (
        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium">Detected variables:</span>{" "}
          {variables.map((v) => (
            <code
              key={v}
              className="mr-1 rounded bg-background px-1 py-0.5 font-mono"
            >
              {`{{${v}}}`}
            </code>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Type <code className="font-mono">{`{{variableName}}`}</code> anywhere in
        the email (subject or body) to insert contact data at send time.
        Variables are detected automatically when you save.
      </p>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-md border border-border">
        <EmailEditor onReady={onReady} minHeight="600px" />
      </div>
    </div>
  );
}
