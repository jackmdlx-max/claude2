import { test } from "node:test";
import assert from "node:assert/strict";
import {
  runEngineTurn,
  DEFAULT_MAX_TOKENS,
  ENVELOPE_TOOL,
  type MessageCreateParams,
} from "../src/lib/engine";
import type { ChatMessage } from "../src/lib/types";

/** A fake `create` that records the request and returns canned content blocks. */
function fakeCreate(blocks: Array<{ type: string; text?: string; name?: string; input?: unknown }>) {
  const calls: MessageCreateParams[] = [];
  const create = async (params: MessageCreateParams) => {
    calls.push(params);
    return { content: blocks };
  };
  return { create, calls };
}

const STAGE3_INPUT = {
  chat_response: "How many people repeat this?",
  business_case_draft: { bottleneck: "x", systems_involved: ["Excel"] },
  ui_mockup_prompt: null,
};

function toolBlock(input: unknown) {
  return { type: "tool_use", name: ENVELOPE_TOOL.name, input };
}

test("reads the envelope from the forced tool_use block's input", async () => {
  const { create } = fakeCreate([toolBlock(STAGE3_INPUT)]);
  const env = await runEngineTurn(create, "test-model", [
    { role: "assistant", content: "greeting" },
    { role: "user", content: "I copy spreadsheets" },
  ]);
  assert.equal(env.chat_response, "How many people repeat this?");
  assert.deepEqual(env.business_case_draft?.systems_involved, ["Excel"]);
  // Missing structured fields are normalised, never undefined.
  assert.equal(env.solution_design, null);
  assert.equal(env.ui_mockup_prompt, null);
});

test("normalises a full solution_design from the tool input", async () => {
  const { create } = fakeCreate([
    toolBlock({
      chat_response: "Here's the design.",
      solution_design: { summary: "Automate it", components: [{ name: "A", role: "source" }] },
      ui_mockup_prompt: "a schematic",
    }),
  ]);
  const env = await runEngineTurn(create, "m", [{ role: "user", content: "go" }]);
  assert.equal(env.solution_design?.summary, "Automate it");
  assert.equal(env.ui_mockup_prompt, "a schematic");
});

test("forces the envelope tool with a cached system prompt and valid request", async () => {
  const { create, calls } = fakeCreate([toolBlock(STAGE3_INPUT)]);
  await runEngineTurn(create, "my-model", []);
  const req = calls[0];
  assert.equal(req.model, "my-model");
  assert.equal(req.max_tokens, DEFAULT_MAX_TOKENS);
  // System is now a cached text block, not a bare string.
  assert.ok(Array.isArray(req.system));
  assert.ok(req.system[0].text.includes("ST-Streamline"));
  assert.deepEqual(req.system[0].cache_control, { type: "ephemeral" });
  // Tool use is forced.
  assert.deepEqual(req.tool_choice, { type: "tool", name: ENVELOPE_TOOL.name });
  assert.ok(Array.isArray(req.tools) && req.tools.length === 1);
  // Empty history (Stage 1 greeting) still produces a valid user-first call.
  assert.ok(req.messages.length >= 1);
  assert.equal(req.messages[0].role, "user");
});

test("strips the leading assistant greeting from the request", async () => {
  const { create, calls } = fakeCreate([toolBlock(STAGE3_INPUT)]);
  const history: ChatMessage[] = [
    { role: "assistant", content: "greeting" },
    { role: "user", content: "u1" },
  ];
  await runEngineTurn(create, "m", history);
  assert.equal(calls[0].messages[0].role, "user");
  assert.equal(calls[0].messages[0].content, "u1");
});

test("falls back to parsing text when no tool block is present", async () => {
  const { create } = fakeCreate([{ type: "text", text: JSON.stringify(STAGE3_INPUT) }]);
  const env = await runEngineTurn(create, "m", [{ role: "user", content: "hi" }]);
  assert.equal(env.chat_response, "How many people repeat this?");
});

test("propagates a parse error when neither tool nor JSON text is returned", async () => {
  const { create } = fakeCreate([{ type: "text", text: "sorry, no json" }]);
  await assert.rejects(
    () => runEngineTurn(create, "m", [{ role: "user", content: "hi" }]),
    /No JSON object found/,
  );
});
