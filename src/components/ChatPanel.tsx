"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatEnvelope, ChatMessage } from "@/lib/types";
import { transcriptToMarkdown } from "@/lib/business-case";
import { download } from "@/lib/download";
import { Logo } from "./Logo";

interface ChatPanelProps {
  onEnvelope: (envelope: ChatEnvelope, userTurns: number) => void;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  /** Context (name/role/team) sent as the opening turn so the engine skips warm-up. */
  seedContext?: string;
}

const STARTERS = [
  "I manually compile AMP9 design envelopes every week",
  "I re-key contractor returns into our delivery dashboard",
  "I chase consents and approvals by email",
];

async function callEngine(messages: ChatMessage[]): Promise<ChatEnvelope> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "The engine hit an error.");
  return data as ChatEnvelope;
}

function countUserTurns(messages: ChatMessage[]): number {
  return messages.filter((m) => m.role === "user").length;
}

export function ChatPanel({
  onEnvelope,
  initialMessages,
  onMessagesChange,
  seedContext,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const runEngine = useCallback(
    async (history: ChatMessage[]) => {
      setError(null);
      setBusy(true);
      try {
        const env = await callEngine(history);
        onEnvelope(env, countUserTurns(history));
        setMessages([...history, { role: "assistant", content: env.chat_response }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [onEnvelope],
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if ((initialMessages?.length ?? 0) > 0) return;
    // Seed with the user's intro so the engine skips the role/team warm-up.
    void runEngine(seedContext ? [{ role: "user", content: seedContext }] : []);
  }, [runEngine, initialMessages, seedContext]);

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const sendText = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || busy) return;
      const next: ChatMessage[] = [...messages, { role: "user", content: t }];
      setMessages(next);
      setInput("");
      void runEngine(next);
    },
    [messages, busy, runEngine],
  );

  function retry() {
    if (busy) return;
    void runEngine(messages);
  }

  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === "user";
  const canRetry = !busy && (messages.length === 0 || lastIsUser);
  const showStarters = !busy && !error && countUserTurns(messages) === 0;

  return (
    <div className="st-card flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-st-navy">
            <Logo className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-st-navy">Discovery chat</h2>
            <p className="text-[11px] text-slate-400">Capital AI is interviewing you</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => download("transcript.md", transcriptToMarkdown(messages), "text/markdown")}
            className="st-focus rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-st-teal-600 transition hover:bg-slate-50"
          >
            Export chat
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Discovery conversation"
        className="st-scroll min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-5 sm:px-5"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`animate-fade-in-up flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-gradient-to-br from-st-teal to-st-teal-600 px-4 py-2.5 text-sm text-white shadow-sm"
                  : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-st-navy"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-100 bg-slate-50 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-st-teal [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-st-teal [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-st-teal" />
            </div>
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600"
          >
            <span>{error}</span>
            {canRetry && (
              <button
                onClick={retry}
                className="shrink-0 rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        {showStarters && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => sendText(s)}
                className="st-focus rounded-full border border-st-teal/25 bg-st-teal/5 px-3 py-1.5 text-left text-xs font-medium text-st-teal-600 transition hover:bg-st-teal/10"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            className="st-focus min-h-[46px] flex-1 resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-st-navy"
            placeholder="Type your reply…"
            aria-label="Your reply"
            rows={1}
            maxLength={4000}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText(input);
              }
            }}
            disabled={busy}
          />
          <button
            onClick={() => sendText(input)}
            disabled={busy || !input.trim()}
            className="st-focus rounded-xl bg-st-teal px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-st-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
