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

## Deploy (Vercel)

This is a standard Next.js app and deploys to Vercel with zero extra config.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjackmdlx-max%2Fclaude2&env=ANTHROPIC_API_KEY&envDescription=Anthropic%20API%20key%20for%20the%20ST-Streamline%20engine&envLink=https%3A%2F%2Fconsole.anthropic.com%2F&project-name=st-streamline&repository-name=st-streamline)

**Recommended: import the repo (gives a shareable preview URL per branch)**

1. Go to <https://vercel.com/new>, connect GitHub, and import `jackmdlx-max/claude2`.
2. Framework preset auto-detects as **Next.js** — leave the build/output defaults.
3. *(Optional)* Add **`ANTHROPIC_API_KEY`** for live AI (plus optionally
   `ANTHROPIC_MODEL` / `OPENAI_API_KEY`). **Skip it and the app deploys in
   [demo mode](#demo-mode)** — fully clickable, no key, no cost.
4. Deploy. Every branch then gets its own **Preview** URL — e.g. pushing
   `claude/modest-hamilton-AVwGE` yields a shareable preview link **without
   merging to `main`**. Promote a deployment to Production (or merge the branch
   into `main`) when you're ready for the stable URL.

**Or via the CLI** (deploys your current checkout, so run it on the branch):

```bash
npm i -g vercel
vercel              # first run links/creates the project
vercel env add ANTHROPIC_API_KEY   # paste your key
vercel --prod       # production deploy → prints the live URL
```

> Note: the one-click button above clones the repo's **default branch**
> (`main`), which currently holds only the initial commit. Until this branch is
> merged, use the *import the repo* flow (preview URL) or the CLI from the
> branch.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | no* | Auth for the Claude API. *Without it the app runs in **demo mode** (see below) instead of erroring — set it for live AI. |
| `ANTHROPIC_MODEL` | no | Override the model (defaults to `claude-opus-4-8`). |
| `OPENAI_API_KEY` | no | Enables real image generation in the mockup panel. Without it, the panel shows the prompt as a spec card. |
| `DEMO_MODE` | no | Set to `1` to force demo mode even when `ANTHROPIC_API_KEY` is present. |

### Demo mode

If no `ANTHROPIC_API_KEY` is configured (or `DEMO_MODE=1`), the chat is served by
a **scripted walkthrough** (`src/lib/demo-engine.ts`) instead of Claude — no key,
no API cost. It mirrors the real engine's envelope contract and walks the same
four stages (warm-up → discovery → validation → re-time pitch), so the chat,
business-case panel, ROI maths and mockup spec card all populate exactly as they
would live. A **Demo mode** badge in the header makes the state obvious. Drop in
a real key and redeploy to switch on live AI. This is what makes a zero-config
Vercel deploy show a working app immediately.

## Notes

- The engine asks exactly one question at a time and keeps a casual,
  peer-to-peer engineering tone — that behaviour lives in the system prompt, so
  tweak the conversation there.
- The envelope parser (`extractEnvelope`) tolerates accidental markdown fences
  or stray prose by scanning for the first balanced JSON object.
