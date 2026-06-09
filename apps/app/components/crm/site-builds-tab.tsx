"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { CreateSiteBuildForm } from "./create-site-build-form";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
  PAUSED: "Paused",
};

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  COMPLETE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PAUSED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

const STAGE_LABELS = [
  "Brief & Config",
  "Design Import",
  "Content Setup",
  "Build",
  "QA & Review",
  "Launch",
];

type SiteBuild = {
  id: string;
  projectName: string;
  repoName: string | null;
  status: string;
  currentStage: number;
  createdAt: Date;
  createdBy: { name: string | null; email: string };
};

type Props = {
  clientId: string;
  siteBuilds: SiteBuild[];
};

export function SiteBuildsTab({ clientId, siteBuilds }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {siteBuilds.length === 0
            ? "No site builds yet."
            : `${siteBuilds.length} build${siteBuilds.length !== 1 ? "s" : ""}`}
        </p>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            New build
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New site build</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateSiteBuildForm
              clientId={clientId}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {siteBuilds.length > 0 && (
        <div className="space-y-3">
          {siteBuilds.map((build) => (
            <Link
              key={build.id}
              href={`/dashboard/clients/${clientId}/site-builds/${build.id}`}
              className="block group"
            >
              <Card className="transition-colors group-hover:border-ring">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium truncate">{build.projectName}</p>
                    {build.repoName && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {build.repoName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Stage {build.currentStage + 1}/6:{" "}
                      {STAGE_LABELS[build.currentStage] ?? "Unknown"} · Added by{" "}
                      {build.createdBy.name ?? build.createdBy.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_CLASSES[build.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABELS[build.status] ?? build.status}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
