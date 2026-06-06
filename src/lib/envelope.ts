import type { ChatEnvelope } from "./types";

/**
 * Pull the JSON envelope out of the model's text, tolerant of stray prose or
 * accidental markdown fences. We scan for the first balanced `{...}` block so a
 * leading sentence or a ```json fence doesn't break parsing.
 *
 * This is the single most failure-prone hop in the pipeline (the model is asked
 * for raw JSON but may occasionally wrap it), so it lives in its own module and
 * is covered by test/envelope.test.ts.
 */
export function extractEnvelope(text: string): ChatEnvelope {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in model output.");

  // Walk the string tracking brace depth (ignoring braces inside strings) to
  // find the matching closing brace for the first opening one.
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const json = candidate.slice(start, i + 1);
        return normaliseEnvelope(JSON.parse(json));
      }
    }
  }
  throw new Error("Unbalanced JSON object in model output.");
}

/**
 * Guarantee the envelope fields exist with sane defaults, so downstream UI never
 * has to guard against a missing key from a slightly-off model reply. Exported
 * because the live engine now gets the envelope as a structured tool input and
 * needs the same normalisation the text path uses.
 */
export function normaliseEnvelope(raw: unknown): ChatEnvelope {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Parsed value is not an object.");
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.chat_response !== "string") {
    throw new Error("Envelope is missing a string `chat_response`.");
  }
  const asObject = (v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : null;
  return {
    chat_response: obj.chat_response,
    business_case_draft: asObject(
      obj.business_case_draft,
    ) as ChatEnvelope["business_case_draft"],
    solution_design: asObject(
      obj.solution_design,
    ) as ChatEnvelope["solution_design"],
    ui_mockup_prompt:
      typeof obj.ui_mockup_prompt === "string" ? obj.ui_mockup_prompt : null,
  };
}
