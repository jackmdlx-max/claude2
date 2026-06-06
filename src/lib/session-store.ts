import type { BusinessCaseDraft, ChatMessage, SolutionDesign } from "./types";

/** Everything we persist so a refresh doesn't lose the discovery session. */
export interface SessionState {
  messages: ChatMessage[];
  draft: BusinessCaseDraft | null;
  solutionDesign: SolutionDesign | null;
  mockupPrompt: string | null;
  stage: number;
}

const STORAGE_KEY = "st-streamline:session:v1";

/**
 * Validate and coerce a raw JSON string into a SessionState. Kept pure (no
 * localStorage) so it can be unit-tested and so a corrupt blob just yields
 * null rather than throwing into the render path.
 */
export function parseSession(raw: string | null): SessionState | null {
  if (!raw) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const o = obj as Record<string, unknown>;

  if (!Array.isArray(o.messages)) return null;
  const messages = o.messages.filter(
    (m): m is ChatMessage =>
      typeof m === "object" &&
      m !== null &&
      ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
      typeof (m as ChatMessage).content === "string",
  );
  if (messages.length === 0) return null;

  return {
    messages,
    draft:
      o.draft && typeof o.draft === "object" ? (o.draft as BusinessCaseDraft) : null,
    solutionDesign:
      o.solutionDesign && typeof o.solutionDesign === "object"
        ? (o.solutionDesign as SolutionDesign)
        : null,
    mockupPrompt: typeof o.mockupPrompt === "string" ? o.mockupPrompt : null,
    stage: typeof o.stage === "number" && o.stage >= 1 ? o.stage : 1,
  };
}

export function loadSession(): SessionState | null {
  if (typeof window === "undefined") return null;
  return parseSession(window.localStorage.getItem(STORAGE_KEY));
}

export function saveSession(state: SessionState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — non-fatal */
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
