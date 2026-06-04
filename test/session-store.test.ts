import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSession } from "../src/lib/session-store";

const VALID = JSON.stringify({
  messages: [
    { role: "assistant", content: "Hi" },
    { role: "user", content: "Hello" },
  ],
  draft: { bottleneck: "x" },
  mockupPrompt: "a diagram",
  stage: 3,
});

test("parses a valid session blob", () => {
  const s = parseSession(VALID);
  assert.ok(s);
  assert.equal(s!.messages.length, 2);
  assert.equal(s!.draft?.bottleneck, "x");
  assert.equal(s!.stage, 3);
});

test("returns null for null/empty/garbage input", () => {
  assert.equal(parseSession(null), null);
  assert.equal(parseSession(""), null);
  assert.equal(parseSession("{not json"), null);
  assert.equal(parseSession("[]"), null);
});

test("returns null when there are no usable messages", () => {
  assert.equal(parseSession(JSON.stringify({ messages: [] })), null);
  assert.equal(
    parseSession(JSON.stringify({ messages: [{ role: "system", content: "x" }] })),
    null,
  );
});

test("drops malformed messages but keeps valid ones", () => {
  const raw = JSON.stringify({
    messages: [
      { role: "user", content: "ok" },
      { role: "user" }, // missing content
      { role: "bogus", content: "x" }, // bad role
    ],
  });
  const s = parseSession(raw);
  assert.equal(s!.messages.length, 1);
  assert.equal(s!.messages[0].content, "ok");
});

test("defaults stage and nulls when fields are missing/invalid", () => {
  const s = parseSession(
    JSON.stringify({ messages: [{ role: "user", content: "hi" }], stage: -2 }),
  );
  assert.equal(s!.stage, 1);
  assert.equal(s!.draft, null);
  assert.equal(s!.mockupPrompt, null);
});
