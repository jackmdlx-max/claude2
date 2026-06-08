"use client";

import { useMemo, useState } from "react";
import type { BusinessCaseDraft } from "@/lib/types";
import {
  businessCaseToJson,
  businessCaseToMarkdown,
} from "@/lib/business-case";
import {
  computeRoi,
  formatGBP,
  toNumber,
  DEFAULT_LOADED_HOURLY_RATE_GBP,
} from "@/lib/roi";
import { download } from "@/lib/download";

/** Friendly labels for the fields we know about; unknown keys are humanised. */
const LABELS: Record<string, string> = {
  bottleneck: "Bottleneck",
  theme: "Theme",
  theme_detail: "Theme detail",
  purpose: "Purpose",
  decisions_supported: "Decisions supported",
  relied_on_by: "Relied on by",
  systems_involved: "Systems involved",
  depends_on: "Depends on",
  hours_per_week: "Hours / week lost",
  people_affected: "People affected",
  est_hours_saved_month: "Est. hours saved / month",
  roi_yearly_hours: "ROI (hours / year)",
  target_solution: "Proposed solution",
  strategic_alignment: "Strategic alignment",
  complexity: "Complexity",
  key_risks: "Key risks",
  assumptions: "Assumptions",
  options_considered: "Options considered",
};

function humanise(key: string): string {
  return LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "—";
  return String(value);
}

export function BusinessCasePanel({ draft }: { draft: BusinessCaseDraft | null }) {
  const [rate, setRate] = useState(DEFAULT_LOADED_HOURLY_RATE_GBP);
  const [copied, setCopied] = useState(false);

  const roi = useMemo(() => {
    if (!draft) return null;
    const r = computeRoi({
      hoursPerWeek: toNumber(draft.hours_per_week),
      peopleAffected: toNumber(draft.people_affected),
      hourlyRate: rate,
    });
    return r.weeklyHours > 0 ? r : null;
  }, [draft, rate]);

  if (!draft || Object.keys(draft).length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-st-teal/30 bg-white/50 p-5 text-sm text-st-slate/60">
        The business case will populate here once we start pinning down the
        specifics of your bottleneck.
      </div>
    );
  }

  const headline = roi
    ? `${roi.monthlyHours} hrs / month`
    : typeof draft.est_hours_saved_month === "number"
      ? `${draft.est_hours_saved_month} hrs / month`
      : null;

  const entries = Object.entries(draft).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(businessCaseToMarkdown(draft!, { hourlyRate: rate }));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (e.g. non-secure context) — ignore */
    }
  }

  return (
    <div className="st-card animate-fade-in-up p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="st-eyebrow">Business Case Draft</h2>
        {headline && (
          <span className="rounded-full bg-st-gold/15 px-3 py-1 text-xs font-semibold text-st-gold">
            {headline}
          </span>
        )}
      </div>

      <dl className="space-y-3">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
          >
            <dt className="col-span-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              {humanise(key)}
            </dt>
            <dd className="col-span-2 text-sm text-st-navy">{renderValue(value)}</dd>
          </div>
        ))}
      </dl>

      {roi && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-st-blue">
              Quantified ROI
            </p>
            <label className="flex items-center gap-1 text-xs text-slate-400">
              £/hr
              <input
                type="number"
                min={0}
                value={rate}
                onChange={(e) => setRate(toNumber(e.target.value))}
                className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-right text-st-navy outline-none focus:border-st-blue"
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Hrs / month" value={String(roi.monthlyHours)} />
            <Metric label="Hrs / year" value={String(roi.yearlyHours)} />
            <Metric label="Annual saving" value={formatGBP(roi.yearlyCostGBP)} />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={copyMarkdown}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-st-blue transition hover:bg-slate-50"
        >
          {copied ? "Copied ✓" : "Copy Markdown"}
        </button>
        <button
          onClick={() =>
            download(
              "business-case.md",
              businessCaseToMarkdown(draft, { hourlyRate: rate }),
              "text/markdown",
            )
          }
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-st-blue transition hover:bg-slate-50"
        >
          Download .md
        </button>
        <button
          onClick={() => download("business-case.json", businessCaseToJson(draft), "application/json")}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-st-blue transition hover:bg-slate-50"
        >
          Download .json
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-2 shadow-sm">
      <div className="text-sm font-semibold text-st-navy">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
