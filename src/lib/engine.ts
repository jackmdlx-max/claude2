import type { ChatEnvelope, ChatMessage } from "./types";
import { extractEnvelope } from "./envelope";
import { prepareMessages } from "./prepare-messages";
import { ST_STREAMLINE_SYSTEM_PROMPT } from "./system-prompt";

export const DEFAULT_MAX_TOKENS = 2048;

/** The minimal slice of the Anthropic Messages API the engine depends on. */
export interface MessageCreateParams {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}
export interface CompletionLike {
  content: Array<{ type: string; text?: string }>;
}
export type CreateMessage = (params: MessageCreateParams) => Promise<CompletionLike>;

/**
 * Run one ST-Streamline turn: shape the transcript into a valid request, call
 * the model, concatenate its text blocks, and parse the JSON envelope.
 *
 * The model client is injected (rather than constructed here) so this — the
 * full request→response→parse path — can be unit-tested with a fake.
 */
export async function runEngineTurn(
  create: CreateMessage,
  model: string,
  history: ChatMessage[],
): Promise<ChatEnvelope> {
  const completion = await create({
    model,
    max_tokens: DEFAULT_MAX_TOKENS,
    system: ST_STREAMLINE_SYSTEM_PROMPT,
    messages: prepareMessages(history),
  });

  const text = completion.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("");

  return extractEnvelope(text);
}
