import { z } from "zod";

export const AnalysisSchema = z.object({
  name: z.string().nullable(),
  area: z.string().nullable(),
  project_type: z.enum(["residential", "commercial"]).nullable(),
  scope: z.string().nullable(),
  sq_ft: z.number().nullable(),
  timeline: z.string().nullable(),
  decision_maker: z.string().nullable(),
  budget_stated: z.string().nullable(),
  price_asked: z.boolean(),
  preferred_slot: z.string().nullable(),
  outcome: z.enum(["book", "not_a_fit", "needs_human"]),
  reason: z.string().nullable(),
  handoff_note: z.string(),
  unanswered_questions: z.array(z.string()),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

export const OUTCOME_LABEL: Record<Analysis["outcome"], string> = {
  book: "Qualified",
  not_a_fit: "Not the right fit",
  needs_human: "Needs a person",
};
