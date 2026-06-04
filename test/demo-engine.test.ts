import { test } from "node:test";
import assert from "node:assert/strict";
import { isDemoMode, runDemoTurn } from "../src/lib/demo-engine";
import type { ChatMessage } from "../src/lib/types";

/** Build a history with the given user turns (assistant turns interleaved). */
function history(userTurns: string[]): ChatMessage[] {
  return userTurns.flatMap((content, i): ChatMessage[] => [
    { role: "assistant", content: `reply ${i}` },
    { role: "user", content },
  ]);
}

test("step 0 greets with no draft or mockup (Stage 1)", () => {
  const env = runDemoTurn([]);
  assert.match(env.chat_response, /ST-Streamline/);
  assert.equal(env.business_case_draft, null);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 1 asks for the friction, still no draft (Stage 2)", () => {
  const env = runDemoTurn(history(["Project engineer, pipeline rehab"]));
  assert.equal(env.business_case_draft, null);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 2 opens the draft with the bottleneck (Stage 3)", () => {
  const env = runDemoTurn(
    history(["Engineer", "I re-key contractor spreadsheets into our dashboard every week"]),
  );
  assert.ok(env.business_case_draft);
  assert.match(env.business_case_draft!.bottleneck ?? "", /contractor spreadsheets/);
  assert.equal(env.business_case_draft!.systems_involved, undefined);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 3 detects the systems involved, still no mockup", () => {
  const env = runDemoTurn(
    history(["Engineer", "re-keying spreadsheets", "We use Excel and SAP, then email it out"]),
  );
  assert.deepEqual(env.business_case_draft!.systems_involved, ["Excel", "SAP", "Email"]);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 4 finalises the case with parsed ROI and a mockup (Stage 4)", () => {
  const env = runDemoTurn(
    history([
      "Engineer",
      "re-keying spreadsheets",
      "Excel and SAP",
      "about 5 hours each, 4 of us do it",
    ]),
  );
  const draft = env.business_case_draft!;
  assert.equal(draft.hours_per_week, 5);
  assert.equal(draft.people_affected, 4);
  // monthly = weekly total (5*4) * 4 weeks; yearly = monthly * 12.
  assert.equal(draft.est_hours_saved_month, 80);
  assert.equal(draft.roi_yearly_hours, 960);
  assert.equal(draft.target_solution, "Power Automate flow with internal API integration");
  assert.ok(env.ui_mockup_prompt && env.ui_mockup_prompt.length > 0);
  assert.match(env.ui_mockup_prompt!, /Excel, SAP/);
});

test("hours/people fall back to defaults when no numbers are given", () => {
  const env = runDemoTurn(
    history(["Engineer", "re-keying spreadsheets", "Excel", "loads of time, the whole team"]),
  );
  assert.equal(env.business_case_draft!.hours_per_week, 4);
  assert.equal(env.business_case_draft!.people_affected, 3);
});

test("step 5+ keeps the finalised case and mockup on screen", () => {
  const env = runDemoTurn(
    history(["Engineer", "spreadsheets", "Excel", "5 hours, 4 people", "looks great, thanks"]),
  );
  assert.ok(env.business_case_draft);
  assert.equal(env.business_case_draft!.hours_per_week, 5);
  assert.ok(env.ui_mockup_prompt);
});

test("isDemoMode: on without a key, off with a key, forced by DEMO_MODE", () => {
  const origKey = process.env.ANTHROPIC_API_KEY;
  const origFlag = process.env.DEMO_MODE;
  try {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.DEMO_MODE;
    assert.equal(isDemoMode(), true, "no key → demo");

    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    assert.equal(isDemoMode(), false, "key set → live");

    process.env.DEMO_MODE = "1";
    assert.equal(isDemoMode(), true, "DEMO_MODE=1 forces demo even with a key");
  } finally {
    if (origKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = origKey;
    if (origFlag === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = origFlag;
  }
});
