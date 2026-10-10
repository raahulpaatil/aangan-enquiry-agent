import { Resend } from "resend";

// Resend self-send only: the recipient is ALWAYS the SELF_EMAIL env var,
// from Resend's test sender. The designer and front desk are named in the text.
const FROM = "Aangan Enquiry Agent <onboarding@resend.dev>";

export type HandoffEmailInput = {
  name: string | null;
  area: string | null;
  designer: string;
  frontDesk: string;
  handoffNote: string;
  fields: [string, string][]; // label, value (already plain text)
  priceAsked: boolean;
  unanswered: string[];
  booking: { start: string; uid: string } | null;
};

export function buildHandoffText(i: HandoffEmailInput): { subject: string; text: string } {
  const who = i.name ?? "Unknown caller";
  const subject = `TEST - New enquiry: ${who} - ${i.area ?? "area not said"}`;
  const when = i.booking
    ? new Date(i.booking.start).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "full",
        timeStyle: "short",
      }) + " IST"
    : null;

  const lines = [
    `Designer: ${i.designer}`,
    `Front desk: ${i.frontDesk} (please review the record the next morning)`,
    "",
    when
      ? `Consultation: ${when} (booking ID ${i.booking!.uid})`
      : "Consultation: NOT booked automatically. Front desk please book this caller by hand.",
    "",
    "Handoff note",
    i.handoffNote,
    "",
    ...i.fields.map(([k, v]) => `${k}: ${v}`),
  ];
  if (i.priceAsked) {
    lines.push(
      "",
      "The caller asked about price. They were told a designer will share a figure after seeing the site. No figure was given.",
    );
  }
  if (i.unanswered.length) lines.push("", "Still to confirm:", ...i.unanswered.map((u) => `- ${u}`));
  lines.push("", "This is a test message from the Aangan Enquiry Agent.");
  return { subject, text: lines.join("\n") };
}

export async function sendHandoffEmail(i: HandoffEmailInput): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.SELF_EMAIL;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  if (!to) throw new Error("SELF_EMAIL is not set");
  const { subject, text } = buildHandoffText(i);
  const { data, error } = await new Resend(key).emails.send({ from: FROM, to, subject, text });
  if (error || !data) throw new Error(`Resend: ${error?.message ?? "no response"}`);
  return { id: data.id };
}
