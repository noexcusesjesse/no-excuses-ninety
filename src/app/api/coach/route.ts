import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/coach
 * Body: { message: string, context: object }
 *
 * AI coach that is data-grounded (constrained to the user's own logged data).
 * Hard rules enforced:
 *   - Never give medication dosing/timing/schedule advice
 *   - Never diagnose or interpret symptoms/labs/vitals
 *   - Never recommend extreme calorie restriction
 *   - Never guarantee results or specific dates
 *   - Keep replies short (2-4 sentences)
 *
 * For now, this returns a canned response based on the context.
 * In production, this would call an LLM with the context as system prompt.
 */

interface CoachContext {
  name: string;
  programDay: number;
  phase: string;
  proteinToday: number;
  proteinTarget: number;
  hydrationOz: number;
  stepsToday: number;
  mood: number | null;
  energy: number | null;
  cycle: {
    weightChange: number;
    avgProtein: number | null;
    avgSteps: number | null;
    proteinAdherencePct: number;
    stepsAdherencePct: number;
  };
}

function generateResponse(message: string, ctx: CoachContext): string {
  const lower = message.toLowerCase();
  const proteinGap = ctx.proteinTarget - ctx.proteinToday;

  // Protein-related
  if (lower.includes("protein")) {
    if (proteinGap > 20) {
      return `You're at ${ctx.proteinToday}g of protein today — ${proteinGap}g short of your ${ctx.proteinTarget}g target. Try a shake, eggs, or tuna to close the gap. Every gram counts toward protecting muscle while on tirzepatide.`;
    }
    return `You're at ${ctx.proteinToday}g out of ${ctx.proteinTarget}g — you're on track for protein today. Good work.`;
  }

  // Weight-related
  if (lower.includes("weight") || lower.includes("scale") || lower.includes("progress")) {
    const change = ctx.cycle.weightChange;
    if (change > 0) {
      return `Your weight is up ${Math.abs(change).toFixed(1)} lb since cycle start. This can be water, sodium, or food volume — check the 7-day average trend, not any single day. If it persists for 2+ weeks, consider discussing with your clinician.`;
    }
    return `You're down ${Math.abs(change).toFixed(1)} lb since your cycle start. Your protein adherence is at ${ctx.cycle.proteinAdherencePct}%, which is ${ctx.cycle.proteinAdherencePct >= 80 ? "excellent" : "an area to improve"}. Keep the trend, not the daily number, in mind.`;
  }

  // Steps
  if (lower.includes("step") || lower.includes("walk") || lower.includes("cardio")) {
    return `You're at ${ctx.stepsToday.toLocaleString()} steps today. Your average is ${ctx.cycle.avgSteps?.toLocaleString() ?? "—"}. ${ctx.cycle.stepsAdherencePct >= 80 ? "Great consistency." : "Try adding a 10-minute walk after your next meal."}`;
  }

  // Energy/mood
  if (lower.includes("energy") || lower.includes("tired") || lower.includes("mood")) {
    return `Your energy today is rated ${ctx.energy ?? "—"}/5 and mood ${ctx.mood ?? "—"}/5. If energy is low, check sleep (${ctx.proteinToday ? "and protein" : ""}) — both affect how you feel. If fatigue persists, mention it to your clinician.`;
  }

  // Medication/peptide
  if (lower.includes("medication") || lower.includes("tirzepatide") || lower.includes("peptide") || lower.includes("dose") || lower.includes("prescription")) {
    return `I can't give medication advice — that's for your prescribing clinician. I can track your compliance and flag side effects to discuss with them, but dosing decisions are between you and your doctor.`;
  }

  // Fasting
  if (lower.includes("fast") || lower.includes("fasting") || lower.includes("window")) {
    return `Your fasting window target is 14:10 or 16:8. You're on Day ${ctx.programDay} of the ${ctx.phase} phase. Remember: hydration matters, especially in Arizona heat — aim for 100 oz water minimum.`;
  }

  // Default
  return `You're on Day ${ctx.programDay} of 90, in the ${ctx.phase} phase. Protein: ${ctx.proteinToday}/${ctx.proteinTarget}g. Steps: ${ctx.stepsToday.toLocaleString()}. What specifically would you like to know?`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || session.role !== "client") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { message, context } = body as { message: string; context: CoachContext };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const reply = generateResponse(message, context);
  return NextResponse.json({ reply });
}
