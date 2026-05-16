-- ============================================================
-- Add Coassemble linkage to movers + ensure email uniqueness
-- ============================================================

alter table movers
  add column if not exists coassemble_id text;

create unique index if not exists movers_email_lower_idx
  on movers (lower(email))
  where email is not null;

create unique index if not exists movers_coassemble_id_idx
  on movers (coassemble_id)
  where coassemble_id is not null;
