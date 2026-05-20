-- Branch webhook receiver: audit log + dedup store.
-- Every inbound Branch webhook (sandbox or production) is recorded here.

create table if not exists branch_webhook_events (
  id uuid primary key default uuid_generate_v4(),
  event_id text not null,
  environment text not null check (environment in ('sandbox', 'production')),
  event_type text,
  client_id text,
  client_type text,
  raw_payload jsonb not null,
  decrypted_data jsonb,
  source_ip text,
  ip_allowed boolean,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);

-- Dedup key: Branch may retry an event_id; unique per environment.
create unique index if not exists branch_webhook_events_event_env_idx
  on branch_webhook_events (event_id, environment);

create index if not exists branch_webhook_events_received_idx
  on branch_webhook_events (received_at desc);

create index if not exists branch_webhook_events_type_idx
  on branch_webhook_events (event_type);

alter table branch_webhook_events enable row level security;
