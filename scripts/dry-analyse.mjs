// Runs ONLY the Gemini analysis on a transcript file. Creates no booking, email, HubSpot record or log row.
import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({});
const i = await ai.interactions.create({
  model: process.env.GEMINI_MODEL,
  system_instruction: readFileSync(new URL("../prompts/analyse-call.md", import.meta.url), "utf8"),
  input: `Transcript:\n\n${readFileSync(process.argv[2], "utf8")}`,
  response_format: { type: "text", mime_type: "application/json" },
});
const a = JSON.parse(i.output_text);
console.log("preferred_slot:", a.preferred_slot);
console.log("handoff_note:", a.handoff_note);
