import { db, CallRow } from "@/lib/db";
import { OUTCOME_LABEL } from "@/lib/analysis-schema";
import { ReviewQueue, ReviewItem } from "@/components/ReviewQueue";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const rows = (await db().query(
    `select id, name, area, outcome, reason, handoff_note, ai_marked_wrong, callback_note
     from calls where outcome in ('not_a_fit','needs_human') order by created_at desc`,
  )) as Pick<CallRow, "id" | "name" | "area" | "outcome" | "reason" | "handoff_note" | "ai_marked_wrong" | "callback_note">[];

  const items: ReviewItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    area: r.area,
    outcomeLabel: OUTCOME_LABEL[r.outcome],
    tone: r.outcome === "needs_human" ? "warn" : "bad",
    reason: r.reason,
    handoffNote: r.handoff_note,
    aiMarkedWrong: r.ai_marked_wrong,
    callbackNote: r.callback_note,
  }));

  return (
    <main className="page narrow">
      <h1>Review queue</h1>
      <p className="sub">
        Check these each morning. If the AI sorted a call wrongly, mark it. That feeds the AI error rate on the Dashboard.
      </p>
      <ReviewQueue initial={items} />
    </main>
  );
}
