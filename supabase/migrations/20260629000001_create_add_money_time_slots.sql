create table if not exists add_money_time_slots (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid not null unique references profiles(id) on delete cascade,
  start_time time not null default '09:00',
  end_time time not null default '18:00',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table add_money_time_slots enable row level security;

-- User policy: profile_id references profiles.id (not auth.uid() which is profiles.user_id)
create policy "Users can manage own add money time slot"
  on add_money_time_slots for all
  to authenticated
  using (profile_id = (select id from profiles where user_id = auth.uid()))
  with check (profile_id = (select id from profiles where user_id = auth.uid()));

-- Admin policy: uses user_roles table (user_type enum only has Freelancer/Employer, not admin)
create policy "Admins can manage all add money time slots"
  on add_money_time_slots for all
  to authenticated
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );
