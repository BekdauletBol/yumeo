create table if not exists figures (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  url text not null,
  page_number int,
  caption text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

alter table figures enable row level security;
create policy "users own figures" on figures for all using (project_id in (select id from projects where user_id = auth.uid()::text));

ALTER TABLE chunks ADD COLUMN IF NOT EXISTS verified_by_human BOOLEAN DEFAULT false;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS verified_by_user_id TEXT;

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  hashed_key text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
alter table api_keys enable row level security;
create policy "users own api keys" on api_keys for all using (user_id = auth.uid()::text);
