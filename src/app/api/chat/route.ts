import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ST_STREAMLINE_SYSTEM_PROMPT } from "@/lib/system-prompt";
import type { ChatEnvelope, ChatRequest } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

/**
 * Pull a JSON object out of the model's text, tolerant of stray prose or
 * accidental markdown fences. We scan for the first balanced `{...}` block so
 * a leading sentence or a ```json fence doesn't break parsing.
 */
function extractEnvelope(text: string): ChatEnvelope {
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
        return JSON.parse(json) as ChatEnvelope;
      }
    }
  }
  throw new Error("Unbalanced JSON object in model output.");
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key." },
      { status: 500 },
    );
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];

  const client = new Anthropic({ apiKey });

  try {
    const completion = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: ST_STREAMLINE_SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    const envelope = extractEnvelope(text);
    return NextResponse.json(envelope);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error talking to the engine.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
