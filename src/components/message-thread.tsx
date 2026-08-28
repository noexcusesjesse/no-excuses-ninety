"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_MESSAGE_CHARS, type ThreadMessage, type ThreadSender } from "@/lib/message-types";

export function MessageThread({
  clientId,
  selfRole,
  coachName,
  clientName,
  initialMessages,
  canSend,
}: {
  clientId: string;
  selfRole: ThreadSender;
  coachName: string;
  clientName: string;
  initialMessages: ThreadMessage[];
  canSend: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    if (!input.trim() || sending || !canSend) return;
    setSending(true);
    setError(null);
    const body = input.trim();
    setInput("");
    try {
      const res = await fetch("/api/messages/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, clientId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send");
        setInput(body);
        return;
      }
      setMessages((prev) => [...prev, data.message as ThreadMessage]);
    } catch {
      setError("Connection error. Try again.");
      setInput(body);
    } finally {
      setSending(false);
    }
  }

  function label(role: ThreadSender) {
    return role === "coach" ? coachName : clientName.split(" ")[0];
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={scrollRef} className="flex max-h-[420px] min-h-[200px] flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. This 1:1 is only the assigned coach and this client.
          </p>
        )}
        {messages.map((msg) => {
          const mine = msg.senderRole === selfRole;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                <p className={`mb-1 font-mono text-[10px] uppercase tracking-wide ${mine ? "opacity-80" : "text-muted-foreground"}`}>
                  {label(msg.senderRole)}
                </p>
                <p className="whitespace-pre-wrap">{msg.body}</p>
                <p className={`mt-1 font-mono text-[10px] ${mine ? "opacity-70" : "text-muted-foreground"}`}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {canSend ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={`Message ${selfRole === "client" ? coachName : clientName.split(" ")[0]}…`}
            className="flex h-10 flex-1 rounded-md border border-border bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={sending}
            maxLength={MAX_MESSAGE_CHARS}
          />
          <Button onClick={send} disabled={sending || !input.trim()}>
            Send
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Preview is read-only. This 1:1 is between the assigned coach and client only.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
