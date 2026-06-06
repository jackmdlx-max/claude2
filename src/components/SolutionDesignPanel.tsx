"use client";

import type { SolutionDesign } from "@/lib/types";
import { SolutionDiagram } from "./SolutionDiagram";

function Chips({ items, tone = "teal" }: { items: string[]; tone?: "teal" | "amber" }) {
  const cls =
    tone === "amber"
      ? "bg-st-gold/15 text-[#9a6c0a] ring-st-gold/30"
      : "bg-st-teal/10 text-st-teal-600 ring-st-teal/25";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <span
          key={i}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-st-slate/55">
        {title}
      </p>
      {children}
    </div>
  );
}

export function SolutionDesignPanel({ solution }: { solution: SolutionDesign | null }) {
  if (!solution || Object.keys(solution).length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-st-teal/30 bg-white/50 p-5 text-sm text-st-slate/60">
        Once we agree the bottleneck is worth fixing, a proposed{" "}
        <span className="font-medium text-st-teal-600">solution design</span> — architecture,
        data flow and delivery phases — renders here.
      </div>
    );
  }

  return (
    <div className="st-card animate-fade-in-up p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="st-eyebrow">Proposed Solution Design</h2>
        <span className="rounded-full bg-st-teal/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-st-teal-600">
          Auto-designed
        </span>
      </div>

      {solution.summary && (
        <p className="mb-4 text-sm leading-relaxed text-st-navy">{solution.summary}</p>
      )}

      {solution.components && solution.components.length > 0 && (
        <div className="mb-5 rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/60 p-3">
          <SolutionDiagram components={solution.components} />
        </div>
      )}

      <div className="space-y-4">
        {solution.problem_addressed && (
          <Block title="Problem addressed">
            <p className="text-sm text-st-navy">{solution.problem_addressed}</p>
          </Block>
        )}

        {solution.data_flow && solution.data_flow.length > 0 && (
          <Block title="Data / process flow">
            <ol className="space-y-1.5">
              {solution.data_flow.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-st-navy">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-st-teal/12 text-[11px] font-semibold text-st-teal-600">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Block>
        )}

        {solution.tech_stack && solution.tech_stack.length > 0 && (
          <Block title="Tech stack">
            <Chips items={solution.tech_stack} />
          </Block>
        )}

        {solution.phases && solution.phases.length > 0 && (
          <Block title="Delivery phases">
            <ol className="relative space-y-3 border-l border-st-teal/20 pl-4">
              {solution.phases.map((p, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-st-teal ring-2 ring-white" />
                  <p className="text-sm font-semibold text-st-navy">{p.name}</p>
                  <p className="text-xs text-st-slate/75">{p.detail}</p>
                </li>
              ))}
            </ol>
          </Block>
        )}

        {solution.effort_estimate && (
          <Block title="Effort estimate">
            <p className="text-sm text-st-navy">{solution.effort_estimate}</p>
          </Block>
        )}

        {solution.key_risks && solution.key_risks.length > 0 && (
          <Block title="Key risks">
            <Chips items={solution.key_risks} tone="amber" />
          </Block>
        )}

        {solution.success_metrics && solution.success_metrics.length > 0 && (
          <Block title="Success metrics">
            <ul className="space-y-1">
              {solution.success_metrics.map((m, i) => (
                <li key={i} className="flex gap-2 text-sm text-st-navy">
                  <span className="text-st-teal-600">✓</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>
    </div>
  );
}
