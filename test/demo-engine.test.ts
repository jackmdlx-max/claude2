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

/**
 * A full set of user answers covering every step of the deeper flow, in script
 * order: role → task → purpose → decisions → who relies → systems →
 * dependencies → hours&people → confirm → (terminal).
 */
const FULL_ANSWERS = [
  "Project engineer, pipeline rehab",
  "I re-key contractor spreadsheets into our dashboard every week",
  "It keeps the programme dashboard current so we can track delivery",
  "It drives the weekly delivery review and spend forecasting",
  "The capital delivery managers and the finance team",
  "We use Excel and SAP, then email it out",
  "We can't start until the contractors submit their returns on Friday",
  "about 5 hours each, 4 of us do it",
  "looks great, thanks",
  "no",
  "still no",
];

test("step 0 greets with no draft or mockup (Stage 1)", () => {
  const env = runDemoTurn([]);
  assert.match(env.chat_response, /Capital AI Idea Generation/);
  assert.equal(env.business_case_draft, null);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 1 asks for the friction, still no draft (Stage 2)", () => {
  const env = runDemoTurn(history(FULL_ANSWERS.slice(0, 1)));
  assert.equal(env.business_case_draft, null);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 2 opens the draft with the bottleneck, asks PURPOSE (Stage 3a)", () => {
  const env = runDemoTurn(history(FULL_ANSWERS.slice(0, 2)));
  assert.ok(env.business_case_draft);
  assert.match(env.business_case_draft!.bottleneck ?? "", /contractor spreadsheets/);
  // No deeper fields yet, no mockup.
  assert.equal(env.business_case_draft!.purpose, undefined);
  assert.equal(env.business_case_draft!.systems_involved, undefined);
  assert.match(env.chat_response, /purpose/i);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 3 captures purpose, asks about downstream DECISIONS (Stage 3b)", () => {
  const env = runDemoTurn(history(FULL_ANSWERS.slice(0, 3)));
  const draft = env.business_case_draft!;
  assert.match(draft.purpose ?? "", /programme dashboard current/);
  assert.equal(draft.decisions_supported, undefined);
  assert.match(env.chat_response, /decision|downstream/i);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 4 captures decisions, asks WHO relies on it (Stage 3c)", () => {
  const env = runDemoTurn(history(FULL_ANSWERS.slice(0, 4)));
  const draft = env.business_case_draft!;
  assert.match(draft.decisions_supported ?? "", /delivery review/);
  assert.equal(draft.relied_on_by, undefined);
  assert.match(env.chat_response, /who|relies|stakeholder/i);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 5 captures who relies, asks about SYSTEMS (Stage 3d)", () => {
  const env = runDemoTurn(history(FULL_ANSWERS.slice(0, 5)));
  const draft = env.business_case_draft!;
  assert.match(draft.relied_on_by ?? "", /capital delivery managers/);
  assert.equal(draft.systems_involved, undefined);
  assert.match(env.chat_response, /systems|tools/i);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 6 detects systems, asks about DEPENDENCIES (Stage 3e)", () => {
  const env = runDemoTurn(history(FULL_ANSWERS.slice(0, 6)));
  const draft = env.business_case_draft!;
  assert.deepEqual(draft.systems_involved, ["Excel", "SAP", "Email"]);
  assert.equal(draft.depends_on, undefined);
  assert.match(env.chat_response, /depend|upstream|blocker/i);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 7 captures dependencies, asks for hours & people (Stage 3f)", () => {
  const env = runDemoTurn(history(FULL_ANSWERS.slice(0, 7)));
  const draft = env.business_case_draft!;
  assert.match(draft.depends_on ?? "", /contractors submit their returns/);
  // Numbers not captured yet, still no mockup.
  assert.equal(draft.hours_per_week, undefined);
  assert.match(env.chat_response, /hours a week|how many people/i);
  assert.equal(env.ui_mockup_prompt, null);
});

test("step 8 finalises the case with parsed ROI and a mockup (Stage 4)", () => {
  const env = runDemoTurn(history(FULL_ANSWERS.slice(0, 8)));
  const draft = env.business_case_draft!;
  // All the accumulated probing fields persist into the final draft.
  assert.match(draft.bottleneck ?? "", /contractor spreadsheets/);
  assert.match(draft.purpose ?? "", /programme dashboard current/);
  assert.match(draft.decisions_supported ?? "", /delivery review/);
  assert.match(draft.relied_on_by ?? "", /capital delivery managers/);
  assert.match(draft.depends_on ?? "", /contractors submit their returns/);
  assert.deepEqual(draft.systems_involved, ["Excel", "SAP", "Email"]);
  // ROI maths: weekly total 5*4=20; monthly = 20*4 = 80; yearly = 80*12 = 960.
  assert.equal(draft.hours_per_week, 5);
  assert.equal(draft.people_affected, 4);
  assert.equal(draft.est_hours_saved_month, 80);
  assert.equal(draft.roi_yearly_hours, 960);
  assert.equal(draft.target_solution, "Power Automate flow with internal API integration");
  assert.equal(draft.complexity, "Medium");
  // The mockup appears for the first time at the pitch step.
  assert.ok(env.ui_mockup_prompt && env.ui_mockup_prompt.length > 0);
  assert.match(env.ui_mockup_prompt!, /Excel, SAP/);
});

test("hours/people fall back to defaults when no numbers are given", () => {
  const answers = FULL_ANSWERS.slice(0, 7).concat("loads of time, the whole team");
  const env = runDemoTurn(history(answers));
  assert.equal(env.business_case_draft!.hours_per_week, 4);
  assert.equal(env.business_case_draft!.people_affected, 3);
});

test("step 9 wrap-up keeps the case + mockup but does NOT repeat the pitch", () => {
  const pitch = runDemoTurn(history(FULL_ANSWERS.slice(0, 8)));
  const wrap = runDemoTurn(history(FULL_ANSWERS.slice(0, 9)));
  // Side panels persist.
  assert.equal(wrap.business_case_draft!.hours_per_week, 5);
  assert.ok(wrap.ui_mockup_prompt);
  // The wrap-up is a distinct, terminal message — not the pitch repeated.
  assert.notEqual(wrap.chat_response, pitch.chat_response);
  assert.match(wrap.chat_response, /complete|New session/i);
});

test("terminal turns never loop the same question and keep the panels", () => {
  const wrap = runDemoTurn(history(FULL_ANSWERS.slice(0, 9)));
  const term1 = runDemoTurn(history(FULL_ANSWERS.slice(0, 10)));
  const term2 = runDemoTurn(history(FULL_ANSWERS.slice(0, 11)));
  // Beyond the wrap-up we settle into a single graceful closer that is stable
  // (term1 === term2) but is NOT the looping pitch question.
  assert.equal(term1.chat_response, term2.chat_response);
  assert.ok(!/\?\s*$/.test(term1.chat_response), "terminal closer is not a question");
  assert.match(term1.chat_response, /complete|New session/i);
  // Finalised case + mockup still on screen on every terminal turn.
  assert.equal(term1.business_case_draft!.hours_per_week, 5);
  assert.ok(term2.ui_mockup_prompt);
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
