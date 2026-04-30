-- ─── Yumeo Database Schema ─────────────────────────────────────────────────
-- Run this in your Supabase SQL editor to set up the schema.

-- Enable UUID extension (usually pre-enabled on Supabase)
create extension if not exists "pgcrypto";

-- ─── Tables ────────────────────────────────────────────────────────────────

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  name        text not null,
  description text,
  settings    jsonb not null default '{
    "agentModel": "openai/gpt-4o",
    "strictGrounding": true,
    "language": "en",
    "exportFormat": "markdown"
  }',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists materials (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  section     text not null check (section in ('references','drafts','figures','tables','templates','equations','diagrams')),
  name        text not null,
  content     text not null default '',
  storage_url text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  user_id     text not null,
  role        text not null check (role in ('user','assistant','system')),
  content     text not null,
  citations   jsonb not null default '[]',
  model       text,
  created_at  timestamptz not null default now()
);

create table if not exists user_plans (
  user_id        text primary key,
  plan           text not null default 'free' check (plan in ('free','pro')),
  stripe_customer_id    text,
  stripe_subscription_id text,
  updated_at     timestamptz not null default now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

create index if not exists idx_projects_user_id   on projects(user_id);
create index if not exists idx_materials_project   on materials(project_id);
create index if not exists idx_materials_section   on materials(project_id, section);
create index if not exists idx_messages_project    on messages(project_id, created_at);

-- ─── Triggers ───────────────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- ─── Row-Level Security ─────────────────────────────────────────────────────

alter table projects    enable row level security;
alter table materials   enable row level security;
alter table messages    enable row level security;
alter table user_plans  enable row level security;

-- Projects: users own their own rows
create policy "users own projects"
  on projects for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- Materials: scoped through project ownership
create policy "users own materials"
  on materials for all
  using (
    project_id in (
      select id from projects where user_id = auth.uid()::text
    )
  );

-- Messages: user_id column guard
create policy "users own messages"
  on messages for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- User plans: read own plan
create policy "users read own plan"
  on user_plans for select
  using (user_id = auth.uid()::text);

-- ─── Storage Buckets ────────────────────────────────────────────────────────

-- Create a bucket for material file uploads
-- Run this separately in Supabase dashboard → Storage, or via:
-- insert into storage.buckets (id, name, public) values ('materials', 'materials', false);

-- Storage policy: users can only access files in their own project folders
-- create policy "users own their files"
--   on storage.objects for all
--   using (bucket_id = 'materials' and auth.uid()::text = (storage.foldername(name))[1]);
-- ─── User Settings (API Keys) ───────────────────────────────────────────────

create table if not exists user_settings (
  user_id text primary key,
  encrypted_claude_key text,
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;
create policy "users manage own settings"
  on user_settings for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- ─── RAG pgvector ───────────────────────────────────────────────────────────

create extension if not exists vector;

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  content text not null,
  embedding vector(1536), -- Assuming 1536 for common embeddings, or 1024 for voyage/claude
  search_tsvector tsvector generated always as (to_tsvector('english', content)) stored,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_chunks_project on chunks(project_id);
create index if not exists idx_chunks_search on chunks using gin (search_tsvector);
-- create index if not exists idx_chunks_embedding on chunks using hnsw (embedding vector_cosine_ops);

alter table chunks enable row level security;
create policy "users own chunks"
  on chunks for all
  using (
    project_id in (
      select id from projects where user_id = auth.uid()::text
    )
  );

-- ─── Vector Search RPC ──────────────────────────────────────────────────────

create or replace function match_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_project_id uuid
)
returns table (
  id uuid,
  material_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    chunks.id,
    chunks.material_id,
    chunks.content,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where chunks.project_id = p_project_id
    and 1 - (chunks.embedding <=> query_embedding) > match_threshold
  order by chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ─── Hybrid Search RPC (vector + full-text) ───────────────────────────────

create or replace function match_chunks_hybrid (
  query_embedding vector(1536),
  query_text text,
  match_threshold float,
  match_count int,
  p_project_id uuid
)
returns table (
  id uuid,
  material_id uuid,
  content text,
  metadata jsonb,
  similarity float,
  text_rank float
)
language plpgsql
as $$
begin
  return query
  select
    chunks.id,
    chunks.material_id,
    chunks.content,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) as similarity,
    ts_rank(chunks.search_tsvector, websearch_to_tsquery('english', query_text)) as text_rank
  from chunks
  where chunks.project_id = p_project_id
    and 1 - (chunks.embedding <=> query_embedding) >= match_threshold
  order by (0.7 * (1 - (chunks.embedding <=> query_embedding)) + 0.3 * ts_rank(chunks.search_tsvector, websearch_to_tsquery('english', query_text))) desc
  limit match_count;
end;
$$;
