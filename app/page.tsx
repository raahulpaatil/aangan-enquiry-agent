import Link from "next/link";
import { db, CallRow } from "@/lib/db";
import { OUTCOME_LABEL } from "@/lib/analysis-schema";
import { getMetrics } from "@/lib/metrics";
import { formatRupees } from "@/lib/cost";
import { CallList } from "@/components/CallList";
import { MoreDetail } from "@/components/MoreDetail";

export const dynamic = "force-dynamic";

const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n)}%`);
const rupees = (v: number | "not set" | null) => (v === null ? "—" : v === "not set" ? "not set" : formatRupees(v));

function lakh(v: number) {
  return v >= 100 ? `₹${(v / 100).toFixed(2)} crore` : `₹${v} lakh`;
}

export default async function Dashboard() {
  const m = await getMetrics();
  const recent = (await db().query(
    "select id, name, area, outcome, cal_booking_uid from calls order by created_at desc limit 20",
  )) as Pick<CallRow, "id" | "name" | "area" | "outcome" | "cal_booking_uid">[];

  if (m.calls === 0) {
    return (
      <main className="page">
        <h1>Dashboard</h1>
        <p className="sub">What the system handled, and what it cost.</p>
        <div className="card empty">
          <h2>No calls yet</h2>
          <p className="sub">Paste your first call transcript and the numbers will appear here.</p>
          <Link href="/new-call" className="btn">Add a call</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>Dashboard</h1>
      <p className="sub">What the system handled, and what it cost.</p>

      <div className="kpis">
        <div className="card kpi">
          <div className="kpi-num">{m.calls}</div>
          <div className="kpi-label">Calls handled</div>
        </div>
        <div className="card kpi">
          <div className="kpi-num">{m.bookings}</div>
          <div className="kpi-label">Bookings</div>
        </div>
        <div className="card kpi">
          <div className="kpi-num">{pct(m.handoffOnTimePct)}</div>
          <div className="kpi-label">Handoffs sent within 5 min of call end</div>
          <div className="kpi-note">{m.qualifiedCalls ? `${m.handoffOnTime} of ${m.qualifiedCalls} qualified calls` : "No qualified calls yet"}</div>
        </div>
        <div className="card kpi">
          <div className="kpi-num">{rupees(m.costPerBooking)}</div>
          <div className="kpi-label">Run cost per booking</div>
          <div className="kpi-note">{m.bookings ? "All running costs ÷ bookings" : "No bookings yet"}</div>
        </div>
      </div>

      <MoreDetail>
        <div className="card">
          <dl>
            <dt>Qualified</dt><dd>{pct(m.qualifiedPct)} of calls</dd>
            <dt>Outside 10am–7pm IST</dt><dd>{pct(m.outsideHoursPct)} of calls</dd>
            <dt>AI error rate</dt>
            <dd>
              {pct(m.aiErrorPct)}{" "}
              <span className="hint">
                ({m.markedWrong} marked wrong of {m.reviewed} calls the front desk reviews)
              </span>
            </dd>
            <dt>Cost per call</dt><dd>{rupees(m.costPerCall)}</dd>
            <dt>Total cost this month</dt><dd>{rupees(m.monthTotal)} <span className="hint">({m.monthCalls} calls)</span></dd>
            <dt>Pipeline at stake</dt>
            <dd>
              {m.bookings ? `${lakh(m.pipelineLakh.low)} – ${lakh(m.pipelineLakh.high)}` : "₹0"}{" "}
              <span className="hint">indicative, before conversion</span>
            </dd>
          </dl>
        </div>
        <div className="card">
          <h2>Why calls were not the right fit</h2>
          {m.reasons.length === 0 ? (
            <p className="hint">None yet.</p>
          ) : (
            m.reasons.map((r) => (
              <div className="list-item" key={r.reason}>
                <span>{r.reason}</span>
                <span className="pill">{r.n}</span>
              </div>
            ))
          )}
        </div>
      </MoreDetail>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2>Recent calls</h2>
        <CallList
          items={recent.map((r) => ({
            id: r.id,
            title: `${r.name ?? "Unnamed caller"}${r.area ? ` · ${r.area}` : ""}`,
            label: r.outcome === "book" && r.cal_booking_uid ? "Booked" : OUTCOME_LABEL[r.outcome],
            tone: r.outcome === "book" ? "ok" : r.outcome === "needs_human" ? "warn" : "bad",
          }))}
        />
      </div>
    </main>
  );
}
