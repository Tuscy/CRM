"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import {
  updateSiteBuildStage,
  updateSiteBuildStatus,
} from "@/lib/server/actions/site-builds";

const STAGES = [
  "Brief & Config",
  "Design Import",
  "Content Setup",
  "Build",
  "QA & Review",
  "Launch",
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
  PAUSED: "Paused",
};

const STATUS_OPTIONS = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETE",
  "PAUSED",
] as const;

type BuildProps = {
  id: string;
  clientId: string;
  clientName: string;
  projectName: string;
  repoName: string | null;
  figmaUrl: string | null;
  contentMode: string;
  sanityProjectId: string | null;
  sanityDataset: string | null;
  requiredRoutes: string | null;
  notes: string | null;
  status: string;
  currentStage: number;
  createdByName: string;
  createdAt: string;
};

function buildKickoffPrompt(build: BuildProps): string {
  const routes = build.requiredRoutes
    ? build.requiredRoutes
        .split(/[\n,]+/)
        .map((r) => r.trim())
        .filter(Boolean)
        .join(", ")
    : "to be defined";

  const cmsPart =
    build.contentMode === "SANITY"
      ? `Content is managed in Sanity CMS (project ID: ${build.sanityProjectId ?? "TBD"}, dataset: ${build.sanityDataset ?? "production"}).`
      : "Content is hardcoded locally (no CMS).";

  const figmaPart = build.figmaUrl
    ? `Figma designs: ${build.figmaUrl}`
    : "Figma designs: not yet linked — check with the designer.";

  const repoPart = build.repoName
    ? `Repository: ${build.repoName}`
    : "Repository: not yet created — create under the organisation.";

  const notesPart = build.notes
    ? `\n\nAdditional notes:\n${build.notes}`
    : "";

  return `# Site Build Kickoff — ${build.projectName}

## Client
${build.clientName}

## Project
- **Project name:** ${build.projectName}
- **${repoPart}**
- **${figmaPart}**

## Content
${cmsPart}

## Required routes
${routes}

## Build runbook (Figma-first)
Work through the following stages in order. Advance the stage tracker in the CRM when each is complete.

**Stage 1 — Brief & Config**
- Confirm all fields above with the account manager
- Create the repo if it doesn't exist
- Set up local dev environment and confirm Next.js app boots

**Stage 2 — Design Import**
- Import Figma frames into the codebase using the approved component library
- Match spacing, typography, and colour tokens exactly
- Get sign-off from the designer before proceeding

**Stage 3 — Content Setup**
${build.contentMode === "SANITY" ? `- Configure Sanity studio schemas matching the required routes\n- Seed initial content for all pages` : "- Populate all page content from the brief\n- Confirm copy with the client"}

**Stage 4 — Build**
- Implement all required routes: ${routes}
- Wire up forms, CTA flows, and any integrations
- Ensure responsive layout across mobile, tablet, and desktop

**Stage 5 — QA & Review**
- Run Lighthouse (target 90+ on all scores)
- Cross-browser check (Chrome, Safari, Firefox)
- Accessibility pass (keyboard nav, ARIA labels, colour contrast)
- Share staging URL with client for approval

**Stage 6 — Launch**
- Point DNS / configure custom domain
- Confirm SSL, redirects, and analytics tracking
- Final sign-off and handover${notesPart}
`;
}

