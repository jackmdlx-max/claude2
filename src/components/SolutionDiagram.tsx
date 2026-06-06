"use client";

import type { SolutionComponent } from "@/lib/types";

/**
 * A deterministic SVG schematic of the proposed solution, generated from
 * `solution_design.components`. Nodes are laid out left→right along the flow
 * and connected by arrows; colour encodes the component kind. This is the
 * always-available "design visual" — no external image API required.
 */

const KIND: Record<string, { fill: string; label: string }> = {
  source: { fill: "#2f9be0", label: "Source" },
  process: { fill: "#15b3a6", label: "Process" },
  store: { fill: "#1763a6", label: "System / store" },
  decision: { fill: "#e6a817", label: "Decision" },
  output: { fill: "#0e9488", label: "Output" },
};
const DEFAULT_FILL = "#334155";

function clip(s: string, n: number): string {
  const t = (s ?? "").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}

const NODE_W = 156;
const NODE_H = 76;
const GAP = 54;
const PAD = 16;

export function SolutionDiagram({ components }: { components: SolutionComponent[] }) {
  const nodes = components.slice(0, 7);
  if (nodes.length === 0) return null;

  const width = PAD * 2 + nodes.length * NODE_W + (nodes.length - 1) * GAP;
  const height = PAD * 2 + NODE_H + 22; // room for a role caption under each box
  const usedKinds = Array.from(
    new Set(nodes.map((n) => (n.kind && KIND[n.kind] ? n.kind : null)).filter(Boolean)),
  ) as string[];

  return (
    <div className="st-scroll -mx-1 overflow-x-auto px-1 pb-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label="Proposed solution data-flow diagram"
        className="max-w-none"
      >
        <defs>
          <marker
            id="sd-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#94a3b8" />
          </marker>
        </defs>

        {nodes.map((node, i) => {
          const x = PAD + i * (NODE_W + GAP);
          const y = PAD;
          const fill = (node.kind && KIND[node.kind]?.fill) || DEFAULT_FILL;
          const cy = y + NODE_H / 2;
          return (
            <g key={i}>
              {i > 0 && (
                <line
                  x1={x - GAP + 4}
                  y1={cy}
                  x2={x - 4}
                  y2={cy}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  markerEnd="url(#sd-arrow)"
                />
              )}
              <rect
                x={x}
                y={y}
                width={NODE_W}
                height={NODE_H}
                rx="14"
                fill={fill}
              />
              <text
                x={x + NODE_W / 2}
                y={cy - 4}
                textAnchor="middle"
                fontSize="13.5"
                fontWeight="700"
                fill="#ffffff"
              >
                {clip(node.name, 18)}
              </text>
              <text
                x={x + NODE_W / 2}
                y={cy + 15}
                textAnchor="middle"
                fontSize="10.5"
                fill="#ffffff"
                opacity="0.85"
              >
                {clip(node.role, 24)}
              </text>
              <text
                x={x + NODE_W / 2}
                y={y + NODE_H + 15}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                letterSpacing="0.08em"
                fill="#64748b"
              >
                {(node.kind && KIND[node.kind]?.label) || ""}
              </text>
            </g>
          );
        })}
      </svg>

      {usedKinds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {usedKinds.map((k) => (
            <span key={k} className="flex items-center gap-1.5 text-[10px] text-st-slate/70">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: KIND[k].fill }}
              />
              {KIND[k].label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
