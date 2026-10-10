import { db, CallRow } from "./db";
import { Analysis, OUTCOME_LABEL } from "./analysis-schema";
import { callCost } from "./cost";
import type { CallDetailData } from "@/components/CallDetailView";

export async function getCallDetail(id: string): Promise<CallDetailData | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = (await db().query("select * from calls where id = $1", [id])) as CallRow[];
  const r = rows[0];
  if (!r) return null;
  const bookedLabel = r.outcome === "book" && r.cal_booking_uid ? "Booked" : OUTCOME_LABEL[r.outcome];
  return {
    id: r.id,
    name: r.name,
    area: r.area,
    outcome: r.outcome,
    outcomeLabel: bookedLabel,
    priceAsked: r.price_asked,
    handoffNote: r.handoff_note,
    reason: r.reason,
    analysis: r.analysis as Analysis,
    steps: r.steps,
    tokens: { input: r.gemini_input_tokens, output: r.gemini_output_tokens },
    minutes: Number(r.call_minutes),
    cost: callCost(r),
    transcript: r.transcript,
    callTime: new Date(r.call_time).toISOString(),
    ids: {
      booking: r.cal_booking_uid,
      email: r.email_id,
      contact: r.hubspot_contact_id,
      deal: r.hubspot_deal_id,
      note: r.hubspot_note_id,
    },
    aiMarkedWrong: r.ai_marked_wrong,
    callbackNote: r.callback_note,
  };
}
