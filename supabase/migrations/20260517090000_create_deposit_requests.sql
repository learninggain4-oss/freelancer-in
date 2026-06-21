-- Deposit requests submitted by users for manual admin verification
create table if not exists public.deposit_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null,
  order_id text not null unique,
  amount numeric not null check (amount > 0),
  payment_method text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deposit_requests enable row level security;

drop policy if exists "Users can insert own deposit requests" on public.deposit_requests;
create policy "Users can insert own deposit requests"
on public.deposit_requests for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = deposit_requests.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Users can view own deposit requests" on public.deposit_requests;
create policy "Users can view own deposit requests"
on public.deposit_requests for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = deposit_requests.profile_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage deposit requests" on public.deposit_requests;
create policy "Admins can manage deposit requests"
on public.deposit_requests for all
to authenticated
using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'))
with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'));
