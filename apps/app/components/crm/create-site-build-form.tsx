"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@stky/ui";
import { createSiteBuild } from "@/lib/server/actions/site-builds";

const inputClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const labelClass = "text-sm font-medium";

type Props = { clientId: string; onCancel: () => void };

export function CreateSiteBuildForm({ clientId, onCancel }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentMode, setContentMode] = useState<"LOCAL" | "SANITY">("LOCAL");

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const build = await createSiteBuild(clientId, {
        projectName: formData.get("projectName") as string,
        repoName: (formData.get("repoName") as string) || undefined,
        figmaUrl: (formData.get("figmaUrl") as string) || undefined,
        contentMode,
        sanityProjectId:
          contentMode === "SANITY"
            ? ((formData.get("sanityProjectId") as string) || undefined)
            : undefined,
        sanityDataset:
          contentMode === "SANITY"
            ? ((formData.get("sanityDataset") as string) || undefined)
            : undefined,
        requiredRoutes: (formData.get("requiredRoutes") as string) || undefined,
        notes: (formData.get("notes") as string) || undefined,
      });
      toast.success("Site build created");
      router.push(`/dashboard/clients/${clientId}/site-builds/${build.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create site build");
      setPending(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className={labelClass} htmlFor="projectName">
          Project name *
        </label>
        <input
          id="projectName"
          name="projectName"
          required
          placeholder="e.g. Acme Website Rebuild"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="repoName">
          Repository name
        </label>
        <input
          id="repoName"
          name="repoName"
          placeholder="e.g. acme-website"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="figmaUrl">
          Figma URL
        </label>
        <input
          id="figmaUrl"
          name="figmaUrl"
          type="url"
          placeholder="https://www.figma.com/file/..."
          className={inputClass}
        />
      </div>

      <div>
        <p className={labelClass}>Content mode</p>
        <div className="mt-1 flex gap-4">
          {(["LOCAL", "SANITY"] as const).map((mode) => (
            <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="contentMode"
                value={mode}
                checked={contentMode === mode}
                onChange={() => setContentMode(mode)}
              />
              {mode === "LOCAL" ? "Local (hardcoded)" : "Sanity CMS"}
            </label>
          ))}
        </div>
      </div>

      {contentMode === "SANITY" && (
        <div className="space-y-3 rounded-md border border-border p-4">
          <div>
            <label className={labelClass} htmlFor="sanityProjectId">
              Sanity project ID
            </label>
            <input
              id="sanityProjectId"
              name="sanityProjectId"
              placeholder="abc12345"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="sanityDataset">
              Sanity dataset
            </label>
            <input
              id="sanityDataset"
              name="sanityDataset"
              placeholder="production"
              defaultValue="production"
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="requiredRoutes">
          Required routes
        </label>
        <textarea
          id="requiredRoutes"
          name="requiredRoutes"
          rows={3}
          placeholder="/, /about, /services, /contact"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Anything relevant for the build brief…"
          className={inputClass}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create build"}
        </Button>
      </div>
    </form>
  );
}
