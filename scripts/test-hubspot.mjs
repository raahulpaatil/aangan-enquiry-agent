// One-off live test: creates the 3 TEST HubSpot records for an existing saved call and stores their IDs.
import { neon } from "@neondatabase/serverless";
import { createHandoffRecords } from "../lib/hubspot.ts";
const id = process.argv[2];
const sql = neon(process.env.DATABASE_URL);
const [row] = await sql.query("select * from calls where id = $1", [id]);
const r = await createHandoffRecords({ name: row.name, area: row.area, designer: "Rohan", booked: Boolean(row.cal_booking_uid), noteText: row.handoff_note });
await sql.query("update calls set hubspot_contact_id=$1, hubspot_deal_id=$2, hubspot_note_id=$3 where id=$4", [r.contactId, r.dealId, r.noteId, id]);
console.log("created", JSON.stringify(r));
