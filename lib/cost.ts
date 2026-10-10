import { config } from "@/config/app.config";

export type Money = number | null; // rupees; null = "not set"

export type CallCost = { gemini: Money; vaani: Money; other: number; total: Money };

const p = config.prices;

export function callCost(row: {
  gemini_input_tokens: number | null;
  gemini_output_tokens: number | null;
  call_minutes: string | number;
}): CallCost {
  let gemini: Money = null;
  if (
    p.geminiInputUsdPerMTok !== null &&
    p.geminiOutputUsdPerMTok !== null &&
    p.usdToInr !== null &&
    row.gemini_input_tokens !== null &&
    row.gemini_output_tokens !== null
  ) {
    const usd =
      (row.gemini_input_tokens / 1e6) * p.geminiInputUsdPerMTok +
      (row.gemini_output_tokens / 1e6) * p.geminiOutputUsdPerMTok;
    gemini = usd * p.usdToInr;
  }
  const vaani: Money =
    p.vaaniInrPerMinute === null ? null : Number(row.call_minutes) * p.vaaniInrPerMinute;
  const other =
    p.calcomPerCall + p.hubspotPerCall + p.resendPerCall + p.neonPerCall + p.vercelPerCall;
  const total: Money = gemini === null || vaani === null ? null : gemini + vaani + other;
  return { gemini, vaani, other, total };
}

export function formatRupees(v: Money): string {
  if (v === null) return "not set";
  return `₹${v.toFixed(v < 1 ? 3 : 2)}`;
}

// Total cost of running the system over many calls (same prices as callCost).
export function runCost(t: { calls: number; inputTokens: number; outputTokens: number; minutes: number }): Money {
  const c = callCost({
    gemini_input_tokens: t.inputTokens,
    gemini_output_tokens: t.outputTokens,
    call_minutes: t.minutes,
  });
  if (c.gemini === null || c.vaani === null) return null;
  return c.gemini + c.vaani + c.other * t.calls;
}
