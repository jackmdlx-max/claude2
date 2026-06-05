import type { ChatEnvelope, ChatMessage } from "./types";

/**
 * Demo mode lets ST-Streamline run as a fully clickable, scripted walkthrough
 * with **no `ANTHROPIC_API_KEY` and no API cost**. It mirrors the real engine's
 * contract exactly — same {@link ChatEnvelope} shape, same four-stage arc — so
 * the chat window, the business-case panel and the mockup panel all behave just
 * as they would live. The only difference is that the assistant's replies come
 * from the script below instead of from Claude.
 *
 * Enabled automatically whenever no key is configured, or forced with
 * `DEMO_MODE=1` (handy for sharing a no-cost preview even when a key exists).
 */
export function isDemoMode(): boolean {
  const flag = process.env.DEMO_MODE;
  if (flag === "1" || flag === "true") return true;
  return !process.env.ANTHROPIC_API_KEY;
}

const STRATEGIC_ALIGNMENT = "Capital Programme Efficiency Target";
const TARGET_SOLUTION = "Power Automate flow with internal API integration";

/** Collapse whitespace and cap length so freeform answers render tidily. */
function clip(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

const KNOWN_SYSTEMS: Array<[RegExp, string]> = [
  [/power\s*automate/i, "Power Automate"],
  [/power\s*bi/i, "Power BI"],
  [/share\s*point/i, "SharePoint"],
  [/\bexcel\b|spreadsheets?|\bxlsx?\b/i, "Excel"],
  [/\bsap\b/i, "SAP"],
  [/\boutlook\b|\bemails?\b/i, "Email"],
  [/\bteams\b/i, "Teams"],
  [/\boracle\b/i, "Oracle"],
  [/\bmaximo\b/i, "Maximo"],
  [/\bsalesforce\b/i, "Salesforce"],
  [/\baccess\b/i, "MS Access"],
  [/\bword\b/i, "Word"],
  [/\bpdfs?\b/i, "PDF"],
  [/\bsql\b|database/i, "SQL database"],
];

/** Pull recognisable tool names out of a freeform answer (order-preserving). */
function detectSystems(answer: string): string[] {
  const found: string[] = [];
  for (const [re, label] of KNOWN_SYSTEMS) {
    if (re.test(answer) && !found.includes(label)) found.push(label);
  }
  return found.length > 0 ? found : [clip(answer, 60)];
}

/** Parse "about 4 hours, 3 of us" → { hours: 4, people: 3 } with sane fallbacks. */
function parseHoursAndPeople(answer: string): { hours: number; people: number } {
  const nums = (answer.match(/\d+(?:\.\d+)?/g) ?? [])
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const hours = nums[0] && nums[0] > 0 ? nums[0] : 4;
  const people = nums[1] && nums[1] >= 1 ? Math.round(nums[1]) : 3;
  return { hours, people };
}

function mockupPromptFor(systems: string[]): string {
  return (
    "A clean, professional architectural flowchart for a Severn Trent enterprise automation. " +
    `Show source icons on the left labelled with the systems involved (${systems.join(", ")}), ` +
    "arrows feeding into a central blue cog labelled 'Power Automate Integration Flow', " +
    "and an arrow out to a modern dashboard preview labelled 'INTERNAL ST DASHBOARD'. " +
    "Software-engineering schematic style, communicating automatic weekly data updates that remove the manual step."
  );
}

/**
 * The scripted answers captured so far, in script order. Each user turn after
 * the friction-discovery answer feeds one of these probing slots, so the draft
 * deepens turn by turn just as the live engine's would.
 */
interface CapturedAnswers {
  bottleneck: string;
  purpose?: string;
  decisions_supported?: string;
  relied_on_by?: string;
  systems_involved?: string[];
  depends_on?: string;
}

/** Build the cumulative draft from whatever has been captured up to this turn. */
function buildDraft(captured: CapturedAnswers): Record<string, unknown> {
  const draft: Record<string, unknown> = {
    bottleneck: captured.bottleneck,
    strategic_alignment: STRATEGIC_ALIGNMENT,
  };
  if (captured.purpose !== undefined) draft.purpose = captured.purpose;
  if (captured.decisions_supported !== undefined)
    draft.decisions_supported = captured.decisions_supported;
  if (captured.relied_on_by !== undefined) draft.relied_on_by = captured.relied_on_by;
  if (captured.systems_involved !== undefined)
    draft.systems_involved = captured.systems_involved;
  if (captured.depends_on !== undefined) draft.depends_on = captured.depends_on;
  return draft;
}

/**
 * Produce one scripted turn. The stage is driven purely by how many user turns
 * have happened, so a resumed session (restored from localStorage) continues
 * from the right place. Returns the exact same envelope shape as the live
 * engine, so nothing downstream needs to know it's a demo.
 *
 * Script arc (one question per turn, peer-to-peer tone):
 *   0 greet → role/team        · 1 friction → the task
 *   2 purpose                  · 3 downstream decisions/outputs
 *   4 who relies on it         · 5 systems involved
 *   6 dependencies/blockers    · 7 hours & people
 *   8 re-time pitch + mockup   · 9+ terminal wrap (non-repeating)
 */
export function runDemoTurn(history: ChatMessage[]): ChatEnvelope {
  const users = history.filter((m) => m.role === "user").map((m) => m.content);
  const step = users.length;

  // Stage 1 — warm-up & context (the opening greeting, before any user turn).
  if (step === 0) {
    return {
      chat_response:
        "Hey — I'm ST-Streamline, the workflow auditor for the capital business. " +
        "I'll help you spot a repetitive manual task that's eating your week, then turn it into a costed business case for automation. " +
        "To anchor things: what's your role, and which team are you in?",
      business_case_draft: null,
      ui_mockup_prompt: null,
    };
  }

  // Stage 2 — friction discovery.
  if (step === 1) {
    return {
      chat_response:
        "Thanks, that helps anchor the session. Now the bit that matters: thinking about a typical week, " +
        "what's the single most repetitive, manual task that eats your time — the kind of thing you find yourself redoing over and over?",
      business_case_draft: null,
      ui_mockup_prompt: null,
    };
  }

  // From here on we accumulate each captured answer into the draft, one per turn.
  const captured: CapturedAnswers = {
    bottleneck: clip(users[1] ?? "Repetitive manual data-handling task"),
  };

  // Stage 3a — purpose: why is the task done, what's it for? (draft opens here).
  if (step === 2) {
    return {
      chat_response:
        "Got it — that's exactly the sort of bottleneck worth pinning down. " +
        "Before we size it up, help me understand the why: what's the purpose of that task — what's it actually for, or what does it produce?",
      business_case_draft: buildDraft(captured),
      ui_mockup_prompt: null,
    };
  }

  captured.purpose = clip(users[2] ?? "");

  // Stage 3b — downstream decisions / outputs that depend on it.
  if (step === 3) {
    return {
      chat_response:
        "That's useful context. Now, what decisions or downstream outputs hang off it — " +
        "what gets decided, reported, or actioned because of the work you put in?",
      business_case_draft: buildDraft(captured),
      ui_mockup_prompt: null,
    };
  }

  captured.decisions_supported = clip(users[3] ?? "");

  // Stage 3c — who relies on the output (team / role / stakeholder).
  if (step === 4) {
    return {
      chat_response:
        "Makes sense. And who actually relies on that output — which team, role or stakeholder is waiting on it downstream?",
      business_case_draft: buildDraft(captured),
      ui_mockup_prompt: null,
    };
  }

  captured.relied_on_by = clip(users[4] ?? "");

  // Stage 3d — systems / tools involved.
  if (step === 5) {
    return {
      chat_response:
        "Good — that tells me who's affected if it slips. " +
        "Which systems or tools are involved when you do it? (For example Excel, SAP, SharePoint, Power BI, Outlook…)",
      business_case_draft: buildDraft(captured),
      ui_mockup_prompt: null,
    };
  }

  captured.systems_involved = detectSystems(users[5] ?? "");

  // Stage 3e — dependencies: upstream inputs, what must be in place, blockers.
  if (step === 6) {
    return {
      chat_response:
        "Right, that gives me the toolchain. " +
        "What does the task depend on to get going — any upstream inputs, things that have to be in place first, or blockers that hold it up?",
      business_case_draft: buildDraft(captured),
      ui_mockup_prompt: null,
    };
  }

  captured.depends_on = clip(users[6] ?? "");

  // Stage 3f — the two numbers we need to quantify the saving.
  if (step === 7) {
    return {
      chat_response:
        "Perfect — I've got the full picture now. Two quick numbers and we can size this up: " +
        "roughly how many hours a week does it cost you, and how many people on the team do the same thing?",
      business_case_draft: buildDraft(captured),
      ui_mockup_prompt: null,
    };
  }

  // Stage 4 — re-time pitch + mockup trigger (full draft + mockup prompt).
  const { hours, people } = parseHoursAndPeople(users[7] ?? "");
  const weeklyTotal = hours * people;
  const estHoursSavedMonth = Math.round(weeklyTotal * 4);
  const roiYearlyHours = Math.round(estHoursSavedMonth * 12);

  const systems = captured.systems_involved ?? ["Excel"];
  const draft = {
    ...buildDraft(captured),
    systems_involved: systems,
    hours_per_week: hours,
    people_affected: people,
    est_hours_saved_month: estHoursSavedMonth,
    roi_yearly_hours: roiYearlyHours,
    target_solution: TARGET_SOLUTION,
    complexity: "Medium",
  };
  const mockup = mockupPromptFor(systems);

  if (step === 8) {
    return {
      chat_response:
        `Right, here's how I read the business case. That bottleneck — "${captured.bottleneck}" — is costing the team about ${weeklyTotal} hours a week, ` +
        `which is roughly ${estHoursSavedMonth} hours a month, or ${roiYearlyHours} hours a year handed back if we automate it. ` +
        "My proposal is a Power Automate flow wired into the relevant systems via internal APIs so the data updates itself weekly. " +
        "I've put the full case in the side panel and generated a UI mockup of the data flow on the right. Does that line up with what you had in mind?",
      business_case_draft: draft,
      ui_mockup_prompt: mockup,
    };
  }

  // Stage 4 wrap — a single, distinct close-out the turn after the pitch. Keeps
  // the finalised case + mockup on screen and points to the export / restart
  // affordances rather than looping a question.
  if (step === 9) {
    return {
      chat_response:
        "Great — that's the audit complete. The finalised business case is in the side panel " +
        "(tweak the £/hr rate there to re-price the saving, or export it as Markdown or JSON), " +
        'and the data-flow mockup is on the right. When you\'re ready to audit another bottleneck, hit "New session".',
      business_case_draft: draft,
      ui_mockup_prompt: mockup,
    };
  }

  // Terminal state — any turn beyond the wrap-up. A graceful, non-repeating
  // closer so the conversation never loops the same question forever.
  return {
    chat_response:
      'This audit is complete — hit "New session" to run another bottleneck.',
    business_case_draft: draft,
    ui_mockup_prompt: mockup,
  };
}
