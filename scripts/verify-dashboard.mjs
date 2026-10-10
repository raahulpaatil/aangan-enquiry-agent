// Prints the dashboard's raw counts straight from the database, using the same SQL as the app,
// plus plain independent counts, so you can compare them with what the Dashboard shows.
import { neon } from "@neondatabase/serverless";
import { METRICS_SQL } from "../lib/metrics-sql.ts";

const sql = neon(process.env.DATABASE_URL);
const [m] = await sql.query(METRICS_SQL.replace("{where}", ""));
console.log("Dashboard query result:", JSON.stringify(m));
const q = async (label, text) => console.log(label.padEnd(34), (await sql.query(text))[0].n);
await q("select count(*) from calls", "select count(*)::int n from calls");
await q("bookings (cal_booking_uid not null)", "select count(*)::int n from calls where cal_booking_uid is not null");
await q("qualified (outcome = book)", "select count(*)::int n from calls where outcome='book'");
await q("not_a_fit + needs_human", "select count(*)::int n from calls where outcome in ('not_a_fit','needs_human')");
await q("marked wrong", "select count(*)::int n from calls where ai_marked_wrong");
await q("outside hours", "select count(*)::int n from calls where outside_hours");
