"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { BusinessCasePanel } from "@/components/BusinessCasePanel";
import { MockupPanel } from "@/components/MockupPanel";
import { StageIndicator } from "@/components/StageIndicator";
import type { BusinessCaseDraft, ChatEnvelope } from "@/lib/types";

export default function Home() {
  const [draft, setDraft] = useState<BusinessCaseDraft | null>(null);
  const [mockupPrompt, setMockupPrompt] = useState<string | null>(null);
  const [stage, setStage] = useState(1);

  function handleEnvelope(env: ChatEnvelope, userTurns: number) {
    // Keep the last non-null draft so the panel doesn't blank out mid-flow.
    if (env.business_case_draft) setDraft(env.business_case_draft);
    if (env.ui_mockup_prompt) setMockupPrompt(env.ui_mockup_prompt);

    // Derive the stage from the strongest available signal, never regressing.
    let next = 1;
    if (env.ui_mockup_prompt || mockupPrompt) next = 4;
    else if (env.business_case_draft || draft) next = 3;
    else if (userTurns >= 1) next = 2;
    setStage((s) => Math.max(s, next));
  }

  return (
    <main className="mx-auto flex h-screen max-w-7xl flex-col gap-4 p-5">
      <StageIndicator stage={stage} />
      <div className="flex min-h-0 flex-1 gap-5">
        <section className="w-[45%] min-w-[360px]">
          <ChatPanel onEnvelope={handleEnvelope} />
        </section>
        <aside className="flex flex-1 flex-col gap-5 overflow-y-auto">
          <BusinessCasePanel draft={draft} />
          <MockupPanel prompt={mockupPrompt} />
        </aside>
      </div>
    </main>
  );
}
