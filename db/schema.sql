-- Aangan Enquiry Agent: one table, one row per call.
-- Not yet applied. Needs approval before running.

create table if not exists calls (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),

  -- what the user typed in on the New call form
  transcript            text not null,
  call_minutes          numeric(6,2) not null,
  call_time             timestamptz not null,
  outside_hours         boolean not null,           -- outside 10am-7pm IST, worked out on save

  -- what Gemini returned (full JSON kept as-is) plus the headline fields
  analysis              jsonb,
  outcome               text not null check (outcome in ('book','not_a_fit','needs_human')),
  reason                text,
  name                  text,
  area                  text,
  price_asked           boolean not null default false,
  handoff_note          text,

  -- cost inputs (money is worked out from these plus the prices in config)
  gemini_input_tokens   integer,
  gemini_output_tokens  integer,                     -- includes thinking tokens

  -- pipeline: one entry per step with status, detail and ID
  steps                 jsonb not null default '[]'::jsonb,
  cal_booking_uid       text,
  email_id              text,
  hubspot_contact_id    text,
  hubspot_deal_id       text,
  hubspot_note_id       text,
  handoff_sent_at       timestamptz,

  -- Review queue
  ai_marked_wrong       boolean not null default false,
  callback_note         text
);

create index if not exists calls_created_at_idx on calls (created_at desc);
