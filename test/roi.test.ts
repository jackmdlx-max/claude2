import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeRoi,
  toNumber,
  formatGBP,
  DEFAULT_LOADED_HOURLY_RATE_GBP,
} from "../src/lib/roi";

test("computes weekly/monthly/yearly hours for a single person", () => {
  const r = computeRoi({ hoursPerWeek: 3 });
  assert.equal(r.weeklyHours, 3);
  assert.equal(r.monthlyHours, 12); // 3 * 4, matches the engine's example
  assert.equal(r.yearlyHours, 144); // 12 * 12
});

test("scales by the number of people affected", () => {
  const r = computeRoi({ hoursPerWeek: 2, peopleAffected: 5 });
  assert.equal(r.weeklyHours, 10);
  assert.equal(r.monthlyHours, 40);
  assert.equal(r.yearlyHours, 480);
});

test("uses the default loaded rate when none is given", () => {
  const r = computeRoi({ hoursPerWeek: 1 });
  assert.equal(r.rateUsed, DEFAULT_LOADED_HOURLY_RATE_GBP);
  assert.equal(r.yearlyCostGBP, 48 * DEFAULT_LOADED_HOURLY_RATE_GBP);
});

test("respects a custom hourly rate", () => {
  const r = computeRoi({ hoursPerWeek: 1, hourlyRate: 50 });
  assert.equal(r.rateUsed, 50);
  assert.equal(r.yearlyCostGBP, 48 * 50);
});

test("treats missing/zero people as a single person", () => {
  assert.equal(computeRoi({ hoursPerWeek: 4, peopleAffected: 0 }).weeklyHours, 4);
  assert.equal(computeRoi({ hoursPerWeek: 4, peopleAffected: null }).weeklyHours, 4);
});

test("toNumber coerces strings and rejects junk/negatives", () => {
  assert.equal(toNumber("12"), 12);
  assert.equal(toNumber("nope"), 0);
  assert.equal(toNumber(-5), 0);
  assert.equal(toNumber(undefined), 0);
  assert.equal(toNumber(7), 7);
});

test("formatGBP renders whole pounds with a symbol", () => {
  assert.equal(formatGBP(4320), "£4,320");
});
