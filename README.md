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

- **Chat window** (left) — the live discovery conversation.
- **Business Case Draft** (right, top) — populates from `business_case_draft`
  as metrics get validated, with a headline ROI chip.
- **UI Design Mockup** (right, bottom) — at Stage 4, renders `ui_mockup_prompt`
  as a generated image (if an image backend is configured) or a clean schematic
  spec card otherwise.

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/lib/system-prompt.ts` | The ST-Streamline engine prompt (single source of truth). |
| `src/lib/types.ts` | Shared `ChatEnvelope` / `BusinessCaseDraft` types. |
| `src/app/api/chat/route.ts` | Calls Claude, extracts and validates the JSON envelope. |
| `src/app/api/mockup/route.ts` | Optional image generation for the Stage 4 mockup. |
| `src/components/ChatPanel.tsx` | Chat UI; kicks off Stage 1 on load. |
| `src/components/BusinessCasePanel.tsx` | Live business-case side panel. |
| `src/components/MockupPanel.tsx` | Mockup image / schematic spec card. |
| `src/app/page.tsx` | Layout wiring the chat to both side panels. |

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev                   # http://localhost:3000
```

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
