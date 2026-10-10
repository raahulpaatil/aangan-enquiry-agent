// Shows which env names are filled in .env.local. Never prints values.
import { readFileSync } from "node:fs";

const required = readFileSync(new URL("../.env.example", import.meta.url), "utf8")
  .split("\n").filter(l => /^[A-Z_]+=/.test(l)).map(l => l.split("=")[0]);

let local = {};
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) local[m[1]] = m[2].trim();
  }
} catch { console.log(".env.local not found"); process.exit(1); }

let missing = 0;
for (const name of required) {
  const ok = Boolean(local[name]);
  if (!ok) missing++;
  console.log(`${ok ? "✅ filled " : "⬜ empty  "} ${name}`);
}
console.log(missing ? `\n${missing} still empty` : "\nAll filled");
