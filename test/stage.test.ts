import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveStage } from "../src/lib/stage";

test("starts at Context before any user turn", () => {
  assert.equal(deriveStage(1, { hasMockup: false, hasDraft: false, userTurns: 0 }), 1);
});

test("advances to Discovery after the first user turn", () => {
  assert.equal(deriveStage(1, { hasMockup: false, hasDraft: false, userTurns: 1 }), 2);
});

test("advances to Validation once a draft exists", () => {
  assert.equal(deriveStage(2, { hasMockup: false, hasDraft: true, userTurns: 2 }), 3);
});

test("advances to Pitch once a mockup exists", () => {
  assert.equal(deriveStage(3, { hasMockup: true, hasDraft: true, userTurns: 4 }), 4);
});

test("never regresses below the previous stage", () => {
  // Draft momentarily absent on a later turn must not drag us back.
  assert.equal(deriveStage(3, { hasMockup: false, hasDraft: false, userTurns: 3 }), 3);
  assert.equal(deriveStage(4, { hasMockup: false, hasDraft: true, userTurns: 5 }), 4);
});
