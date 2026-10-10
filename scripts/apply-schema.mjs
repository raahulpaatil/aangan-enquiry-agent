// Applies db/schema.sql to the Neon database in DATABASE_URL.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const file = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
const statements = file.split(/;\s*\n/).map(s => s.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean);
for (const s of statements) await sql.query(s);
const cols = await sql.query("select column_name, data_type from information_schema.columns where table_name='calls' order by ordinal_position");
console.log(`calls table ready, ${cols.length} columns`);
console.log("rows:", (await sql.query("select count(*)::int as n from calls"))[0].n);
