// Cal.com API v2, called with plain fetch.
// Endpoints and version headers checked against Cal.com's OpenAPI spec on 2026-10-10:
//   GET  /v2/slots     cal-api-version 2024-09-04
//   POST /v2/bookings  cal-api-version 2026-02-25
const BASE = "https://api.cal.com/v2";
const TZ = "Asia/Kolkata";

function auth() {
  const key = process.env.CAL_API_KEY;
  if (!key) throw new Error("CAL_API_KEY is not set");
  return { Authorization: `Bearer ${key}` };
}

export type Booking = { uid: string; start: string; status: string };

// Finds the first free slot for the event type in the next two weeks.
async function firstFreeSlot(): Promise<string> {
  const eventTypeId = process.env.CAL_EVENT_TYPE_ID;
  if (!eventTypeId) throw new Error("CAL_EVENT_TYPE_ID is not set");
  const u = new URL(`${BASE}/slots`);
  u.search = new URLSearchParams({
    eventTypeId,
    start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    timeZone: TZ,
  }).toString();
  const r = await fetch(u, {
    headers: { ...auth(), "cal-api-version": "2024-09-04" },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`Cal.com slots lookup returned ${r.status}`);
  const body = (await r.json()) as { data: Record<string, { start: string }[]> };
  const days = Object.keys(body.data).sort();
  for (const d of days) if (body.data[d].length) return new Date(body.data[d][0].start).toISOString();
  throw new Error("No free slots in the next 14 days");
}

// Creates a booking labelled TEST. The attendee is always the owner's own email.
export async function createTestBooking(args: {
  name: string | null;
  area: string | null;
  designer: string;
  preferredSlot: string | null;
}): Promise<Booking> {
  const email = process.env.SELF_EMAIL;
  if (!email) throw new Error("SELF_EMAIL is not set");
  const start = await firstFreeSlot();
  const label = `TEST - ${args.name ?? "Unknown caller"} - ${args.area ?? "Unknown area"}`;

  const r = await fetch(`${BASE}/bookings`, {
    method: "POST",
    headers: { ...auth(), "cal-api-version": "2026-02-25", "Content-Type": "application/json" },
    body: JSON.stringify({
      start,
      eventTypeId: Number(process.env.CAL_EVENT_TYPE_ID),
      attendee: { name: label, email, timeZone: TZ, language: "en" },
      metadata: {
        label: "TEST",
        designer: args.designer,
        caller_preferred_slot: args.preferredSlot ?? "not said",
      },
    }),
    signal: AbortSignal.timeout(25000),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Cal.com booking returned ${r.status}: ${text.slice(0, 200)}`);
  const body = JSON.parse(text) as { data: { uid: string; start: string; status: string } };
  return { uid: body.data.uid, start: body.data.start, status: body.data.status };
}
