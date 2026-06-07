import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "../src/lib/rate-limit";

test("allows up to the limit, then blocks with a retry-after", () => {
  const key = `k-${Math.random()}`;
  const t0 = 1_000_000;
  for (let i = 0; i < 3; i++) {
    assert.equal(rateLimit(key, 3, 1000, t0 + i).ok, true);
  }
  const blocked = rateLimit(key, 3, 1000, t0 + 4);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSec >= 1);
});

test("separate keys have independent budgets", () => {
  const t0 = 2_000_000;
  assert.equal(rateLimit("a-" + t0, 1, 1000, t0).ok, true);
  assert.equal(rateLimit("a-" + t0, 1, 1000, t0 + 1).ok, false);
  assert.equal(rateLimit("b-" + t0, 1, 1000, t0 + 1).ok, true);
});

test("the window slides — old hits expire", () => {
  const key = `w-${Math.random()}`;
  assert.equal(rateLimit(key, 1, 1000, 5_000).ok, true);
  assert.equal(rateLimit(key, 1, 1000, 5_500).ok, false); // within window
  assert.equal(rateLimit(key, 1, 1000, 6_600).ok, true); // window passed
});
