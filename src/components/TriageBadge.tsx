import type { Triage } from "@/lib/types";

const REC: Record<string, { label: string; cls: string }> = {
  quick_win: { label: "Quick win", cls: "bg-emerald-50 text-emerald-600 ring-emerald-200" },
  needs_scoping: { label: "Needs scoping", cls: "bg-st-gold/15 text-[#9a6c0a] ring-st-gold/30" },
  strategic: { label: "Strategic", cls: "bg-st-sky/10 text-st-blue ring-st-sky/25" },
  not_viable: { label: "Not viable", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};

export function triageMeta(rec?: string) {
  return (rec && REC[rec]) || null;
}

/** Compact recommendation pill for cards and panels. */
export function TriageBadge({ triage }: { triage: Triage | null | undefined }) {
  const meta = triageMeta(triage?.recommendation);
  if (!meta) return null;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
}

const SCALE: Record<string, number> = { low: 1, medium: 2, high: 3 };

function Meter({ label, level, invert }: { label: string; level?: string; invert?: boolean }) {
  const n = level ? SCALE[level] ?? 0 : 0;
  // For effort, lower is better — colour accordingly.
  const good = invert ? n <= 1 : n >= 3;
  const mid = n === 2;
  const color = good ? "bg-emerald-400" : mid ? "bg-st-gold" : n ? "bg-slate-300" : "bg-slate-200";
  return (
    <div>
      <div className="flex justify-between text-[10px] uppercase tracking-wide text-slate-400">
        <span>{label}</span>
        <span className="text-slate-500">{level ?? "—"}</span>
      </div>
      <div className="mt-1 flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= n ? color : "bg-slate-100"}`} />
        ))}
      </div>
    </div>
  );
}

/** Fuller triage scorecard shown in the solution panel. */
export function TriageScorecard({ triage }: { triage: Triage | null }) {
  if (!triage || !triageMeta(triage.recommendation)) return null;
  return (
    <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Feasibility triage
        </span>
        <TriageBadge triage={triage} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <Meter label="Benefit" level={triage.benefit} />
        <Meter label="Effort" level={triage.effort} invert />
        <Meter label="Data ready" level={triage.data_readiness} />
        <Meter label="Confidence" level={triage.confidence} />
      </div>
      {triage.rationale && (
        <p className="mt-2.5 text-xs text-st-slate/75">{triage.rationale}</p>
      )}
    </div>
  );
}
