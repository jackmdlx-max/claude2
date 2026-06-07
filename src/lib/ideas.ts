import type { BusinessCaseDraft, ChatMessage, SolutionDesign, Triage } from "./types";
import { computeRoi, DEFAULT_LOADED_HOURLY_RATE_GBP, toNumber } from "./roi";

export type IdeaStatus = "captured" | "in_review" | "approved" | "parked";

export interface IdeaRoi {
  weeklyHours: number;
  monthlyHours: number;
  yearlyHours: number;
  yearlyCostGBP: number;
}

/** A captured idea, persisted to the pipeline. */
export interface StoredIdea {
  id: string;
  ownerId: string;
  /** Who submitted it (free-text name, captured on save). */
  submitterName?: string | null;
  title: string;
  team?: string | null;
  status: IdeaStatus;
  /** Owner ids who have upvoted (deduped); length is the support count. */
  votes?: string[];
  createdAt: number;
  updatedAt: number;
  draft: BusinessCaseDraft | null;
  solutionDesign: SolutionDesign | null;
  triage?: Triage | null;
  mockupPrompt: string | null;
  messages: ChatMessage[];
  stage: number;
  roi: IdeaRoi;
}

/** Compute a stable ROI snapshot for a draft (uses the default loaded rate). */
export function roiForDraft(
  draft: BusinessCaseDraft | null,
  rate = DEFAULT_LOADED_HOURLY_RATE_GBP,
): IdeaRoi {
  const r = computeRoi({
    hoursPerWeek: toNumber(draft?.hours_per_week),
    peopleAffected: toNumber(draft?.people_affected),
    hourlyRate: rate,
  });
  return {
    weeklyHours: r.weeklyHours,
    monthlyHours: r.monthlyHours,
    yearlyHours: r.yearlyHours,
    yearlyCostGBP: r.yearlyCostGBP,
  };
}

export interface PortfolioSummary {
  count: number;
  totalWeeklyHours: number;
  totalMonthlyHours: number;
  totalYearlyHours: number;
  totalYearlyCostGBP: number;
  byTeam: Array<{ team: string; count: number; yearlyHours: number; yearlyCostGBP: number }>;
  bySystem: Array<{ system: string; count: number }>;
  topByValue: StoredIdea[];
}

/**
 * Aggregate a set of ideas into a leadership-facing portfolio summary. Pure, so
 * it can be unit-tested independently of the storage layer.
 */
export function summarisePortfolio(ideas: StoredIdea[]): PortfolioSummary {
  const teamMap = new Map<string, { count: number; yearlyHours: number; yearlyCostGBP: number }>();
  const systemMap = new Map<string, number>();

  let totalWeeklyHours = 0;
  let totalMonthlyHours = 0;
  let totalYearlyHours = 0;
  let totalYearlyCostGBP = 0;

  for (const idea of ideas) {
    totalWeeklyHours += idea.roi.weeklyHours;
    totalMonthlyHours += idea.roi.monthlyHours;
    totalYearlyHours += idea.roi.yearlyHours;
    totalYearlyCostGBP += idea.roi.yearlyCostGBP;

    const team = (idea.team || "Unassigned").trim() || "Unassigned";
    const t = teamMap.get(team) ?? { count: 0, yearlyHours: 0, yearlyCostGBP: 0 };
    t.count += 1;
    t.yearlyHours += idea.roi.yearlyHours;
    t.yearlyCostGBP += idea.roi.yearlyCostGBP;
    teamMap.set(team, t);

    for (const sys of idea.draft?.systems_involved ?? []) {
      const key = String(sys).trim();
      if (key) systemMap.set(key, (systemMap.get(key) ?? 0) + 1);
    }
  }

  const byTeam = Array.from(teamMap.entries())
    .map(([team, v]) => ({ team, ...v }))
    .sort((a, b) => b.yearlyCostGBP - a.yearlyCostGBP);

  const bySystem = Array.from(systemMap.entries())
    .map(([system, count]) => ({ system, count }))
    .sort((a, b) => b.count - a.count);

  const topByValue = [...ideas]
    .sort((a, b) => b.roi.yearlyCostGBP - a.roi.yearlyCostGBP)
    .slice(0, 10);

  return {
    count: ideas.length,
    totalWeeklyHours: Math.round(totalWeeklyHours),
    totalMonthlyHours: Math.round(totalMonthlyHours),
    totalYearlyHours: Math.round(totalYearlyHours),
    totalYearlyCostGBP: Math.round(totalYearlyCostGBP),
    byTeam,
    bySystem,
    topByValue,
  };
}
