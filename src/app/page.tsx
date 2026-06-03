"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { BusinessCasePanel } from "@/components/BusinessCasePanel";
import { MockupPanel } from "@/components/MockupPanel";
import type { BusinessCaseDraft, ChatEnvelope } from "@/lib/types";

export default function Home() {
  const [draft, setDraft] = useState<BusinessCaseDraft | null>(null);
  const [mockupPrompt, setMockupPrompt] = useState<string | null>(null);

  function handleEnvelope(env: ChatEnvelope) {
    // Keep the last non-null draft so the panel doesn't blank out mid-flow.
    if (env.business_case_draft) setDraft(env.business_case_draft);
    if (env.ui_mockup_prompt) setMockupPrompt(env.ui_mockup_prompt);
  }

  return (
    <main className="mx-auto flex h-screen max-w-7xl gap-5 p-5">
      <section className="w-[45%] min-w-[360px]">
        <ChatPanel onEnvelope={handleEnvelope} />
      </section>
      <aside className="flex flex-1 flex-col gap-5 overflow-y-auto">
        <BusinessCasePanel draft={draft} />
        <MockupPanel prompt={mockupPrompt} />
      </aside>
    </main>
  );
}
