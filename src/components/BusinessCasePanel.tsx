import type { BusinessCaseDraft } from "@/lib/types";

/** Friendly labels for the fields we know about; unknown keys are humanised. */
const LABELS: Record<string, string> = {
  bottleneck: "Bottleneck",
  systems_involved: "Systems involved",
  hours_per_week: "Hours / week lost",
  people_affected: "People affected",
  est_hours_saved_month: "Est. hours saved / month",
  roi_yearly_hours: "ROI (hours / year)",
  target_solution: "Proposed solution",
  strategic_alignment: "Strategic alignment",
  complexity: "Complexity",
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
  if (!draft || Object.keys(draft).length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-5 text-sm text-slate-400">
        The business case will populate here once we start pinning down the
        specifics of your bottleneck.
      </div>
    );
  }

  // Surface the headline ROI number if present.
  const headline =
    typeof draft.est_hours_saved_month === "number"
      ? `${draft.est_hours_saved_month} hrs / month`
      : typeof draft.roi_yearly_hours === "number"
        ? `${draft.roi_yearly_hours} hrs / year`
        : null;

  const entries = Object.entries(draft).filter(([, v]) => v !== null && v !== undefined && v !== "");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-st-blue">
          Business Case Draft
        </h2>
        {headline && (
          <span className="rounded-full bg-st-gold/15 px-3 py-1 text-xs font-semibold text-st-gold">
            {headline}
          </span>
        )}
      </div>
      <dl className="space-y-3">
        {entries.map(([key, value]) => (
          <div key={key} className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <dt className="col-span-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              {humanise(key)}
            </dt>
            <dd className="col-span-2 text-sm text-st-navy">{renderValue(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
