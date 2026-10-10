import { neon } from "@neondatabase/serverless";

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export type StepState = "running" | "done" | "warning" | "failed";
export type StepId = "analysis" | "booking" | "email" | "hubspot" | "logged";

export type StepRecord = {
  id: StepId;
  state: StepState;
  detail: string;
  ref?: string | null; // an ID from the other service, when there is one
};

export type CallRow = {
  id: string;
  created_at: string;
  transcript: string;
  call_minutes: string;
  call_time: string;
  outside_hours: boolean;
  analysis: unknown;
  outcome: "book" | "not_a_fit" | "needs_human";
  reason: string | null;
  name: string | null;
  area: string | null;
  price_asked: boolean;
  handoff_note: string | null;
  gemini_input_tokens: number | null;
  gemini_output_tokens: number | null;
  steps: StepRecord[];
  cal_booking_uid: string | null;
  email_id: string | null;
  hubspot_contact_id: string | null;
  hubspot_deal_id: string | null;
  hubspot_note_id: string | null;
  handoff_sent_at: string | null;
  ai_marked_wrong: boolean;
  callback_note: string | null;
};
