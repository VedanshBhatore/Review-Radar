-- ReviewRadar Supabase schema
--
-- Design note: both tables store the full domain object as a single `data` jsonb
-- blob rather than a fully normalized schema. The app's data model (Review[],
-- Theme[], prds map, feedback[]) is already represented by lib/types.ts and is
-- always read/written as one unit per report, so normalizing into many tables
-- would add joins without adding safety. `app_id` / `created_at` are pulled out
-- as real columns purely to make the two query patterns the app needs
-- (cache lookup by app, "recent report for this app") indexable.

create table if not exists reviews_cache (
  app_id text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);

create table if not exists reports (
  id text primary key,
  app_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists reports_app_id_created_at_idx
  on reports (app_id, created_at desc);

-- Row Level Security: this app only ever talks to Supabase from server routes
-- using the service role key, which bypasses RLS. RLS is still enabled here as
-- a safety net in case the anon/public key is ever exposed to the client --
-- with no policies defined, that key gets zero access.
alter table reviews_cache enable row level security;
alter table reports enable row level security;
