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
  /** Key risks the case must address. */
  key_risks?: string;
  /** Stated assumptions behind the figures. */
  assumptions?: string;
  /** Options weighed (do-nothing / do-minimum / preferred). */
  options_considered?: string;
  // Allow forward-compatible extra fields without breaking the renderer.
  [key: string]: unknown;
}

/** A node in the proposed solution's data/process flow. */
export interface SolutionComponent {
  /** Short label, e.g. "Power Automate", "SAP", "Exceptions queue". */
  name: string;
  /** What this component does in the flow. */
  role: string;
  /** Coarse kind, used to pick an icon/colour in the diagram. */
  kind?: "source" | "process" | "store" | "output" | "decision";
}

/** A delivery phase for the proposed solution. */
export interface SolutionPhase {
  name: string;
  detail: string;
}

/**
 * The engine's *proposed solution design* — it doesn't just cost the problem,
 * it designs the fix. Rendered as a schematic diagram plus detail in the
 * Solution panel.
 */
export interface SolutionDesign {
  /** One-line description of the proposed solution. */
  summary?: string;
  /** The specific problem this design addresses. */
  problem_addressed?: string;
  /** Ordered components in the data/process flow (left→right in the diagram). */
  components?: SolutionComponent[];
  /** Human-readable flow steps. */
  data_flow?: string[];
  /** Proposed technologies / platforms. */
  tech_stack?: string[];
  /** Delivery phases. */
  phases?: SolutionPhase[];
  /** Rough effort/complexity estimate. */
  effort_estimate?: string;
  /** Key delivery/technical risks. */
  key_risks?: string[];
  /** How success would be measured. */
  success_metrics?: string[];
  [key: string]: unknown;
}

/** A coarse feasibility/triage read on the idea, set at the recommendation. */
export interface Triage {
  recommendation?: "quick_win" | "needs_scoping" | "strategic" | "not_viable";
  benefit?: "low" | "medium" | "high";
  effort?: "low" | "medium" | "high";
  data_readiness?: "low" | "medium" | "high";
  confidence?: "low" | "medium" | "high";
  rationale?: string;
  [key: string]: unknown;
}

/** The exact JSON envelope the engine must return on every turn. */
export interface ChatEnvelope {
  chat_response: string;
  business_case_draft: BusinessCaseDraft | null;
  /** The proposed solution design (null until the engine reaches a recommendation). */
  solution_design: SolutionDesign | null;
  /** Feasibility triage (null until the engine reaches a recommendation). */
  triage: Triage | null;
  ui_mockup_prompt: string | null;
}

/** Request body sent from the browser to /api/chat. */
export interface ChatRequest {
  messages: ChatMessage[];
}
