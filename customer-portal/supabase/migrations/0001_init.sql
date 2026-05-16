-- ============================================================
-- Moving Muscle — initial schema
-- Idempotent: safe to run multiple times.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============ ENUMS ============
do $$ begin
  create type service_type as enum ('load_only', 'unload_only', 'load_and_unload', 'in_home_help');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type property_type as enum ('apartment', 'house', 'storage_unit', 'office');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type booking_status as enum (
    'pending', 'contacted', 'confirmed', 'scheduled',
    'in_progress', 'completed', 'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type address_role as enum ('pickup', 'dropoff', 'single');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type schedule_day as enum ('today', 'tomorrow', 'scheduled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type time_window as enum ('morning', 'afternoon', 'evening');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type helpers_action as enum ('loading', 'unloading', 'both', 'in_home');
exception when duplicate_object then null;
end $$;

-- ============ CORE TABLES ============

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_email_lower_idx
  on customers (lower(email));

create table if not exists addresses (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  formatted text not null,
  street text,
  city text,
  state text,
  zip text,
  city_code text,
  lat numeric(10,7),
  lng numeric(10,7),
  created_at timestamptz not null default now()
);

create table if not exists booking_requests (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete restrict,
  service_type service_type not null,
  property_type property_type,
  truck_size text,
  helpers_action helpers_action,
  helpers int not null check (helpers between 1 and 12),
  hours int not null check (hours between 1 and 24),
  hourly_rate numeric(10,2) not null default 65,
  total_price numeric(10,2) not null,
  schedule_day schedule_day not null,
  schedule_date date,
  schedule_time_window time_window not null,
  time_flexibility_notes text,
  notes text,
  status booking_status not null default 'pending',
  source text not null default 'customer_portal',
  glide_row_id text,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists booking_addresses (
  booking_request_id uuid not null references booking_requests(id) on delete cascade,
  address_id uuid not null references addresses(id) on delete restrict,
  role address_role not null,
  sequence int not null default 1,
  primary key (booking_request_id, address_id, role)
);

-- ============ SKELETONS (futuro: ambassadors, movers, jobs, payouts) ============

create table if not exists ambassadors (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  referral_code text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists movers (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete set null,
  ambassador_id uuid references ambassadors(id) on delete set null,
  name text not null,
  email text,
  phone text,
  status text not null default 'applied',
  glide_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default uuid_generate_v4(),
  ambassador_id uuid references ambassadors(id) on delete set null,
  mover_id uuid references movers(id) on delete set null,
  name text not null,
  email text,
  phone text,
  city text,
  status text not null default 'applied',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  booking_request_id uuid references booking_requests(id) on delete set null,
  scheduled_at timestamptz,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists job_assignments (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references jobs(id) on delete cascade,
  mover_id uuid not null references movers(id) on delete restrict,
  role text not null default 'helper',
  created_at timestamptz not null default now()
);

create table if not exists payouts (
  id uuid primary key default uuid_generate_v4(),
  recipient_type text not null check (recipient_type in ('ambassador', 'mover')),
  recipient_id uuid not null,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  reason text not null,
  reference_table text,
  reference_id uuid,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  paid_via text,
  external_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ TRIGGERS ============

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare
  t text;
  tables text[] := array[
    'customers', 'booking_requests', 'ambassadors',
    'movers', 'applications', 'jobs', 'payouts'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists %I_updated_at on %I', t, t);
    execute format(
      'create trigger %I_updated_at before update on %I '
      'for each row execute function set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ============ INDEXES ============

create index if not exists booking_requests_customer_idx on booking_requests(customer_id);
create index if not exists booking_requests_status_idx on booking_requests(status);
create index if not exists booking_requests_created_idx on booking_requests(created_at desc);
create index if not exists addresses_customer_idx on addresses(customer_id);
create index if not exists booking_addresses_booking_idx on booking_addresses(booking_request_id);
create index if not exists applications_ambassador_idx on applications(ambassador_id);
create index if not exists payouts_recipient_idx on payouts(recipient_type, recipient_id);
create index if not exists payouts_status_idx on payouts(status);

-- ============ RLS (deny-by-default; service role bypasses) ============

alter table customers          enable row level security;
alter table addresses          enable row level security;
alter table booking_requests   enable row level security;
alter table booking_addresses  enable row level security;
alter table ambassadors        enable row level security;
alter table movers             enable row level security;
alter table applications       enable row level security;
alter table jobs               enable row level security;
alter table job_assignments    enable row level security;
alter table payouts            enable row level security;

-- No anon policies yet. Server (service role) bypasses RLS.
-- Future: add owner-scoped policies for authenticated users (mover/customer/ambassador self-reads).
