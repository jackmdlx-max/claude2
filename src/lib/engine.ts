import type { ChatEnvelope, ChatMessage } from "./types";
import { extractEnvelope, normaliseEnvelope } from "./envelope";
import { prepareMessages } from "./prepare-messages";
import { ST_STREAMLINE_SYSTEM_PROMPT } from "./system-prompt";
import { THEMES } from "./themes";

export const DEFAULT_MAX_TOKENS = 3000;

/**
 * The single tool the model must call every turn. Forcing a tool call (rather
 * than asking for raw JSON in the text) is what makes the envelope reliable:
 * the API guarantees `tool_use.input` is a well-formed JSON object, so we never
 * hit "No JSON object found in model output" again.
 */
export const ENVELOPE_TOOL = {
  name: "render_workflow_audit",
  description:
    "Render your reply to the user plus the live state of the business case and the proposed solution design. You MUST call this exactly once per turn and put everything in it — never reply in plain text.",
  input_schema: {
    type: "object" as const,
    properties: {
      chat_response: {
        type: "string",
        description:
          "The message to show the user: a tight insight or challenge followed by ONE focused question (or, at the end, your recommendation). Keep it concise.",
      },
      business_case_draft: {
        type: "object",
        description:
          "Validated metrics so far, or omit/null while still in opening context/discovery.",
        properties: {
          bottleneck: { type: "string" },
          theme: {
            type: "string",
            enum: [...THEMES],
            description: "Canonical theme so similar ideas group together — pick the best fit.",
          },
          theme_detail: {
            type: "string",
            description: "A short specific descriptor, e.g. 'wastewater treatment optioneering'.",
          },
          purpose: { type: "string" },
          decisions_supported: { type: "string" },
          relied_on_by: { type: "string" },
          systems_involved: { type: "array", items: { type: "string" } },
          depends_on: { type: "string" },
          hours_per_week: { type: "number" },
          people_affected: { type: "number" },
          est_hours_saved_month: { type: "number" },
          roi_yearly_hours: { type: "number" },
          target_solution: { type: "string" },
          strategic_alignment: { type: "string" },
          complexity: { type: "string" },
          key_risks: { type: "string" },
          assumptions: { type: "string" },
          options_considered: { type: "string" },
        },
      },
      solution_design: {
        type: "object",
        description:
          "The proposed solution design — populate once you reach a recommendation. Actually design the fix, don't just name a tool.",
        properties: {
          summary: { type: "string" },
          problem_addressed: { type: "string" },
          components: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                role: { type: "string" },
                kind: {
                  type: "string",
                  enum: ["source", "process", "store", "output", "decision"],
                },
              },
              required: ["name", "role"],
            },
          },
          data_flow: { type: "array", items: { type: "string" } },
          tech_stack: { type: "array", items: { type: "string" } },
          phases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                detail: { type: "string" },
              },
              required: ["name", "detail"],
            },
          },
          effort_estimate: { type: "string" },
          key_risks: { type: "array", items: { type: "string" } },
          success_metrics: { type: "array", items: { type: "string" } },
        },
      },
      triage: {
        type: "object",
        description:
          "A coarse feasibility read, set once you recommend. recommendation ∈ quick_win|needs_scoping|strategic|not_viable; benefit/effort/data_readiness/confidence ∈ low|medium|high; rationale is one short sentence.",
        properties: {
          recommendation: {
            type: "string",
            enum: ["quick_win", "needs_scoping", "strategic", "not_viable"],
          },
          benefit: { type: "string", enum: ["low", "medium", "high"] },
          effort: { type: "string", enum: ["low", "medium", "high"] },
          data_readiness: { type: "string", enum: ["low", "medium", "high"] },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          rationale: { type: "string" },
        },
      },
      ui_mockup_prompt: {
        type: "string",
        description:
          "A highly descriptive image-generation prompt for a schematic of the solution. Null until you reach a recommendation.",
      },
    },
    required: ["chat_response"],
  },
};

/** The minimal slice of the Anthropic Messages API the engine depends on. */
export interface MessageCreateParams {
  model: string;
  max_tokens: number;
  system: Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }>;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  tools?: unknown[];
  tool_choice?: { type: "tool"; name: string };
  thinking?: { type: "disabled" };
  output_config?: { effort?: "low" | "medium" | "high" | "max" };
}
export interface CompletionLike {
  content: Array<{ type: string; text?: string; name?: string; input?: unknown }>;
}
export type CreateMessage = (params: MessageCreateParams) => Promise<CompletionLike>;

/**
 * Run one ST-Streamline turn: shape the transcript into a valid request, call
 * the model forcing the envelope tool, and read the structured tool input.
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
    // Cache the large, stable system prompt so repeated turns are cheap on Sonnet.
    system: [
      {
        type: "text",
        text: ST_STREAMLINE_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: prepareMessages(history),
    tools: [ENVELOPE_TOOL],
    tool_choice: { type: "tool", name: ENVELOPE_TOOL.name },
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
  });

  // Primary path: the forced tool call's structured input is the envelope.
  const toolBlock = completion.content.find(
    (block) => block.type === "tool_use" && block.input != null,
  );
  if (toolBlock?.input != null) {
    return normaliseEnvelope(toolBlock.input);
  }

  // Fallback: some older/edge responses may still come back as text.
  const text = completion.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("");
  return extractEnvelope(text);
}
