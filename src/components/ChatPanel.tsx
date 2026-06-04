"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatEnvelope, ChatMessage } from "@/lib/types";
import { transcriptToMarkdown } from "@/lib/business-case";
import { download } from "@/lib/download";

interface ChatPanelProps {
  /** Called after every engine reply, with the running count of user turns. */
  onEnvelope: (envelope: ChatEnvelope, userTurns: number) => void;
  /** Restored conversation (e.g. from localStorage). When non-empty, the panel
   *  resumes instead of kicking off a fresh Stage 1 greeting. */
  initialMessages?: ChatMessage[];
  /** Notified whenever the message list changes, so the parent can persist it. */
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

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

export function ChatPanel({ onEnvelope, initialMessages, onMessagesChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Send a conversation (already ending in the turn to answer) to the engine
   * and append the assistant reply. On failure the history is left intact so
   * the user can retry without retyping.
   */
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

  // Kick off Stage 1 only for a fresh session. A restored conversation resumes
  // where it left off rather than re-greeting.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if ((initialMessages?.length ?? 0) > 0) return;
    void runEngine([]);
  }, [runEngine, initialMessages]);

  // Mirror the message list up to the parent for persistence.
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    void runEngine(next);
  }

  // Retry resends the current history (which ends in the unanswered turn, or is
  // empty for a failed greeting).
  function retry() {
    if (busy) return;
    void runEngine(messages);
  }

  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === "user";
  const canRetry = !busy && (messages.length === 0 || lastIsUser);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h1 className="text-lg font-semibold text-st-navy">ST-Streamline</h1>
          <p className="text-xs text-slate-400">Workflow bottleneck auditor — capital business</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => download("transcript.md", transcriptToMarkdown(messages), "text/markdown")}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-st-blue transition hover:bg-slate-50"
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
        className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
      >
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-sm bg-st-blue px-4 py-2.5 text-sm text-white"
                  : "max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-st-navy"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-400">
              typing…
            </div>
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600"
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
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-st-navy outline-none focus:border-st-blue"
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
                send();
              }
            }}
            disabled={busy}
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="rounded-lg bg-st-blue px-4 py-2.5 text-sm font-medium text-white transition hover:bg-st-navy disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
