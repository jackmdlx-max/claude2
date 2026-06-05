/** Shared types for the ST-Streamline chat envelope. */

export type ChatRole = "user" | "assistant";

/** A single turn shown in the chat window. */
export interface ChatMessage {
  role: ChatRole;
  /** The human-readable text (envelope.chat_response for assistant turns). */
  content: string;
}

/**
 * The validated metrics the engine accumulates as the conversation
 * progresses. Fields are intentionally loose — the model fills in what it has
 * learned so far, and the side panel renders whatever is present.
 */
export interface BusinessCaseDraft {
  bottleneck?: string;
  /** Why the task is done / what it produces. */
  purpose?: string;
  /** Downstream decisions or outputs that hang off the task. */
  decisions_supported?: string;
  /** Which team, role or stakeholder relies on the output. */
  relied_on_by?: string;
  systems_involved?: string[];
  /** Upstream inputs / pre-conditions / blockers the task depends on. */
  depends_on?: string;
  hours_per_week?: number;
  people_affected?: number;
  est_hours_saved_month?: number;
  roi_yearly_hours?: number;
  target_solution?: string;
  strategic_alignment?: string;
  complexity?: string;
  // Allow forward-compatible extra fields without breaking the renderer.
  [key: string]: unknown;
}

/** The exact JSON envelope the engine must return on every turn. */
export interface ChatEnvelope {
  chat_response: string;
  business_case_draft: BusinessCaseDraft | null;
  ui_mockup_prompt: string | null;
}

/** Request body sent from the browser to /api/chat. */
export interface ChatRequest {
  messages: ChatMessage[];
}
