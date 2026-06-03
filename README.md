# ST-Streamline

Internal automated workflow auditor for Severn Trent's capital business.

ST-Streamline runs a structured, interactive discovery chat that guides an
employee through four stages — warm-up, friction discovery, validation &
probing, and a re-time pitch — to **identify, validate, and quantify** a manual
workflow bottleneck, then drafts a formal business case and a UI design mockup
requirement for an automation solution.

## How it works

The conversational engine is defined entirely by a single system prompt
(`src/lib/system-prompt.ts`) sent to the Claude API on every turn. The model
replies with a strict JSON envelope:

```json
{
  "chat_response": "text shown in the chat window",
  "business_case_draft": { "...validated metrics, or null in stages 1-2..." },
  "ui_mockup_prompt": "image-gen prompt for the schematic, or null until stage 4"
}
```

The Next.js frontend renders this dynamically:

- **Stage indicator** (top) — a 4-step progress bar (Context → Discovery →
  Validation → Pitch) derived from the envelope signals.
- **Config status badge** (top) — probes `/api/health` so a misconfigured
  deployment (no API key) is obvious before you start typing.
- **Chat window** (left) — the live discovery conversation. The conversation
  persists across refreshes (localStorage) and can be wiped with *New session*.
- **Business Case Draft** (right, top) — populates from `business_case_draft`
  as metrics get validated, with a headline ROI chip, a quantified ROI panel
  (hours + annual £ saving at an editable loaded rate), and one-click export
  to Markdown or JSON.
- **UI Design Mockup** (right, bottom) — at Stage 4, renders `ui_mockup_prompt`
  as a generated image (if an image backend is configured) or a clean schematic
  spec card otherwise.

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/lib/system-prompt.ts` | The ST-Streamline engine prompt (single source of truth). |
| `src/lib/types.ts` | Shared `ChatEnvelope` / `BusinessCaseDraft` types. |
| `src/lib/envelope.ts` | Tolerant JSON-envelope extractor + normaliser (unit-tested). |
| `src/lib/roi.ts` | ROI maths — hours and annual £ saving (unit-tested). |
| `src/lib/business-case.ts` | Render the case as Markdown / JSON for export (unit-tested). |
| `src/lib/session-store.ts` | localStorage persistence + pure `parseSession` validator (unit-tested). |
| `src/app/api/chat/route.ts` | Calls Claude, then extracts and validates the JSON envelope. |
| `src/app/api/mockup/route.ts` | Optional image generation for the Stage 4 mockup. |
| `src/app/api/health/route.ts` | Reports whether keys are configured + the active model. |
| `src/components/ChatPanel.tsx` | Chat UI; kicks off Stage 1, resumes restored sessions. |
| `src/components/BusinessCasePanel.tsx` | Live business-case side panel, ROI + export. |
| `src/components/MockupPanel.tsx` | Mockup image / schematic spec card. |
| `src/components/StageIndicator.tsx` | 4-step stage progress bar. |
| `src/components/ConfigStatus.tsx` | Deployment config badge. |
| `src/app/page.tsx` | Layout, hydration/persistence, and stage derivation. |

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev                   # http://localhost:3000
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server. |
| `npm run build` | Production build. |
| `npm run lint` | ESLint (`next/core-web-vitals`). |
| `npm test` | Unit tests (`node --test` via tsx) for the lib layer. |

CI (`.github/workflows/ci.yml`) runs lint, test, and build on every push and PR.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | yes | Auth for the Claude API. |
| `ANTHROPIC_MODEL` | no | Override the model (defaults to `claude-opus-4-8`). |
| `OPENAI_API_KEY` | no | Enables real image generation in the mockup panel. Without it, the panel shows the prompt as a spec card. |

## Notes

- The engine asks exactly one question at a time and keeps a casual,
  peer-to-peer engineering tone — that behaviour lives in the system prompt, so
  tweak the conversation there.
- The envelope parser (`extractEnvelope`) tolerates accidental markdown fences
  or stray prose by scanning for the first balanced JSON object.
