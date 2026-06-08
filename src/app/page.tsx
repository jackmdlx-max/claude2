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
import { WelcomeDialog, type Profile } from "@/components/WelcomeDialog";
import { Logo } from "@/components/Logo";
import type {
  BusinessCaseDraft,
  ChatEnvelope,
  ChatMessage,
  SolutionDesign,
  Triage,
} from "@/lib/types";
import { clearSession, loadSession, saveSession } from "@/lib/session-store";
import { deriveStage } from "@/lib/stage";
import { discoveryProgress } from "@/lib/progress";
import { exportPackToMarkdown } from "@/lib/business-case";
import { download } from "@/lib/download";

export default function Home() {
  const [draft, setDraft] = useState<BusinessCaseDraft | null>(null);
  const [solutionDesign, setSolutionDesign] = useState<SolutionDesign | null>(null);
  const [triage, setTriage] = useState<Triage | null>(null);
  const [mockupPrompt, setMockupPrompt] = useState<string | null>(null);
  const [stage, setStage] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [ideaId, setIdeaId] = useState<string | null>(null);

  // `hydrated` gates the first render until we've checked localStorage.
  const [hydrated, setHydrated] = useState(false);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [sessionKey, setSessionKey] = useState(0);

  // Welcome gate: each visitor introduces themselves and starts fresh, so a new
  // person never lands on the previous person's conversation.
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [savedExists, setSavedExists] = useState(false);
  const [seedContext, setSeedContext] = useState<string>("");

  const profileDefaults: Profile =
    typeof window === "undefined"
      ? { name: "", role: "", team: "" }
      : {
          name: localStorage.getItem("capital-ai:name") ?? "",
          role: localStorage.getItem("capital-ai:role") ?? "",
          team: localStorage.getItem("capital-ai:team") ?? "",
        };

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
            setTriage(it.triage ?? null);
            setMockupPrompt(it.mockupPrompt ?? null);
            setStage(it.stage ?? 1);
            setIdeaId(it.id);
          }
        })
        .catch(() => {})
        .finally(() => setHydrated(true));
      return;
    }

    // Don't auto-restore the previous conversation — gate on the welcome dialog
    // so a new person starts fresh (they can choose to resume if it's them).
    setSavedExists(Boolean(loadSession()));
    setHydrated(true);
    setWelcomeOpen(true);
  }, []);

  function startFresh(p: Profile) {
    if (typeof window !== "undefined") {
      localStorage.setItem("capital-ai:name", p.name);
      localStorage.setItem("capital-ai:role", p.role);
      localStorage.setItem("capital-ai:team", p.team);
    }
    clearSession();
    setDraft(null);
    setSolutionDesign(null);
    setTriage(null);
    setMockupPrompt(null);
    setStage(1);
    setMessages([]);
    setInitialMessages([]);
    setIdeaId(null);
    const who = `I'm ${p.name ? p.name + ", " : ""}a ${p.role}${p.team ? " in " + p.team : ""}.`;
    setSeedContext(`${who} I'd like to find a repetitive manual task worth automating.`);
    setSessionKey((k) => k + 1);
    setWelcomeOpen(false);
  }

  function resumePrevious() {
    const restored = loadSession();
    if (restored) {
      setMessages(restored.messages);
      setInitialMessages(restored.messages);
      setDraft(restored.draft);
      setSolutionDesign(restored.solutionDesign);
      setTriage(restored.triage);
      setMockupPrompt(restored.mockupPrompt);
      setStage(restored.stage);
    }
    setSeedContext("");
    setSessionKey((k) => k + 1);
    setWelcomeOpen(false);
  }

  useEffect(() => {
    if (!hydrated || messages.length === 0) return;
    saveSession({ messages, draft, solutionDesign, triage, mockupPrompt, stage });
  }, [hydrated, messages, draft, solutionDesign, triage, mockupPrompt, stage]);

  const handleEnvelope = useCallback((env: ChatEnvelope, userTurns: number) => {
    if (env.business_case_draft) setDraft(env.business_case_draft);
    if (env.solution_design) setSolutionDesign(env.solution_design);
    if (env.triage) setTriage(env.triage);
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
    setTriage(null);
    setMockupPrompt(null);
    setStage(1);
    setMessages([]);
    setInitialMessages([]);
    setIdeaId(null);
    setSavedExists(false);
    setWelcomeOpen(true);
  }

  function exportPack() {
    if (!draft) return;
    download(
      "capital-ai-pack.md",
      exportPackToMarkdown(draft, solutionDesign, { triage }),
      "text/markdown",
    );
  }

  const progress = discoveryProgress(draft, solutionDesign);
  const headerBtn =
    "rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20 st-focus";

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-3 sm:p-5 lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden">
      <header className="shrink-0 overflow-hidden rounded-2xl bg-st-hero shadow-card-lg">
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
                triage={triage}
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
        <div className="space-y-2.5 border-t border-white/10 px-4 py-3 sm:px-5">
          <StageIndicator stage={stage} />
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className={progress.complete ? "font-medium text-st-teal-300" : "text-white/55"}>
                {progress.complete ? "✓ " : ""}
                {progress.label}
              </span>
              <span className="font-semibold text-white/70">{progress.percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress.complete
                    ? "bg-emerald-400"
                    : "bg-gradient-to-r from-st-teal to-st-cyan"
                }`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-5 lg:min-h-0 lg:flex-1 lg:flex-row">
        <section className="h-[62vh] shrink-0 lg:h-auto lg:min-h-0 lg:w-[44%] lg:min-w-[380px] lg:shrink">
          {hydrated && !welcomeOpen ? (
            <ChatPanel
              key={sessionKey}
              onEnvelope={handleEnvelope}
              initialMessages={initialMessages}
              onMessagesChange={handleMessagesChange}
              seedContext={seedContext}
            />
          ) : (
            <div className="st-card flex h-full items-center justify-center p-8 text-center text-sm text-slate-400">
              Tell us a little about yourself to begin.
            </div>
          )}
        </section>
        <aside className="st-scroll flex flex-col gap-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          <BusinessCasePanel draft={draft} />
          <SolutionDesignPanel solution={solutionDesign} triage={triage} />
          <MockupPanel prompt={mockupPrompt} />
        </aside>
      </div>

      {welcomeOpen && (
        <WelcomeDialog
          savedExists={savedExists}
          defaults={profileDefaults}
          onStart={startFresh}
          onResume={resumePrevious}
        />
      )}
    </main>
  );
}
