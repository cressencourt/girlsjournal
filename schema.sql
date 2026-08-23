-- ============================================================
--  The Girls' Little Journal — Supabase schema
--  Run this once in your Supabase project's SQL editor
--  (Project → SQL Editor → New query → paste → Run).
-- ============================================================

-- One JSON document holds the whole journal (girls, schedule,
-- activities, journal entries, progress, food, ideas, recap,
-- parents' notes...). Simple, fast to ship, and works nicely
-- with Supabase Realtime so parents & the au pair see updates
-- live. See the bottom of this file if you'd rather split this
-- into fully relational tables later.

create table if not exists journal_data (
  id int primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on every write
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists journal_data_set_updated_at on journal_data;
create trigger journal_data_set_updated_at
  before update on journal_data
  for each row execute function set_updated_at();

-- Seed the single row the app reads/writes (id = 1).
-- The app will create this itself on first load if it's missing,
-- but inserting it here avoids a race on the very first visit.
insert into journal_data (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- ------------------------------------------------------------
--  Access: this app has no login screen — the family shares a
--  private link instead. That means anyone with the Supabase
--  anon key (bundled in the deployed site) can read/write.
--  That's fine for a private family tool, but it does mean the
--  link itself is what keeps the journal private — don't post
--  it publicly. Enable Supabase Auth later if you want real
--  logins per person.
-- ------------------------------------------------------------

alter table journal_data enable row level security;

drop policy if exists "anyone can read the journal" on journal_data;
create policy "anyone can read the journal"
  on journal_data for select
  using (true);

drop policy if exists "anyone can update the journal" on journal_data;
create policy "anyone can update the journal"
  on journal_data for update
  using (true)
  with check (true);

drop policy if exists "anyone can insert the journal row" on journal_data;
create policy "anyone can insert the journal row"
  on journal_data for insert
  with check (true);

-- Enable realtime updates for this table (Database → Replication
-- in the dashboard does the same thing if this line errors out
-- on your plan).
alter publication supabase_realtime add table journal_data;


-- ============================================================
--  OPTIONAL — fully relational schema
-- ============================================================
-- The original brief listed one table per entity (users, girls,
-- schedules, activities, daily_journal, progress, food,
-- favourite_activities, activity_ideas, weekly_recaps,
-- parents_notes). The app currently uses the single-JSON-row
-- approach above because it ships faster and is easier to keep
-- in sync in real time. If you'd like to migrate to real
-- normalized tables (useful once you want per-person logins,
-- fine-grained permissions, or to query activities/progress with
-- SQL directly), tell Claude and it can generate this migration
-- plus the matching App.jsx rewrite.
