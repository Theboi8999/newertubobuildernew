-- TurboBuilder Complete Database Setup
-- Run this in Supabase SQL Editor

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  is_authorized boolean default false,
  is_admin boolean default false,
  generation_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  system_type text not null,
  prompt text not null,
  status text default 'queued',
  progress integer default 0,
  spec_items jsonb default '[]',
  output_url text,
  output_metadata jsonb default '{}',
  rating integer,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists script_library (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  description text,
  luau_code text not null,
  keywords text[] default '{}',
  usage_count integer default 0,
  quality_score integer default 75,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists prompt_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  prompt text,
  enhanced_prompt text,
  system_type text,
  quality_score integer,
  style text,
  scale text,
  created_at timestamptz default now()
);

create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text not null,
  reason text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists knowledge_overrides (
  section text primary key,
  content text not null,
  updated_at timestamptz default now()
);

-- AI knowledge entries from the admin research panel
create table if not exists ai_knowledge (
  id uuid default gen_random_uuid() primary key,
  topic text not null,
  category text default 'building',
  content text not null,
  source text default 'AI Research',
  quality_score integer default 80,
  times_used integer default 0,
  created_at timestamptz default now()
);

-- Research run log
create table if not exists research_logs (
  id uuid default gen_random_uuid() primary key,
  topic text not null,
  status text default 'researching',
  findings text,
  created_at timestamptz default now()
);

-- Pre-authorized emails — users whose accounts are auto-authorized on signup
create table if not exists authorized_emails (
  email text primary key,
  created_at timestamptz default now()
);

-- ── Triggers ──────────────────────────────────────────────────────────────

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
declare
  _is_admin boolean;
  _is_authorized boolean;
begin
  select (new.email = 'zack@myerscough.info') into _is_admin;
  select (
    new.email = 'zack@myerscough.info' or
    exists (select 1 from public.authorized_emails where email = new.email)
  ) into _is_authorized;

  insert into public.profiles (id, email, is_admin, is_authorized)
  values (new.id, new.email, _is_admin, _is_authorized)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── RPCs ──────────────────────────────────────────────────────────────────

create or replace function increment_generation_count(uid uuid)
returns void as $$
  update profiles set generation_count = generation_count + 1 where id = uid;
$$ language sql security definer;

create or replace function increment_script_usage(script_id uuid)
returns void as $$
  update script_library set usage_count = usage_count + 1, updated_at = now() where id = script_id;
$$ language sql security definer;

-- ── RLS ───────────────────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table generations enable row level security;
alter table script_library enable row level security;
alter table prompt_history enable row level security;
alter table waitlist enable row level security;
alter table knowledge_overrides enable row level security;
alter table ai_knowledge enable row level security;
alter table research_logs enable row level security;
alter table authorized_emails enable row level security;

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all using (auth.uid() = id);

drop policy if exists "own generations" on generations;
create policy "own generations" on generations for all using (auth.uid() = user_id);

drop policy if exists "read scripts" on script_library;
create policy "read scripts" on script_library for select using (true);

drop policy if exists "own history" on prompt_history;
create policy "own history" on prompt_history for all using (auth.uid() = user_id);

drop policy if exists "insert waitlist" on waitlist;
create policy "insert waitlist" on waitlist for insert with check (true);

drop policy if exists "read knowledge" on knowledge_overrides;
create policy "read knowledge" on knowledge_overrides for select using (true);

drop policy if exists "read ai_knowledge" on ai_knowledge;
create policy "read ai_knowledge" on ai_knowledge for select using (true);

drop policy if exists "read research_logs" on research_logs;
create policy "read research_logs" on research_logs for select using (true);

-- ── Storage ───────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public) values ('generations', 'generations', true) on conflict (id) do nothing;

drop policy if exists "public read" on storage.objects;
create policy "public read" on storage.objects for select using (bucket_id = 'generations');
drop policy if exists "service upload" on storage.objects;
create policy "service upload" on storage.objects for insert with check (bucket_id = 'generations');

-- ── Pre-authorize owner ───────────────────────────────────────────────────

insert into profiles (id, email, is_admin, is_authorized)
select id, email, true, true from auth.users where email = 'zack@myerscough.info'
on conflict (id) do update set is_admin = true, is_authorized = true;

select 'TurboBuilder setup complete!' as result;
