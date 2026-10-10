import { config } from "@/config/app.config";
import { db } from "./db";
import { Money, runCost } from "./cost";
import { METRICS_SQL, NOT_A_FIT_REASONS_SQL, THIS_MONTH_FILTER } from "./metrics-sql";

type Raw = {
  calls: number;
  bookings: number;
  qualified: number;
  handoffs_on_time: number;
  reviewed: number;
  marked_wrong: number;
  outside_hours: number;
  input_tokens: string | number;
  output_tokens: string | number;
  minutes: number;
};

const NOT_SET = "not set" as const;
const pct = (n: number, d: number): number | null => (d === 0 ? null : (n / d) * 100);

function agg(r: Raw): { total: Money; calls: number } {
  return {
    calls: r.calls,
    total: runCost({
      calls: r.calls,
      inputTokens: Number(r.input_tokens),
      outputTokens: Number(r.output_tokens),
      minutes: Number(r.minutes),
    }),
  };
}

export async function getMetrics() {
  const sql = db();
  const [all] = (await sql.query(METRICS_SQL.replace("{where}", ""))) as Raw[];
  const [month] = (await sql.query(METRICS_SQL.replace("{where}", THIS_MONTH_FILTER))) as Raw[];
  const reasons = (await sql.query(NOT_A_FIT_REASONS_SQL)) as { reason: string; n: number }[];

  const total = agg(all).total;
  const { low, high } = config.avgProjectLakh;

  return {
    calls: all.calls,
    bookings: all.bookings,
    handoffOnTimePct: pct(all.handoffs_on_time, all.qualified),
    handoffOnTime: all.handoffs_on_time,
    qualifiedCalls: all.qualified,
    costPerBooking: all.bookings === 0 ? null : total === null ? NOT_SET : total / all.bookings,

    qualifiedPct: pct(all.qualified, all.calls),
    reasons,
    outsideHoursPct: pct(all.outside_hours, all.calls),
    aiErrorPct: pct(all.marked_wrong, all.reviewed),
    markedWrong: all.marked_wrong,
    reviewed: all.reviewed,
    costPerCall: all.calls === 0 ? null : total === null ? NOT_SET : total / all.calls,
    monthTotal: agg(month).total === null ? NOT_SET : (agg(month).total as number),
    monthCalls: month.calls,
    pipelineLakh: { low: all.bookings * low, high: all.bookings * high },
  };
}

export type Metrics = Awaited<ReturnType<typeof getMetrics>>;
