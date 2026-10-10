import { neon } from "@neondatabase/serverless";
import { sendHandoffEmail } from "../lib/email.ts";
const sql = neon(process.env.DATABASE_URL);
const [row] = await sql.query("select * from calls where id = '3d644ab9-6c45-4ff0-ab63-bf1fe42a131d'");
const a = row.analysis;
const sent = await sendHandoffEmail({
  name: a.name, area: a.area, designer: "Rohan", frontDesk: "Front desk", handoffNote: a.handoff_note,
  fields: [["What needs designing", a.scope ?? "Not said"],["Size (sq ft)", String(a.sq_ft ?? "Not said")],["Timeline", a.timeline ?? "Not said"],["Who decides", a.decision_maker ?? "Not said"],["Preferred slot", a.preferred_slot ?? "Not said"]],
  priceAsked: a.price_asked, unanswered: a.unanswered_questions,
  booking: { start: "2026-10-12T03:30:00.000Z", uid: row.cal_booking_uid },
});
console.log("sent, email id:", sent.id);
const r = await fetch("https://api.resend.com/emails/" + sent.id, { headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY } });
const j = await r.json(); console.log("status", r.status, JSON.stringify({ last_event: j.last_event, to: j.to, from: j.from, subject: j.subject }));
