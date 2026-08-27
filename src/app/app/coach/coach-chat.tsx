"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ContextData {
  name: string;
  programDay: number;
  phase: string;
  block?: string;
  weekNumber: number;
  proteinToday: number;
  proteinTarget: number;
  hydrationOz: number;
  stepsToday: number;
  sleepHours: number;
  cpapHours: number;
  mood: number | null;
  energy: number | null;
  cycle: {
    startWeight: number;
    currentWeight: number;
    weightChange: number;
    avgProtein: number | null;
    avgSteps: number | null;
    exerciseSessions: number;
    proteinAdherencePct: number;
    stepsAdherencePct: number;
  };
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function CoachChat({ contextData }: { contextData: ContextData }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, context: contextData }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Sorry, I couldn't process that." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={scrollRef} className="flex max-h-[400px] min-h-[200px] flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-8 text-center text-sm text-muted-foreground">
            <div>
              <p>Ask me anything about your progress, nutrition, or training.</p>
              <p className="mt-1 text-xs">I can see your logged data — protein, steps, weight trend, and more.</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask your coach…"
          className="flex h-10 flex-1 rounded-md border border-border bg-input px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
