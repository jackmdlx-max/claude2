import type { BusinessCaseDraft, SolutionDesign } from "./types";

export interface Progress {
  percent: number;
  label: string;
  complete: boolean;
}

function filled(v: unknown): boolean {
  if (v == null || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/**
 * A rough "how far through discovery are we" read, so the user sees momentum and
 * a clear end. Reaches 100% only once a recommendation (solution design) exists;
 * before that it weights the signals a good case needs.
 */
export function discoveryProgress(
  draft: BusinessCaseDraft | null,
  solution: SolutionDesign | null,
): Progress {
  if (solution && Object.keys(solution).length > 0) {
    return { percent: 100, label: "Recommendation ready", complete: true };
  }
  if (!draft) return { percent: 8, label: "Getting started", complete: false };

  let score = 0;
  if (filled(draft.bottleneck)) score += 30;
  if (filled(draft.purpose) || filled(draft.decisions_supported) || filled(draft.relied_on_by))
    score += 15;
  if (filled(draft.systems_involved)) score += 15;
  if (filled(draft.depends_on)) score += 5;
  if (filled(draft.hours_per_week)) score += 17;
  if (filled(draft.people_affected)) score += 13;

  const percent = Math.min(92, 10 + score);
  const label =
    percent < 35
      ? "Understanding the task"
      : percent < 70
        ? "Digging into the detail"
        : "Almost ready to recommend";
  return { percent, label, complete: false };
}
