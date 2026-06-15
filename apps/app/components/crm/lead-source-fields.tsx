"use client";

import { useState } from "react";
import {
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  isKnownLeadSource,
} from "@stky/crm";

const fieldClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function initialSourceState(source: string | null | undefined): {
  select: string;
  custom: string;
} {
  if (!source) return { select: "", custom: "" };
  if (isKnownLeadSource(source)) {
    return { select: source, custom: "" };
  }
  return { select: "OTHER", custom: source };
}

export function LeadSourceFields({
  defaultSource,
  idPrefix = "",
}: {
  defaultSource?: string | null;
  idPrefix?: string;
}) {
  const initial = initialSourceState(defaultSource);
  const [sourceSelect, setSourceSelect] = useState(initial.select);

  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}source`} className="text-sm font-medium">
          Source
        </label>
        <select
          id={`${idPrefix}source`}
          name="sourceSelect"
          value={sourceSelect}
          onChange={(e) => setSourceSelect(e.target.value)}
          className={fieldClass}
        >
          <option value="">Not set</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {LEAD_SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      {sourceSelect === "OTHER" ? (
        <div>
          <label
            htmlFor={`${idPrefix}sourceCustom`}
            className="text-sm font-medium"
          >
            Source details
          </label>
          <input
            id={`${idPrefix}sourceCustom`}
            name="sourceCustom"
            defaultValue={initial.custom}
            placeholder="Describe where this lead came from"
            className={fieldClass}
          />
        </div>
      ) : null}
    </>
  );
}
