-- BrandPushers Database Schema

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'pending' check (role in ('admin', 'member', 'pending')),
  created_at timestamptz default now(),
  approved_at timestamptz
);

-- Applications
create table if not exists public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  brand_stage text,
  answers jsonb default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- Phases
create table if not exists public.phases (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  "order" int not null default 0,
  created_at timestamptz default now()
);

-- Member Phases
create table if not exists public.member_phases (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.profiles(id) on delete cascade,
  phase_id uuid references public.phases(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  notes text,
  updated_at timestamptz default now(),
  unique(member_id, phase_id)
);

-- Resources
create table if not exists public.resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  url text not null,
  category text default 'general',
  created_at timestamptz default now(),
  created_by uuid references auth.users
);

-- Documents
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  file_url text not null,
  phase_id uuid references public.phases(id),
  uploaded_at timestamptz default now()
);

-- Auto-create profile on signup
-- Note: minkovgroup@gmail.com is auto-assigned 'admin' role
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    case when new.email = 'minkovgroup@gmail.com' then 'admin' else 'pending' end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.phases enable row level security;
alter table public.member_phases enable row level security;
alter table public.resources enable row level security;
alter table public.documents enable row level security;

-- Profiles: users can read own, admins can read all
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update profiles" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Applications: users can insert own, admins can read/update all
create policy "Users can insert own application" on applications for insert with check (auth.uid() = user_id);
create policy "Users can view own application" on applications for select using (auth.uid() = user_id);
create policy "Admins can view all applications" on applications for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update applications" on applications for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Phases: everyone can read, admins can manage
create policy "Anyone can view phases" on phases for select using (true);
create policy "Admins can manage phases" on phases for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Member phases: members can view own, admins can manage
create policy "Members can view own phases" on member_phases for select using (auth.uid() = member_id);
create policy "Admins can manage member phases" on member_phases for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Resources: everyone can read, admins can manage
create policy "Anyone can view resources" on resources for select using (true);
create policy "Admins can manage resources" on resources for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Documents: users manage own, admins can view all
create policy "Users can manage own documents" on documents for all using (auth.uid() = user_id);
create policy "Admins can view all documents" on documents for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Seed admin (will be created when they sign up, but set role)
-- Run after the admin signs up: UPDATE profiles SET role = 'admin' WHERE email = 'minkovgroup@gmail.com';
