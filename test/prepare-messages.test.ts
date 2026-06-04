import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareMessages, KICKOFF_MESSAGE } from "../src/lib/prepare-messages";
import type { ChatMessage } from "../src/lib/types";

test("seeds a kickoff turn for an empty conversation (Stage 1 greeting)", () => {
  assert.deepEqual(prepareMessages([]), [KICKOFF_MESSAGE]);
});

test("drops the leading assistant greeting so the list starts with user", () => {
  const transcript: ChatMessage[] = [
    { role: "assistant", content: "Hi, what's your role?" },
    { role: "user", content: "Project controls." },
  ];
  const out = prepareMessages(transcript);
  assert.equal(out[0].role, "user");
  assert.equal(out.length, 1);
  assert.equal(out[0].content, "Project controls.");
});

test("preserves a valid alternating dialogue", () => {
  const transcript: ChatMessage[] = [
    { role: "assistant", content: "greeting" },
    { role: "user", content: "u1" },
    { role: "assistant", content: "a1" },
    { role: "user", content: "u2" },
  ];
  const out = prepareMessages(transcript);
  assert.deepEqual(
    out.map((m) => m.role),
    ["user", "assistant", "user"],
  );
  assert.equal(out[0].content, "u1");
});

test("falls back to kickoff when only assistant turns are present", () => {
  const out = prepareMessages([{ role: "assistant", content: "only greeting" }]);
  assert.deepEqual(out, [KICKOFF_MESSAGE]);
});

test("filters out empty and malformed turns", () => {
  const transcript = [
    { role: "assistant", content: "greeting" },
    { role: "user", content: "   " },
    { role: "user", content: "real question" },
  ] as ChatMessage[];
  const out = prepareMessages(transcript);
  assert.equal(out.length, 1);
  assert.equal(out[0].content, "real question");
});
