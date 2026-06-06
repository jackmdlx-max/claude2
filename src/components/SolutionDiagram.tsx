"use client";

import { Fragment } from "react";
import type { SolutionComponent } from "@/lib/types";

/**
 * A responsive schematic of the proposed solution, generated from
 * `solution_design.components`. It stacks vertically (with down-arrows) on
 * mobile and flows left→right on wider screens, so it never needs sideways
 * scrolling. Colour encodes the component kind.
 */

const KIND: Record<string, { fill: string; label: string }> = {
  source: { fill: "#2f9be0", label: "Source" },
  process: { fill: "#15b3a6", label: "Process" },
  store: { fill: "#1763a6", label: "System / store" },
  decision: { fill: "#e6a817", label: "Decision" },
  output: { fill: "#0e9488", label: "Output" },
};
const DEFAULT_FILL = "#334155";

export function SolutionDiagram({ components }: { components: SolutionComponent[] }) {
  const nodes = components.slice(0, 8);
  if (nodes.length === 0) return null;

  const usedKinds = Array.from(
    new Set(nodes.map((n) => (n.kind && KIND[n.kind] ? n.kind : null)).filter(Boolean)),
  ) as string[];

  return (
    <div>
      <div
        className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center"
        role="img"
        aria-label="Proposed solution data-flow diagram"
      >
        {nodes.map((node, i) => {
          const fill = (node.kind && KIND[node.kind]?.fill) || DEFAULT_FILL;
          return (
            <Fragment key={i}>
              <div
                className="rounded-xl px-3 py-2 text-white shadow-sm sm:min-w-[116px] sm:max-w-[168px] sm:flex-1"
                style={{ backgroundColor: fill }}
              >
                <div className="text-sm font-semibold leading-tight">{node.name}</div>
                {node.role && (
                  <div className="mt-0.5 text-[11px] leading-snug text-white/85">{node.role}</div>
                )}
              </div>
              {i < nodes.length - 1 && (
                <span
                  aria-hidden
                  className="flex items-center justify-center self-center text-st-teal/70"
                >
                  <span className="sm:hidden">▼</span>
                  <span className="hidden sm:inline">▶</span>
                </span>
              )}
            </Fragment>
          );
        })}
      </div>

      {usedKinds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {usedKinds.map((k) => (
            <span key={k} className="flex items-center gap-1.5 text-[10px] text-st-slate/70">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: KIND[k].fill }} />
              {KIND[k].label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
