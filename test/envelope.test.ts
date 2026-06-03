import { test } from "node:test";
import assert from "node:assert/strict";
import { extractEnvelope } from "../src/lib/envelope";

const STAGE3 = {
  chat_response: "How many team members repeat this every Friday?",
  business_case_draft: {
    bottleneck: "Manual re-formatting of contractor Excel spreadsheets.",
    systems_involved: ["Excel", "PowerBI"],
    est_hours_saved_month: 12,
  },
  ui_mockup_prompt: null,
};

test("parses a clean raw JSON envelope", () => {
  const env = extractEnvelope(JSON.stringify(STAGE3));
  assert.equal(env.chat_response, STAGE3.chat_response);
  assert.deepEqual(env.business_case_draft?.systems_involved, ["Excel", "PowerBI"]);
  assert.equal(env.ui_mockup_prompt, null);
});

test("strips a ```json markdown fence", () => {
  const text = "```json\n" + JSON.stringify(STAGE3) + "\n```";
  const env = extractEnvelope(text);
  assert.equal(env.chat_response, STAGE3.chat_response);
});

test("ignores leading and trailing prose around the object", () => {
  const text = `Sure, here you go:\n${JSON.stringify(STAGE3)}\nLet me know!`;
  const env = extractEnvelope(text);
  assert.equal(env.business_case_draft?.est_hours_saved_month, 12);
});

test("handles nested objects and braces inside strings", () => {
  const tricky = {
    chat_response: 'Use the formula "{a} + {b}" — got it?',
    business_case_draft: { meta: { nested: { deep: true } }, note: "} not the end" },
    ui_mockup_prompt: null,
  };
  const env = extractEnvelope(JSON.stringify(tricky));
  assert.equal(env.chat_response, tricky.chat_response);
  assert.equal((env.business_case_draft as any).meta.nested.deep, true);
});

test("preserves escaped quotes in chat_response", () => {
  const withQuotes = {
    chat_response: 'She said \\"three hours\\" a week.',
    business_case_draft: null,
    ui_mockup_prompt: null,
  };
  // Build the JSON by hand to keep the escape sequence intact on the wire.
  const raw = `{"chat_response":"She said \\"three hours\\" a week.","business_case_draft":null,"ui_mockup_prompt":null}`;
  const env = extractEnvelope(raw);
  assert.equal(env.chat_response, 'She said "three hours" a week.');
  void withQuotes;
});

test("normalises missing optional fields to null", () => {
  const env = extractEnvelope('{"chat_response":"hi"}');
  assert.equal(env.business_case_draft, null);
  assert.equal(env.ui_mockup_prompt, null);
});

test("coerces a non-string ui_mockup_prompt to null", () => {
  const env = extractEnvelope('{"chat_response":"hi","ui_mockup_prompt":false}');
  assert.equal(env.ui_mockup_prompt, null);
});

test("throws when no JSON object is present", () => {
  assert.throws(() => extractEnvelope("no json here"), /No JSON object found/);
});

test("throws when chat_response is missing", () => {
  assert.throws(() => extractEnvelope('{"business_case_draft":null}'), /missing a string/);
});

test("throws on an unbalanced object", () => {
  assert.throws(() => extractEnvelope('{"chat_response":"oops"'), /Unbalanced/);
});
