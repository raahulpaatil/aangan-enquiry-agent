import { StepList } from "@/components/StepList";
import type { StepRecord } from "@/lib/db";
import type { Analysis } from "@/lib/analysis-schema";
import { formatRupees, Money } from "@/lib/cost";

export type CallDetailData = {
  id: string;
  name: string | null;
  area: string | null;
  outcome: "book" | "not_a_fit" | "needs_human";
  outcomeLabel: string;
  priceAsked: boolean;
  handoffNote: string | null;
  reason: string | null;
  analysis: Analysis;
  steps: StepRecord[];
  tokens: { input: number | null; output: number | null };
  minutes: number;
  cost: { gemini: Money; vaani: Money; other: number; total: Money };
  transcript: string;
  callTime: string;
  ids: { booking: string | null; email: string | null; contact: string | null; deal: string | null; note: string | null };
  aiMarkedWrong: boolean;
  callbackNote: string | null;
};

const dash = (v: unknown) => (v === null || v === undefined || v === "" ? "Not said" : String(v));

export function CallDetailView({ d }: { d: CallDetailData }) {
  const a = d.analysis;
  const tone = d.outcome === "book" ? "ok" : d.outcome === "needs_human" ? "warn" : "bad";
  const hasIds = Object.values(d.ids).some(Boolean);

  return (
    <>
      <h1>{d.name ?? "Unnamed caller"}{d.area ? ` · ${d.area}` : ""}</h1>
      <p className="sub">
        <span className={`pill ${tone}`}>{d.outcomeLabel}</span>{" "}
        {d.priceAsked && <span className="pill warn">Asked about price</span>}{" "}
        {d.aiMarkedWrong && <span className="pill bad">Marked: AI got it wrong</span>}
      </p>

      <div className="card">
        <h2>Handoff note</h2>
        <p style={{ margin: 0 }}>{d.handoffNote}</p>
        {d.reason && <p className="hint">Why: {d.reason}</p>}
        {d.callbackNote && <p className="hint">Front desk note: {d.callbackNote}</p>}
      </div>

      <div className="card">
        <h2>What was said</h2>
        <dl>
          <dt>Project type</dt><dd>{dash(a.project_type)}</dd>
          <dt>What needs designing</dt><dd>{dash(a.scope)}</dd>
          <dt>Size (sq ft)</dt><dd>{dash(a.sq_ft)}</dd>
          <dt>Timeline</dt><dd>{dash(a.timeline)}</dd>
          <dt>Who decides</dt><dd>{dash(a.decision_maker)}</dd>
          <dt>Budget said</dt><dd>{dash(a.budget_stated)}</dd>
          <dt>Preferred slot</dt><dd>{dash(a.preferred_slot)}</dd>
          <dt>Open questions</dt>
          <dd>{a.unanswered_questions.length ? a.unanswered_questions.join("; ") : "None"}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Handoff sent</h2>
        {d.steps.length > 0 && <StepList steps={d.steps} />}
        {hasIds && (
          <dl style={{ marginTop: "0.75rem" }}>
            {d.ids.booking && (<><dt>Booking ID</dt><dd>{d.ids.booking}</dd></>)}
            {d.ids.email && (<><dt>Email ID</dt><dd>{d.ids.email}</dd></>)}
            {d.ids.contact && (<><dt>HubSpot contact</dt><dd>{d.ids.contact}</dd></>)}
            {d.ids.deal && (<><dt>HubSpot deal</dt><dd>{d.ids.deal}</dd></>)}
            {d.ids.note && (<><dt>HubSpot note</dt><dd>{d.ids.note}</dd></>)}
          </dl>
        )}
        {d.outcome !== "book" && <p className="hint">No booking or deal is made for this outcome. The front desk reviews it in the Review queue.</p>}
      </div>

      <div className="card">
        <h2>Cost of this call</h2>
        <dl>
          <dt>Gemini</dt><dd>{formatRupees(d.cost.gemini)} ({d.tokens.input ?? 0} in, {d.tokens.output ?? 0} out tokens)</dd>
          <dt>Vaani</dt><dd>{formatRupees(d.cost.vaani)} ({d.minutes} min)</dd>
          <dt>Other services</dt><dd>{formatRupees(d.cost.other)} (free tiers)</dd>
          <dt>Total</dt><dd>{formatRupees(d.cost.total)}</dd>
        </dl>
      </div>

      <div className="card">
        <h2>Transcript</h2>
        <p className="transcript">{d.transcript}</p>
      </div>
    </>
  );
}
