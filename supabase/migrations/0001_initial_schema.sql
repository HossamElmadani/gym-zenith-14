-- Create staff table referencing auth.users(id)
create table public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('owner', 'receptionist')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Create coaches table
create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  audience text not null check (audience in ('men', 'women')),
  specialty text not null,
  working_days integer[] default '{}',
  start_time text,
  end_time text,
  joined_at date not null default current_date,
  status text not null default 'active',
  photo_url text -- (Optional profile picture URL from Supabase Storage)
);

-- Create members table
create table public.members (
  id text primary key,
  name text not null,
  cin text not null,
  phone text not null,
  gender text not null,
  age integer,
  current_plan text not null,
  sub_start date not null,
  sub_end date not null,
  sub_months integer not null default 0,
  insurance_end date,
  coach_id uuid references public.coaches(id) on delete set null,
  photo_url text -- (Optional profile picture URL from Supabase Storage)
);

-- Create cash_logs table
create table public.cash_logs (
  id uuid primary key default gen_random_uuid(),
  member_id text references public.members(id) on delete set null,
  transaction_type text not null,
  amount numeric not null,
  processed_by uuid references public.staff(id) on delete set null,
  plan_code text,
  note text,
  created_at timestamptz not null default now()
);

-- Create member_renewals table
create table public.member_renewals (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references public.members(id) on delete cascade,
  date date not null default current_date,
  plan text not null,
  months integer not null,
  amount numeric not null
);

-- Create attendance table
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  person_id text not null,
  person_type text not null check (person_type in ('member', 'coach')),
  check_in_time timestamptz not null default now()
);

-- Create freezes table
create table public.freezes (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references public.members(id) on delete cascade,
  freeze_start date not null,
  freeze_end date not null
);

-- Helper functions for RLS RBAC
create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
    where id = auth.uid() and role = 'owner' and is_active = true
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
    where id = auth.uid() and is_active = true
  );
$$;

-- Trigger function to automatically create a profile in public.staff when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.staff (id, name, email, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'receptionist'),
    true
  );
  return new;
end;
$$;

-- Trigger linking the function to auth.users inserts
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC to renew member, keeping changes atomic
create or replace function public.renew_member(
  p_member_id text,
  p_new_sub_end date,
  p_plan text,
  p_months integer,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Restrict execution to authenticated staff
  if not public.is_staff() then
    raise exception 'Unauthorized';
  end if;

  -- 1. Insert into cash_logs
  insert into public.cash_logs (member_id, transaction_type, amount, processed_by, plan_code, note)
  values (
    p_member_id,
    'renewal',
    p_amount,
    auth.uid(),
    p_plan,
    'Renewal · ' || p_plan
  );

  -- 2. Insert into member_renewals
  insert into public.member_renewals (member_id, date, plan, months, amount)
  values (
    p_member_id,
    current_date,
    p_plan,
    p_months,
    p_amount
  );

  -- 3. Update members table
  update public.members
  set
    sub_start = current_date,
    sub_end = p_new_sub_end,
    current_plan = p_plan,
    sub_months = p_months
  where id = p_member_id;
end;
$$;

-- Enable Row Level Security (RLS) on all tables
alter table public.staff enable row level security;
alter table public.coaches enable row level security;
alter table public.members enable row level security;
alter table public.cash_logs enable row level security;
alter table public.member_renewals enable row level security;
alter table public.attendance enable row level security;
alter table public.freezes enable row level security;

-- Policies for staff table
create policy "Allow all authenticated users to read staff" on public.staff
  for select to authenticated using (true);

create policy "Allow owners to insert staff" on public.staff
  for insert to authenticated with check (public.is_owner());

create policy "Allow owners to update staff" on public.staff
  for update to authenticated using (public.is_owner()) with check (public.is_owner());

create policy "Allow owners to delete staff" on public.staff
  for delete to authenticated using (public.is_owner());

-- Policies for other tables ensuring only authenticated staff can access them
create policy "Allow staff full access to coaches" on public.coaches
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "Allow staff full access to members" on public.members
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "Allow staff full access to cash_logs" on public.cash_logs
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "Allow staff full access to member_renewals" on public.member_renewals
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "Allow staff full access to attendance" on public.attendance
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "Allow staff full access to freezes" on public.freezes
  for all to authenticated using (public.is_staff()) with check (public.is_staff());


-- ==========================================
-- STORAGE SETUP (Avatars)
-- ==========================================

-- 1. Create the 'avatars' storage bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Enable select (read) policy for anyone on the 'avatars' bucket
create policy "Allow public read access to avatars" on storage.objects
  for select using (bucket_id = 'avatars');

-- 3. Enable insert (upload) policy for authenticated users
create policy "Allow authenticated upload to avatars" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

-- 4. Enable update/delete policy for authenticated users
create policy "Allow authenticated update to avatars" on storage.objects
  for update to authenticated using (bucket_id = 'avatars');

create policy "Allow authenticated delete from avatars" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars');