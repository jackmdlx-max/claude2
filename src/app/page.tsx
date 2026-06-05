"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { BusinessCasePanel } from "@/components/BusinessCasePanel";
import { MockupPanel } from "@/components/MockupPanel";
import { StageIndicator } from "@/components/StageIndicator";
import { ConfigStatus } from "@/components/ConfigStatus";
import type { BusinessCaseDraft, ChatEnvelope, ChatMessage } from "@/lib/types";
import { clearSession, loadSession, saveSession } from "@/lib/session-store";
import { deriveStage } from "@/lib/stage";

export default function Home() {
  const [draft, setDraft] = useState<BusinessCaseDraft | null>(null);
  const [mockupPrompt, setMockupPrompt] = useState<string | null>(null);
  const [stage, setStage] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // `hydrated` gates the first render until we've checked localStorage, which
  // keeps SSR and the initial client render in agreement (both show the
  // placeholder) and prevents a fresh Stage 1 firing before a restore.
  const [hydrated, setHydrated] = useState(false);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  // Remounts ChatPanel on reset so its internal start logic runs afresh.
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    const restored = loadSession();
    if (restored) {
      setMessages(restored.messages);
      setInitialMessages(restored.messages);
      setDraft(restored.draft);
      setMockupPrompt(restored.mockupPrompt);
      setStage(restored.stage);
    }
    setHydrated(true);
  }, []);

  // Persist whenever meaningful state changes (after hydration).
  useEffect(() => {
    if (!hydrated || messages.length === 0) return;
    saveSession({ messages, draft, mockupPrompt, stage });
  }, [hydrated, messages, draft, mockupPrompt, stage]);

  const handleEnvelope = useCallback(
    (env: ChatEnvelope, userTurns: number) => {
      if (env.business_case_draft) setDraft(env.business_case_draft);
      if (env.ui_mockup_prompt) setMockupPrompt(env.ui_mockup_prompt);

      setStage((prev) =>
        deriveStage(prev, {
          hasMockup: Boolean(env.ui_mockup_prompt),
          hasDraft: Boolean(env.business_case_draft),
          userTurns,
        }),
      );
    },
    [],
  );

  const handleMessagesChange = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
  }, []);

  function newSession() {
    clearSession();
    setDraft(null);
    setMockupPrompt(null);
    setStage(1);
    setMessages([]);
    setInitialMessages([]);
    setSessionKey((k) => k + 1);
  }

  return (
    // On small screens the whole page scrolls vertically (chat on top, panels
    // below). At `lg:` we switch to a full-height, fixed side-by-side split.
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-5 lg:h-screen">
      <div className="flex items-center justify-between gap-4">
        <StageIndicator stage={stage} />
        <div className="flex shrink-0 items-center gap-2">
          <ConfigStatus />
          <button
            onClick={newSession}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-st-blue transition hover:bg-slate-50"
          >
            New session
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row">
        <section className="h-[60vh] lg:h-auto lg:w-[45%] lg:min-w-[360px]">
          {hydrated && (
            <ChatPanel
              key={sessionKey}
              onEnvelope={handleEnvelope}
              initialMessages={initialMessages}
              onMessagesChange={handleMessagesChange}
            />
          )}
        </section>
        <aside className="flex flex-col gap-5 lg:flex-1 lg:overflow-y-auto">
          <BusinessCasePanel draft={draft} />
          <MockupPanel prompt={mockupPrompt} />
        </aside>
      </div>
    </main>
  );
}
