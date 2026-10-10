// The one query behind every dashboard figure. No imports, so scripts can run it directly.

// `{where}` is replaced with an optional filter (used for the "this month" total).
export const METRICS_SQL = `
select
  count(*)::int                                                              as calls,
  count(*) filter (where cal_booking_uid is not null)::int                   as bookings,
  count(*) filter (where outcome = 'book')::int                              as qualified,
  count(*) filter (where outcome = 'book'
    and handoff_sent_at is not null
    and handoff_sent_at <= call_time + (call_minutes * interval '1 minute') + interval '5 minutes')::int
                                                                              as handoffs_on_time,
  count(*) filter (where outcome in ('not_a_fit','needs_human'))::int        as reviewed,
  count(*) filter (where ai_marked_wrong)::int                               as marked_wrong,
  count(*) filter (where outside_hours)::int                                 as outside_hours,
  coalesce(sum(gemini_input_tokens), 0)::bigint                              as input_tokens,
  coalesce(sum(gemini_output_tokens), 0)::bigint                             as output_tokens,
  coalesce(sum(call_minutes), 0)::float8                                     as minutes
from calls
{where}`;

export const THIS_MONTH_FILTER = `where to_char(call_time at time zone 'Asia/Kolkata', 'YYYY-MM')
                                     = to_char(now() at time zone 'Asia/Kolkata', 'YYYY-MM')`;

export const NOT_A_FIT_REASONS_SQL = `
select coalesce(reason, 'No reason recorded') as reason, count(*)::int as n
from calls where outcome = 'not_a_fit'
group by 1 order by n desc, reason`;
