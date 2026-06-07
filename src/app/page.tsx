"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChatPanel } from "@/components/ChatPanel";
import { BusinessCasePanel } from "@/components/BusinessCasePanel";
import { SolutionDesignPanel } from "@/components/SolutionDesignPanel";
import { MockupPanel } from "@/components/MockupPanel";
import { StageIndicator } from "@/components/StageIndicator";
import { ConfigStatus } from "@/components/ConfigStatus";
import { SaveIdeaButton } from "@/components/SaveIdeaButton";
import { Logo } from "@/components/Logo";
import type {
  BusinessCaseDraft,
  ChatEnvelope,
  ChatMessage,
  SolutionDesign,
} from "@/lib/types";
import { clearSession, loadSession, saveSession } from "@/lib/session-store";
import { deriveStage } from "@/lib/stage";
import { exportPackToMarkdown } from "@/lib/business-case";
import { download } from "@/lib/download";

export default function Home() {
  const [draft, setDraft] = useState<BusinessCaseDraft | null>(null);
  const [solutionDesign, setSolutionDesign] = useState<SolutionDesign | null>(null);
  const [mockupPrompt, setMockupPrompt] = useState<string | null>(null);
  const [stage, setStage] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ideaId, setIdeaId] = useState<string | null>(null);

  // `hydrated` gates the first render until we've checked localStorage.
  const [hydrated, setHydrated] = useState(false);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    // Revisiting a saved idea: /?idea=<id> loads it back into the session.
    const ideaParam = new URLSearchParams(window.location.search).get("idea");
    if (ideaParam) {
      window.history.replaceState({}, "", "/");
      fetch(`/api/ideas/${ideaParam}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const it = d?.idea;
          if (it) {
            setMessages(it.messages ?? []);
            setInitialMessages(it.messages ?? []);
            setDraft(it.draft ?? null);
            setSolutionDesign(it.solutionDesign ?? null);
            setMockupPrompt(it.mockupPrompt ?? null);
            setStage(it.stage ?? 1);
            setIdeaId(it.id);
          }
        })
        .catch(() => {})
        .finally(() => setHydrated(true));
      return;
    }

    const restored = loadSession();
    if (restored) {
      setMessages(restored.messages);
      setInitialMessages(restored.messages);
      setDraft(restored.draft);
      setSolutionDesign(restored.solutionDesign);
      setMockupPrompt(restored.mockupPrompt);
      setStage(restored.stage);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || messages.length === 0) return;
    saveSession({ messages, draft, solutionDesign, mockupPrompt, stage });
  }, [hydrated, messages, draft, solutionDesign, mockupPrompt, stage]);

  const handleEnvelope = useCallback((env: ChatEnvelope, userTurns: number) => {
    if (env.business_case_draft) setDraft(env.business_case_draft);
    if (env.solution_design) setSolutionDesign(env.solution_design);
    if (env.ui_mockup_prompt) setMockupPrompt(env.ui_mockup_prompt);

    setStage((prev) =>
      deriveStage(prev, {
        hasMockup: Boolean(env.ui_mockup_prompt) || Boolean(env.solution_design),
        hasDraft: Boolean(env.business_case_draft),
        userTurns,
      }),
    );
  }, []);

  const handleMessagesChange = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs);
  }, []);

  function newSession() {
    clearSession();
    setDraft(null);
    setSolutionDesign(null);
    setMockupPrompt(null);
    setStage(1);
    setMessages([]);
    setInitialMessages([]);
    setIdeaId(null);
    setSessionKey((k) => k + 1);
  }

  function exportPack() {
    if (!draft) return;
    download(
      "capital-ai-pack.md",
      exportPackToMarkdown(draft, solutionDesign),
      "text/markdown",
    );
  }

  const headerBtn =
    "rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20 st-focus";

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-3 sm:p-5">
      <header className="overflow-hidden rounded-2xl bg-st-hero shadow-card-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10 shrink-0" />
            <div>
              <h1 className="st-wordmark font-display text-lg font-semibold leading-tight sm:text-xl">
                Capital AI Idea Generation
              </h1>
              <p className="text-xs text-white/55">
                Severn Trent capital · idea → costed business case → solution design
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ConfigStatus />
            {draft && (
              <SaveIdeaButton
                ideaId={ideaId}
                draft={draft}
                solutionDesign={solutionDesign}
                mockupPrompt={mockupPrompt}
                messages={messages}
                stage={stage}
                onSaved={setIdeaId}
                className={headerBtn}
              />
            )}
            {draft && (
              <button onClick={exportPack} className={headerBtn}>
                Export pack
              </button>
            )}
            <Link href="/pipeline" className={headerBtn}>
              Pipeline
            </Link>
            <button onClick={newSession} className={headerBtn}>
              New session
            </button>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-3 sm:px-5">
          <StageIndicator stage={stage} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row">
        <section className="h-[68vh] lg:h-auto lg:w-[44%] lg:min-w-[380px]">
          {hydrated && (
            <ChatPanel
              key={sessionKey}
              onEnvelope={handleEnvelope}
              initialMessages={initialMessages}
              onMessagesChange={handleMessagesChange}
            />
          )}
        </section>
        <aside className="st-scroll flex flex-1 flex-col gap-5 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <BusinessCasePanel draft={draft} />
          <SolutionDesignPanel solution={solutionDesign} />
          <MockupPanel prompt={mockupPrompt} />
        </aside>
      </div>
    </main>
  );
}
