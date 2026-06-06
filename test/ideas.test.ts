import { test } from "node:test";
import assert from "node:assert/strict";
import { roiForDraft, summarisePortfolio, type StoredIdea } from "../src/lib/ideas";

test("roiForDraft computes weekly/monthly/yearly and cost at the default rate", () => {
  const roi = roiForDraft({ hours_per_week: 5, people_affected: 4 });
  assert.equal(roi.weeklyHours, 20);
  assert.equal(roi.monthlyHours, 80);
  assert.equal(roi.yearlyHours, 960);
  assert.equal(roi.yearlyCostGBP, 960 * 30);
});

function idea(over: Partial<StoredIdea>): StoredIdea {
  const draft = over.draft ?? null;
  return {
    id: over.id ?? "x",
    ownerId: over.ownerId ?? "me",
    title: over.title ?? "Idea",
    team: over.team ?? null,
    status: "captured",
    createdAt: 0,
    updatedAt: over.updatedAt ?? 0,
    draft,
    solutionDesign: null,
    mockupPrompt: null,
    messages: [],
    stage: 4,
    roi: over.roi ?? roiForDraft(draft),
  };
}

test("summarisePortfolio totals, groups by team/system and ranks by value", () => {
  const ideas: StoredIdea[] = [
    idea({ id: "a", team: "Pipeline", draft: { hours_per_week: 5, people_affected: 4, systems_involved: ["Excel", "SAP"] } }),
    idea({ id: "b", team: "Pipeline", draft: { hours_per_week: 2, people_affected: 1, systems_involved: ["Excel"] } }),
    idea({ id: "c", team: "Finance", draft: { hours_per_week: 10, people_affected: 3, systems_involved: ["SAP"] } }),
  ];
  const s = summarisePortfolio(ideas);

  assert.equal(s.count, 3);
  // weekly totals: 20 + 2 + 30 = 52
  assert.equal(s.totalWeeklyHours, 52);
  assert.equal(s.totalYearlyHours, 52 * 4 * 12);
  assert.equal(s.totalYearlyCostGBP, 52 * 4 * 12 * 30);

  // Finance (30 hrs/wk) outranks Pipeline (22 hrs/wk) by value.
  assert.equal(s.byTeam[0].team, "Finance");
  // Excel appears in two ideas, SAP in two.
  const excel = s.bySystem.find((x) => x.system === "Excel");
  assert.equal(excel?.count, 2);
  // Top by value is the Finance idea.
  assert.equal(s.topByValue[0].id, "c");
});

test("ideas with no numbers contribute zero and group under Unassigned", () => {
  const s = summarisePortfolio([idea({ id: "z", draft: { bottleneck: "vague" } })]);
  assert.equal(s.totalYearlyCostGBP, 0);
  assert.equal(s.byTeam[0].team, "Unassigned");
});
