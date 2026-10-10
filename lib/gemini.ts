import { readFile } from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { Analysis, AnalysisSchema } from "./analysis-schema";

// The instruction lives in prompts/analyse-call.md so it can be edited without code.
async function loadInstruction() {
  return readFile(path.join(process.cwd(), "prompts", "analyse-call.md"), "utf8");
}

const jsonSchema = (() => {
  const s = z.toJSONSchema(AnalysisSchema) as Record<string, unknown>;
  delete s.$schema;
  return s;
})();

// Decision 1: the system never outputs a price. If the note or reason contains one,
// the answer counts as invalid.
const PRICE_PATTERN = /₹|\brs\.?\s?\d|\binr\b|lakh|crore|per\s+sq\.?\s?(ft|feet)|\$\s?\d/i;

export function containsPrice(a: Analysis): boolean {
  return PRICE_PATTERN.test(`${a.handoff_note}\n${a.reason ?? ""}`);
}

export type AnalyseResult = {
  analysis: Analysis;
  inputTokens: number;
  outputTokens: number; // includes thinking tokens, which are billed as output
  attempts: number;
  fellBack: boolean; // true if both attempts failed and we returned needs_human
  error?: string;
};

export async function analyseCall(transcript: string): Promise<AnalyseResult> {
  const model = process.env.GEMINI_MODEL;
  if (!model) throw new Error("GEMINI_MODEL is not set");
  const instruction = await loadInstruction();
  const ai = new GoogleGenAI({});

  let inputTokens = 0;
  let outputTokens = 0;
  let lastError = "";

  // One try plus one retry. No further retries.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const i = await ai.interactions.create({
        model,
        system_instruction: instruction,
        input: `Transcript:\n\n${transcript}`,
        response_format: { type: "text", mime_type: "application/json", schema: jsonSchema },
      });
      inputTokens += i.usage?.total_input_tokens ?? 0;
      outputTokens += (i.usage?.total_output_tokens ?? 0) + (i.usage?.total_thought_tokens ?? 0);

      const parsed = AnalysisSchema.safeParse(JSON.parse(i.output_text ?? ""));
      if (!parsed.success) {
        lastError = "Gemini's answer did not match the expected record";
        continue;
      }
      if (containsPrice(parsed.data)) {
        lastError = "Gemini's answer contained a price, which is never allowed";
        continue;
      }
      return { analysis: parsed.data, inputTokens, outputTokens, attempts: attempt, fellBack: false };
    } catch (e) {
      lastError = e instanceof SyntaxError ? "Gemini returned invalid JSON" : `Gemini call failed: ${(e as Error).message}`;
    }
  }

  return {
    analysis: {
      name: null,
      area: null,
      project_type: null,
      scope: null,
      sq_ft: null,
      timeline: null,
      decision_maker: null,
      budget_stated: null,
      price_asked: false,
      preferred_slot: null,
      outcome: "needs_human",
      reason: "The AI could not produce a usable record after one retry. Please read the transcript.",
      handoff_note: "Automatic analysis failed. Read the transcript and sort this call by hand.",
      unanswered_questions: [],
    },
    inputTokens,
    outputTokens,
    attempts: 2,
    fellBack: true,
    error: lastError,
  };
}
