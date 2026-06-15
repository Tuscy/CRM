"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@stky/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@stky/ui";
import { cn } from "@stky/ui/utils";
import { LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_STATUSES } from "@stky/crm";

type LeadsFiltersProps = {
  q?: string;
  status?: string;
  source?: string;
};

function hasActiveFilters(props: LeadsFiltersProps): boolean {
  return Boolean(props.q?.trim() || props.status || props.source);
}

export function LeadsFilters({ q, status, source }: LeadsFiltersProps) {
  const [open, setOpen] = useState(() => hasActiveFilters({ q, status, source }));
  const activeCount = [q?.trim(), status, source].filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-base">Search and filters</CardTitle>
            {!open && activeCount > 0 ? (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {activeCount} active
              </span>
            ) : null}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </button>
      </CardHeader>
      {open ? (
        <CardContent>
          <form
            className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end"
            method="get"
            action="/dashboard/leads"
          >
            <div className="flex-1 min-w-[180px]">
              <label htmlFor="q" className="text-sm font-medium">
                Search
              </label>
              <input
                id="q"
                name="q"
                type="search"
                placeholder="Name, email, phone, company"
                defaultValue={q ?? ""}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="w-full md:w-40">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status ?? ""}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Any</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-40">
              <label htmlFor="source" className="text-sm font-medium">
                Source
              </label>
              <select
                id="source"
                name="source"
                defaultValue={source ?? ""}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Any</option>
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {LEAD_SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Apply</Button>
              <Button variant="outline" type="button" asChild>
                <Link href="/dashboard/leads">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      ) : null}
    </Card>
  );
}
