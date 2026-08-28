export const LOADLINE_FROM = "LoadLine";
export const MAX_MESSAGE_CHARS = 4000;

export type ThreadSender = "coach" | "client";
export type BroadcastAudience = "all" | "clients" | "coaches";

export interface ThreadMessage {
  id: string;
  senderRole: ThreadSender;
  body: string;
  createdAt: number;
}

export interface ProgramNotice {
  id: string;
  from: typeof LOADLINE_FROM;
  body: string;
  createdAt: number;
  audience: BroadcastAudience;
}

export function audienceLabel(audience: BroadcastAudience): string {
  if (audience === "all") return "All users";
  if (audience === "clients") return "Clients only";
  return "Coaches only";
}
