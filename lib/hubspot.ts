// HubSpot CRM API v3, called with plain fetch, using a Service Key as the bearer token.
// Association type IDs were read from HubSpot's own /crm/v4/associations/.../labels
// endpoint on 2026-10-10: deal->contact 3, note->contact 202, note->deal 214.
const BASE = "https://api.hubapi.com";

function headers() {
  const t = process.env.HUBSPOT_TOKEN;
  if (!t) throw new Error("HUBSPOT_TOKEN is not set");
  return { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };
}

async function post(path: string, body: unknown): Promise<{ id: string }> {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`HubSpot ${path} returned ${r.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text) as { id: string };
}

export type HubspotResult = { contactId: string; dealId: string; noteId: string };

// Creates a contact, a deal named "TEST - name - area" and a note holding the handoff note.
// If a later object fails, the error names what was already created.
export async function createHandoffRecords(args: {
  name: string | null;
  area: string | null;
  designer: string;
  booked: boolean;
  noteText: string;
}): Promise<HubspotResult> {
  const who = args.name ?? "Unknown caller";
  const created: string[] = [];
  try {
    const contact = await post("/crm/v3/objects/contacts", {
      properties: { firstname: who, lastname: "(TEST)", ...(args.area ? { city: args.area } : {}) },
    });
    created.push(`contact ${contact.id}`);

    const deal = await post("/crm/v3/objects/deals", {
      properties: {
        dealname: `TEST - ${who} - ${args.area ?? "area not said"}`,
        pipeline: "default",
        dealstage: args.booked ? "appointmentscheduled" : "qualifiedtobuy",
      },
      associations: [
        { to: { id: contact.id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }] },
      ],
    });
    created.push(`deal ${deal.id}`);

    const note = await post("/crm/v3/objects/notes", {
      properties: {
        hs_timestamp: new Date().toISOString(),
        hs_note_body: `Designer: ${args.designer}\n\n${args.noteText}`.replace(/\n/g, "<br>"),
      },
      associations: [
        { to: { id: contact.id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }] },
        { to: { id: deal.id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }] },
      ],
    });
    created.push(`note ${note.id}`);
    return { contactId: contact.id, dealId: deal.id, noteId: note.id };
  } catch (e) {
    const done = created.length ? ` Already created: ${created.join(", ")}.` : "";
    throw new Error(`${(e as Error).message}${done}`);
  }
}
