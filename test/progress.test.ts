import { test } from "node:test";
import assert from "node:assert/strict";
import { discoveryProgress } from "../src/lib/progress";

test("starts low and never hits 100 before a recommendation", () => {
  assert.equal(discoveryProgress(null, null).percent, 8);
  const mid = discoveryProgress(
    { bottleneck: "x", systems_involved: ["Excel"], hours_per_week: 5 },
    null,
  );
  assert.ok(mid.percent > 8 && mid.percent <= 92);
  assert.equal(mid.complete, false);
});

test("reaches 100% and 'Recommendation ready' once a solution exists", () => {
  const p = discoveryProgress({ bottleneck: "x" }, { summary: "Automate it" });
  assert.equal(p.percent, 100);
  assert.equal(p.complete, true);
  assert.match(p.label, /ready/i);
});

test("more captured fields increase the percentage", () => {
  const a = discoveryProgress({ bottleneck: "x" }, null).percent;
  const b = discoveryProgress(
    { bottleneck: "x", purpose: "y", systems_involved: ["Excel"], hours_per_week: 5, people_affected: 4 },
    null,
  ).percent;
  assert.ok(b > a);
});
