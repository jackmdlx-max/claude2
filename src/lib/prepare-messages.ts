import type { ChatMessage } from "./types";

/**
 * Synthetic opening turn used to trigger the Stage 1 greeting. The Anthropic
 * Messages API requires a non-empty list whose first turn is from the user, but
 * our UI's first call carries no history, so we seed one. It is never shown to
 * the user.
 */
export const KICKOFF_MESSAGE: ChatMessage = {
  role: "user",
  content: "Start the session.",
};

/**
 * Turn the UI's running transcript into a valid Anthropic message list.
 *
 * Two rules the API enforces that our UI state would otherwise violate:
 *   1. The list must be non-empty — the greeting call sends nothing, so we seed
 *      it with KICKOFF_MESSAGE.
 *   2. It must start with a `user` turn — but our transcript begins with the
 *      assistant's greeting, so we drop any leading assistant turns.
 *
 * Pure and side-effect free so it can be unit-tested without the network.
 */
export function prepareMessages(messages: ChatMessage[]): ChatMessage[] {
  const cleaned = messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content }));

  // Drop leading assistant turns so the list starts with the user.
  let start = 0;
  while (start < cleaned.length && cleaned[start].role === "assistant") start++;
  const trimmed = cleaned.slice(start);

  return trimmed.length > 0 ? trimmed : [KICKOFF_MESSAGE];
}
