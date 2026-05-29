# Supabase migration plan (Phase 6 prep)

The app is currently persisting through `gymStore` in `src/lib/gym-store.ts`,
which writes to `localStorage`. The store's public API mirrors what a Supabase
implementation needs, so swapping the persistence layer in a later phase is a
focused change (no UI rewrites required).

## Target schema

```sql
-- Members directory (one row per CIN)
create table public.members (
  id text primary key,                -- permanent ID, also encoded in QR
  cin text not null unique,
  name text not null,
  phone text not null,
  gender text not null check (gender in ('male','female')),
  plan text not null check (plan in ('1M','3M','6M','12M')),
  sub_start date not null,
  sub_end date not null,
  sub_months int not null,
  created_at timestamptz not null default now()
);

-- Cash payments (registration / renewal / dropin)
create table public.cash_logs (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),
  member_id text references public.members(id) on delete set null,
  member_name text,
  amount_mad numeric(10,2) not null,
  kind text not null check (kind in ('registration','renewal','dropin','other')),
  plan_code text check (plan_code in ('1M','3M','6M','12M')),
  note text
);

-- Subscription history per member
create table public.member_renewals (
  id uuid primary key default gen_random_uuid(),
  member_id text references public.members(id) on delete cascade,
  date date not null,
  plan text not null,
  months int not null,
  amount_mad numeric(10,2) not null
);

-- Check-ins
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  member_id text references public.members(id) on delete cascade,
  ts timestamptz not null default now()
);

-- Freezes
create table public.freezes (
  member_id text references public.members(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  primary key (member_id, from_date)
);
```

All timestamps are stored in UTC; the UI converts to `Africa/Casablanca`
through `src/lib/gym-tz.ts`.

## Swap-in points

| Store call            | Replaces with                                 |
| --------------------- | --------------------------------------------- |
| `addMember`           | `insert into members ...`                     |
| `renewMember`         | `update members + insert cash_logs + insert member_renewals` |
| `recordCheckIn`       | `insert into checkins`                        |
| `freezeMember`        | `insert into freezes + update members.sub_end`|
| `logCash`             | `insert into cash_logs`                       |
| selectors             | RPCs or views (`cash_today`, `expiring_week`) |
