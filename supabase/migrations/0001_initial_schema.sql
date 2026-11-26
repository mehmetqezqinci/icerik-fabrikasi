-- V6 initial schema. Apply with Supabase CLI after project provisioning.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'V6 Yönetici',
  organization_name text not null default 'Dilara Ceylan Yardım Derneği',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram')),
  provider text not null check (provider in ('metricool', 'meta')),
  external_account_id text,
  account_label text,
  connection_status text not null default 'pending' check (connection_status in ('pending','connected','error','disconnected')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, platform, provider, external_account_id)
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  external_content_id text,
  platform text not null default 'instagram',
  content_type text not null check (content_type in ('reel','post','story','carousel','other')),
  caption text,
  permalink text,
  published_at timestamptz,
  content_category text,
  workflow_status text not null default 'published' check (workflow_status in ('idea','script','filming','editing','review','scheduled','published','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, platform, external_content_id)
);

create table if not exists public.content_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  captured_at timestamptz not null default now(),
  reach bigint,
  views bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  follows bigint,
  avg_watch_seconds numeric(12,3),
  retention_percent numeric(7,3),
  skip_rate_percent numeric(7,3),
  raw_metrics jsonb not null default '{}'::jsonb,
  source text not null default 'metricool',
  created_at timestamptz not null default now()
);

create table if not exists public.account_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  captured_on date not null,
  followers bigint,
  reach bigint,
  views bigint,
  engaged_accounts bigint,
  followers_gained bigint,
  followers_lost bigint,
  raw_metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(social_account_id, captured_on)
);

create table if not exists public.field_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date,
  title text not null,
  activity_type text,
  status text not null default 'planned' check (status in ('planned','in_progress','completed','cancelled')),
  verified_numbers jsonb not null default '[]'::jsonb,
  anonymized_story text,
  approved_visuals jsonb not null default '[]'::jsonb,
  restrictions text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_analysis_id uuid,
  title text not null,
  hook text,
  format text,
  objective text,
  rationale text,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new','saved','scripted','rejected','produced')),
  created_at timestamptz not null default now()
);

create table if not exists public.content_scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_idea_id uuid references public.content_ideas(id) on delete set null,
  title text not null,
  script jsonb not null default '{}'::jsonb,
  caption text,
  cta text,
  approval_status text not null default 'draft' check (approval_status in ('draft','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  hypothesis text,
  variable_name text,
  start_date date,
  end_date date,
  result_summary text,
  status text not null default 'planned' check (status in ('planned','running','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_type text not null,
  model text,
  prompt_version text,
  input_window jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.brand_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_key text not null,
  memory_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, memory_key)
);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running','succeeded','partial','failed')),
  records_seen integer not null default 0,
  records_saved integer not null default 0,
  error_summary text
);

do $$
declare t text;
begin
  foreach t in array array[
    'social_accounts','content_items','content_metric_snapshots',
    'account_metric_snapshots','field_activities','content_ideas','content_scripts',
    'experiments','ai_analyses','brand_memory','sync_runs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || '_owner_all', t);
  end loop;
end $$;

-- profiles uses id rather than user_id.
create policy profiles_owner_all on public.profiles
  for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create index if not exists content_items_user_published_idx on public.content_items(user_id, published_at desc);
create index if not exists content_metrics_item_captured_idx on public.content_metric_snapshots(content_item_id, captured_at desc);
create index if not exists account_metrics_account_date_idx on public.account_metric_snapshots(social_account_id, captured_on desc);
create index if not exists field_activities_user_date_idx on public.field_activities(user_id, activity_date desc);

create table if not exists public.legacy_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_app text not null default 'Dilara Ceylan Content Factory V5',
  source_version integer,
  exported_at timestamptz,
  imported_at timestamptz not null default now(),
  payload_sha256 text not null,
  payload jsonb not null,
  import_summary jsonb not null default '{}'::jsonb,
  unique(user_id, payload_sha256)
);
alter table public.legacy_imports enable row level security;
create policy legacy_imports_owner_all on public.legacy_imports
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Idempotent metric snapshots: repeated Metricool imports do not duplicate identical readings.
alter table public.content_metric_snapshots add column if not exists snapshot_key text;
create unique index if not exists content_metric_snapshots_item_key_uidx
  on public.content_metric_snapshots(content_item_id, snapshot_key)
  where snapshot_key is not null;
