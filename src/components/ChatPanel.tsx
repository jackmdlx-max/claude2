"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatEnvelope, ChatMessage } from "@/lib/types";

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

export function ChatPanel({ onEnvelope, initialMessages, onMessagesChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Kick off Stage 1 only for a fresh session. A restored conversation resumes
  // where it left off rather than re-greeting.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if ((initialMessages?.length ?? 0) > 0) return;
    setBusy(true);
    callEngine([])
      .then((env) => {
        onEnvelope(env, 0);
        setMessages([{ role: "assistant", content: env.chat_response }]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }, [onEnvelope, initialMessages]);

  // Mirror the message list up to the parent for persistence.
  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const env = await callEngine(next);
      const userTurns = next.filter((m) => m.role === "user").length;
      onEnvelope(env, userTurns);
      setMessages([...next, { role: "assistant", content: env.chat_response }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h1 className="text-lg font-semibold text-st-navy">ST-Streamline</h1>
        <p className="text-xs text-slate-400">Workflow bottleneck auditor — capital business</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
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
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-st-navy outline-none focus:border-st-blue"
            placeholder="Type your reply…"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            disabled={busy}
          />
          <button
            onClick={() => void send()}
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