export function SiteBuildDetail({ build: initialBuild }: { build: BuildProps }) {
  const [build, setBuild] = useState(initialBuild);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const prompt = buildKickoffPrompt(build);

  function handleCopyPrompt() {
    void navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSetStage(stage: number) {
    startTransition(async () => {
      try {
        const updated = await updateSiteBuildStage(build.id, stage);
        setBuild((prev) => ({ ...prev, currentStage: updated.currentStage }));
        toast.success(`Stage advanced to: ${STAGES[updated.currentStage]}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update stage");
      }
    });
  }

  function handleSetStatus(status: (typeof STATUS_OPTIONS)[number]) {
    startTransition(async () => {
      try {
        const updated = await updateSiteBuildStatus(build.id, status);
        setBuild((prev) => ({ ...prev, status: updated.status }));
        toast.success(`Status updated to: ${STATUS_LABELS[updated.status]}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update status");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/dashboard/clients/${build.clientId}?tab=site-builds`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to {build.clientName} / Site Builds
        </Link>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold">{build.projectName}</h1>
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {STATUS_LABELS[build.status] ?? build.status}
          </span>
        </div>
        {build.repoName && (
          <p className="text-sm text-muted-foreground font-mono mt-0.5">
            {build.repoName}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Created by {build.createdByName} ·{" "}
          {new Date(build.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Stage tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stage tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="flex flex-col gap-2">
            {STAGES.map((label, i) => {
              const isComplete = i < build.currentStage;
              const isCurrent = i === build.currentStage;
              return (
                <li
                  key={i}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                    isCurrent
                      ? "bg-primary/10 text-foreground font-medium"
                      : isComplete
                      ? "text-muted-foreground line-through"
                      : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? "✓" : i + 1}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {build.currentStage > 0 && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleSetStage(build.currentStage - 1)}
              >
                ← Back a stage
              </Button>
            )}
            {build.currentStage < STAGES.length - 1 && (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleSetStage(build.currentStage + 1)}
              >
                Advance to stage {build.currentStage + 2} →
              </Button>
            )}
            {build.currentStage === STAGES.length - 1 && (
              <p className="text-sm text-muted-foreground self-center">
                All stages complete.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status + actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={build.status === s ? "default" : "outline"}
                disabled={isPending || build.status === s}
                onClick={() => handleSetStatus(s)}
              >
                {STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Build config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Build config</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="font-medium">Content mode</span>
              <p className="text-muted-foreground">
                {build.contentMode === "SANITY" ? "Sanity CMS" : "Local (hardcoded)"}
              </p>
            </div>
            {build.figmaUrl && (
              <div>
                <span className="font-medium">Figma</span>
                <p className="text-muted-foreground">
                  <a
                    href={build.figmaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground truncate block"
                  >
                    {build.figmaUrl}
                  </a>
                </p>
              </div>
            )}
            {build.sanityProjectId && (
              <div>
                <span className="font-medium">Sanity project</span>
                <p className="text-muted-foreground font-mono">
                  {build.sanityProjectId}
                  {build.sanityDataset ? ` / ${build.sanityDataset}` : ""}
                </p>
              </div>
            )}
          </div>
          {build.requiredRoutes && (
            <div>
              <span className="font-medium">Required routes</span>
              <p className="text-muted-foreground whitespace-pre-wrap mt-0.5">
                {build.requiredRoutes}
              </p>
            </div>
          )}
          {build.notes && (
            <div>
              <span className="font-medium">Notes</span>
              <p className="text-muted-foreground whitespace-pre-wrap mt-0.5">
                {build.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kickoff prompt generator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kickoff prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Generates a pre-filled build brief from the config above. Copy and
            paste into your AI assistant or project notes to kick off the build.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowPrompt((v) => !v)}
            >
              {showPrompt ? "Hide prompt" : "Generate kickoff prompt"}
            </Button>
            {showPrompt && (
              <Button size="sm" variant="outline" onClick={handleCopyPrompt}>
                {copied ? "Copied!" : "Copy to clipboard"}
              </Button>
            )}
          </div>
          {showPrompt && (
            <pre className="mt-2 rounded-md border border-border bg-muted/50 p-4 text-xs whitespace-pre-wrap overflow-x-auto font-mono">
              {prompt}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Automated build — coming soon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Automated build</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Trigger a fully automated site build pipeline from config. Currently
            in development.
          </p>
          <div title="Automated builds coming soon">
            <Button size="sm" disabled>
              Run automated build
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
