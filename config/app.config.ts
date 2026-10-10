// Everything you may want to change without touching the logic.
// A price of `null` means "not set": the dashboard shows "not set" and never guesses.

export const config = {
  studioName: "Aangan Studio",

  // Placeholder designers for testing
  designers: ["Rohan", "Karthik", "Amar"],
  frontDesk: "Front desk",

  // Front desk hours (IST). Calls outside these hours count as "outside hours".
  hours: { startHour: 10, endHour: 19, timeZone: "Asia/Kolkata" },

  // A handoff counts as on time if sent within this many minutes of the call ending.
  handoffTargetMinutes: 5,

  // Average project size from the case brief, in lakh rupees. Used only for the
  // "pipeline at stake" figure, which is labelled indicative.
  avgProjectLakh: { low: 8, high: 14 },

  prices: {
    // Gemini 3.5 Flash-Lite, standard paid tier, USD per 1M tokens.
    // Source: ai.google.dev/gemini-api/docs/pricing (checked 2026-10-10).
    // Output price includes thinking tokens. The free tier is not counted here:
    // this is the cost at list price.
    geminiInputUsdPerMTok: 0.3 as number | null,
    geminiOutputUsdPerMTok: 2.5 as number | null,

    // Gemini is priced in USD. Needs a rate from the owner. null = not set.
    usdToInr: 88 as number | null, // set by the owner, 2026-10-10

    // Vaani testing price, in rupees per minute (from the owner).
    vaaniInrPerMinute: 0.5 as number | null,

    // Free tier = 0 (rupees per call)
    calcomPerCall: 0,
    hubspotPerCall: 0,
    resendPerCall: 0,
    neonPerCall: 0,
    vercelPerCall: 0,
  },
} as const;
