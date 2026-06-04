import { test } from "node:test";
import assert from "node:assert/strict";
import { runEngineTurn, DEFAULT_MAX_TOKENS, type MessageCreateParams } from "../src/lib/engine";
import type { ChatMessage } from "../src/lib/types";

/** A fake `create` that records the request and returns canned text blocks. */
function fakeCreate(blocks: Array<{ type: string; text?: string }>) {
  const calls: MessageCreateParams[] = [];
  const create = async (params: MessageCreateParams) => {
    calls.push(params);
    return { content: blocks };
  };
  return { create, calls };
}

const STAGE3_JSON = JSON.stringify({
  chat_response: "How many people repeat this?",
  business_case_draft: { bottleneck: "x", systems_involved: ["Excel"] },
  ui_mockup_prompt: null,
});

test("parses the envelope from the model's text blocks", async () => {
  const { create } = fakeCreate([{ type: "text", text: STAGE3_JSON }]);
  const env = await runEngineTurn(create, "test-model", [
    { role: "assistant", content: "greeting" },
    { role: "user", content: "I copy spreadsheets" },
  ]);
  assert.equal(env.chat_response, "How many people repeat this?");
  assert.deepEqual(env.business_case_draft?.systems_involved, ["Excel"]);
});

test("concatenates multiple text blocks before parsing", async () => {
  const { create } = fakeCreate([
    { type: "text", text: STAGE3_JSON.slice(0, 20) },
    { type: "text", text: STAGE3_JSON.slice(20) },
  ]);
  const env = await runEngineTurn(create, "test-model", [{ role: "user", content: "hi" }]);
  assert.equal(env.chat_response, "How many people repeat this?");
});

test("ignores non-text blocks", async () => {
  const { create } = fakeCreate([
    { type: "thinking", text: "ignore me" },
    { type: "text", text: STAGE3_JSON },
  ]);
  const env = await runEngineTurn(create, "test-model", [{ role: "user", content: "hi" }]);
  assert.equal(env.chat_response, "How many people repeat this?");
});

test("sends a valid request: non-empty, user-first, with system + model", async () => {
  const { create, calls } = fakeCreate([{ type: "text", text: STAGE3_JSON }]);
  // Empty history (the Stage 1 greeting case) must still produce a valid call.
  await runEngineTurn(create, "my-model", []);
  const req = calls[0];
  assert.equal(req.model, "my-model");
  assert.equal(req.max_tokens, DEFAULT_MAX_TOKENS);
  assert.ok(req.system.includes("ST-Streamline"));
  assert.ok(req.messages.length >= 1);
  assert.equal(req.messages[0].role, "user");
});

test("strips the leading assistant greeting from the request", async () => {
  const { create, calls } = fakeCreate([{ type: "text", text: STAGE3_JSON }]);
  const history: ChatMessage[] = [
    { role: "assistant", content: "greeting" },
    { role: "user", content: "u1" },
  ];
  await runEngineTurn(create, "m", history);
  assert.equal(calls[0].messages[0].role, "user");
  assert.equal(calls[0].messages[0].content, "u1");
});

test("propagates a parse error when the model returns no JSON", async () => {
  const { create } = fakeCreate([{ type: "text", text: "sorry, no json" }]);
  await assert.rejects(
    () => runEngineTurn(create, "m", [{ role: "user", content: "hi" }]),
    /No JSON object found/,
  );
});
