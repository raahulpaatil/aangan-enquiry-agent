import { z } from "zod";
import { db, StepRecord } from "./db";
import { analyseCall } from "./gemini";
import { isOutsideHours } from "./hours";
import { createTestBooking } from "./calcom";
import { sendHandoffEmail } from "./email";
import { createHandoffRecords, HubspotResult } from "./hubspot";
import { config } from "@/config/app.config";

export const CallInput = z.object({
  transcript: z.string().trim().min(20, "Paste the call transcript (at least a few lines)."),
  call_minutes: z.coerce.number().positive("Enter the call length in minutes.").max(240),
  call_time: z.coerce.date(),
});
export type CallInput = z.infer<typeof CallInput>;

export type PipelineEvent =
  | { type: "step"; step: StepRecord }
  | { type: "done"; id: string }
  | { type: "error"; message: string };

// Runs the pipeline and reports each step as it happens.
// Analysis -> Booking -> (Email, HubSpot: next) -> Logged.
export async function runPipeline(input: CallInput, emit: (e: PipelineEvent) => void) {
  const steps: StepRecord[] = [];
  const setStep = (s: StepRecord) => {
    const i = steps.findIndex((x) => x.id === s.id);
    if (i >= 0) steps[i] = s;
    else steps.push(s);
    emit({ type: "step", step: s });
  };

  setStep({ id: "analysis", state: "running", detail: "Reading the call…" });
  const result = await analyseCall(input.transcript);
  const a = result.analysis;

  if (result.fellBack) {
    setStep({
      id: "analysis",
      state: "warning",
      detail: `${result.error}. Sent to the Review queue for a person to read.`,
    });
  } else if (a.outcome === "needs_human") {
    setStep({ id: "analysis", state: "warning", detail: a.reason ?? "Needs a person to look at it." });
  } else {
    setStep({
      id: "analysis",
      state: "done",
      detail: result.attempts === 2 ? "Done (needed one retry)." : "Done.",
    });
  }

  // Only qualified calls get a booking. Others go to the Review queue.
  let designer: string | null = null;
  let bookingUid: string | null = null;
  let bookingStart: string | null = null;
  if (a.outcome === "book") {
    const n = (await db().query("select count(*)::int as n from calls where cal_booking_uid is not null")) as { n: number }[];
    designer = config.designers[n[0].n % config.designers.length];

    setStep({ id: "booking", state: "running", detail: "Booking a consultation slot…" });
    try {
      const b = await createTestBooking({
        name: a.name,
        area: a.area,
        designer,
        preferredSlot: a.preferred_slot,
      });
      bookingUid = b.uid;
      bookingStart = b.start;
      setStep({
        id: "booking",
        state: "done",
        detail: `Test booking made for ${new Date(b.start).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST with ${designer}.`,
        ref: b.uid,
      });
    } catch (e) {
      setStep({
        id: "booking",
        state: "failed",
        detail: `${(e as Error).message}. The front desk should book this caller by hand.`,
      });
    }
  }

  // Email goes to the owner's own address only. Sent even if the booking failed, so a person can act.
  let emailId: string | null = null;
  let handoffSentAt: Date | null = null;
  if (a.outcome === "book" && designer) {
    setStep({ id: "email", state: "running", detail: "Sending the handoff email…" });
    try {
      const sent = await sendHandoffEmail({
        name: a.name,
        area: a.area,
        designer,
        frontDesk: config.frontDesk,
        handoffNote: a.handoff_note,
        fields: [
          ["What needs designing", a.scope ?? "Not said"],
          ["Size (sq ft)", a.sq_ft === null ? "Not said" : String(a.sq_ft)],
          ["Timeline", a.timeline ?? "Not said"],
          ["Who decides", a.decision_maker ?? "Not said"],
          ["Preferred slot", a.preferred_slot ?? "Not said"],
        ],
        priceAsked: a.price_asked,
        unanswered: a.unanswered_questions,
        booking: bookingUid && bookingStart ? { start: bookingStart, uid: bookingUid } : null,
      });
      emailId = sent.id;
      handoffSentAt = new Date();
      setStep({
        id: "email",
        state: bookingUid ? "done" : "warning",
        detail: bookingUid
          ? `Handoff sent to ${designer}'s test inbox.`
          : "Sent, but there is no booking. The front desk should book this caller.",
        ref: sent.id,
      });
    } catch (e) {
      setStep({
        id: "email",
        state: "failed",
        detail: `${(e as Error).message}. Check RESEND_API_KEY and SELF_EMAIL, then ask the designer by hand.`,
      });
    }
  }

  // HubSpot: contact + deal + note, only for qualified calls.
  let hs: HubspotResult | null = null;
  if (a.outcome === "book" && designer) {
    setStep({ id: "hubspot", state: "running", detail: "Adding the contact, deal and note…" });
    try {
      hs = await createHandoffRecords({
        name: a.name,
        area: a.area,
        designer,
        booked: Boolean(bookingUid),
        noteText: a.handoff_note,
      });
      setStep({
        id: "hubspot",
        state: "done",
        detail: `Contact ${hs.contactId}, deal ${hs.dealId}, note ${hs.noteId}.`,
        ref: hs.dealId,
      });
    } catch (e) {
      setStep({
        id: "hubspot",
        state: "failed",
        detail: `${(e as Error).message}. Add this caller to HubSpot by hand, or check HUBSPOT_TOKEN and its scopes.`,
      });
    }
  }

  setStep({ id: "logged", state: "running", detail: "Saving the record…" });
  try {
    const sql = db();
    const rows = (await sql.query(
      `insert into calls
        (transcript, call_minutes, call_time, outside_hours, analysis, outcome, reason, name, area,
         price_asked, handoff_note, gemini_input_tokens, gemini_output_tokens, steps, cal_booking_uid, email_id, handoff_sent_at,
         hubspot_contact_id, hubspot_deal_id, hubspot_note_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       returning id`,
      [
        input.transcript,
        input.call_minutes,
        input.call_time.toISOString(),
        isOutsideHours(input.call_time),
        JSON.stringify(a),
        a.outcome,
        a.reason,
        a.name,
        a.area,
        a.price_asked,
        a.handoff_note,
        result.inputTokens,
        result.outputTokens,
        JSON.stringify(steps),
        bookingUid,
        emailId,
        handoffSentAt ? handoffSentAt.toISOString() : null,
        hs?.contactId ?? null,
        hs?.dealId ?? null,
        hs?.noteId ?? null,
      ],
    )) as { id: string }[];
    const id = rows[0].id;
    setStep({ id: "logged", state: "done", detail: "Saved.", ref: id });
    await sql.query("update calls set steps = $1 where id = $2", [JSON.stringify(steps), id]);
    emit({ type: "done", id });
  } catch (e) {
    setStep({
      id: "logged",
      state: "failed",
      detail: `Could not save: ${(e as Error).message}. Check DATABASE_URL, then submit again.`,
    });
    emit({ type: "error", message: "The call could not be saved." });
  }
}
