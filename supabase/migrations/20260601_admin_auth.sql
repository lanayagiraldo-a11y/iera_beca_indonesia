-- ============================================================================
-- Phase C: Admin Authentication & Role-Based Access Control
-- ============================================================================
-- Run this in the Supabase SQL editor once the project is awake.
-- Or apply via: supabase db push (with CLI linked)
-- ----------------------------------------------------------------------------

-- 1. ADMIN USERS TABLE -------------------------------------------------------
-- One row per Supabase auth user that is allowed into the admin dashboard.
-- NOTE: id has NO FK to auth.users. This lets continental admins pre-create
-- invitation rows with a placeholder id; a trigger (below) rewrites the id
-- to match auth.users.id by email the first time the invited user signs in.
create table if not exists public.admin_users (
  id           uuid primary key,
  email        text unique not null,
  full_name    text,
  role         text not null check (role in ('continental','country_manager')),
  country_code text,  -- only relevant when role = 'country_manager' (e.g. 'CO','SV','VE')
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id),
  constraint country_required_for_cm
    check (role = 'continental' or (role = 'country_manager' and country_code is not null))
);

create index if not exists admin_users_country_idx on public.admin_users(country_code);
create index if not exists admin_users_role_idx    on public.admin_users(role);

-- 2. HELPER FUNCTIONS --------------------------------------------------------
-- Returns the current logged-in admin's row (or null).
create or replace function public.current_admin()
returns public.admin_users
language sql stable security definer set search_path = public as $$
  select * from public.admin_users where id = auth.uid() and active = true limit 1;
$$;

create or replace function public.is_continental()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid() and role = 'continental' and active = true
  );
$$;

-- Returns the country_code the current user is allowed to see, or null for continental/no-user.
create or replace function public.my_country_code()
returns text
language sql stable security definer set search_path = public as $$
  select country_code from public.admin_users
   where id = auth.uid() and active = true
   limit 1;
$$;

-- 3. RLS: admin_users --------------------------------------------------------
alter table public.admin_users enable row level security;

-- Anyone logged in can read their own row (needed for the auth hook).
drop policy if exists "self_read" on public.admin_users;
create policy "self_read" on public.admin_users
  for select using (id = auth.uid());

-- Continental can read all rows.
drop policy if exists "continental_read_all" on public.admin_users;
create policy "continental_read_all" on public.admin_users
  for select using (public.is_continental());

-- Only continental can insert/update/delete admin users.
drop policy if exists "continental_write" on public.admin_users;
create policy "continental_write" on public.admin_users
  for all using (public.is_continental()) with check (public.is_continental());

-- 4. RLS: candidates ---------------------------------------------------------
-- The candidates table already exists. We ADD policies; we keep the existing
-- public INSERT (the form must keep working for anonymous applicants).
alter table public.candidates enable row level security;

-- 4a. Public can insert (form submissions). Anonymous role.
drop policy if exists "public_form_insert" on public.candidates;
create policy "public_form_insert" on public.candidates
  for insert to anon with check (true);

-- 4b. Continental can do everything.
drop policy if exists "continental_full" on public.candidates;
create policy "continental_full" on public.candidates
  for all to authenticated
  using (public.is_continental())
  with check (public.is_continental());

-- 4c. Country managers can read/update candidates whose country.code matches their assignment.
drop policy if exists "cm_read_country" on public.candidates;
create policy "cm_read_country" on public.candidates
  for select to authenticated
  using (
    exists (
      select 1 from public.countries co
      where co.id = candidates.country_id
        and co.code = public.my_country_code()
    )
  );

drop policy if exists "cm_update_country" on public.candidates;
create policy "cm_update_country" on public.candidates
  for update to authenticated
  using (
    exists (
      select 1 from public.countries co
      where co.id = candidates.country_id
        and co.code = public.my_country_code()
    )
  );

-- 5. RLS: stages_history -----------------------------------------------------
alter table public.stages_history enable row level security;

drop policy if exists "public_form_insert_history" on public.stages_history;
create policy "public_form_insert_history" on public.stages_history
  for insert to anon with check (true);

drop policy if exists "continental_history_full" on public.stages_history;
create policy "continental_history_full" on public.stages_history
  for all to authenticated
  using (public.is_continental())
  with check (public.is_continental());

drop policy if exists "cm_history_country" on public.stages_history;
create policy "cm_history_country" on public.stages_history
  for all to authenticated
  using (
    exists (
      select 1
        from public.candidates ca
        join public.countries co on co.id = ca.country_id
       where ca.id = stages_history.candidate_id
         and co.code = public.my_country_code()
    )
  );

-- 6. RLS: countries (read-only for everyone) ---------------------------------
alter table public.countries enable row level security;
drop policy if exists "countries_read_all" on public.countries;
create policy "countries_read_all" on public.countries
  for select to anon, authenticated using (true);

-- 7. TRIGGER: link auth.users → admin_users by email on signup --------------
-- When a new auth.users row is created (or its email confirmed), find any
-- pre-existing admin_users row with that email and rewrite its id to match.
create or replace function public.link_admin_user_on_auth_create()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.admin_users
     set id = new.id
   where email = new.email
     and id <> new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_link_admin on auth.users;
create trigger on_auth_user_link_admin
  after insert or update of email on auth.users
  for each row execute function public.link_admin_user_on_auth_create();

-- 8. SEED: first continental admin -------------------------------------------
-- IMPORTANT: this only links a row in admin_users if a matching auth.users row
-- already exists. Create the auth user first via Supabase dashboard
-- (Authentication → Users → Invite user) with email: lanaya@iera.org
-- Then re-run this seed (or it will be a no-op).
-- Pre-create the invitation row for the first continental admin. Once you
-- send the magic-link invite from Supabase dashboard to lanaya@iera.org and
-- the user signs in, the trigger above will rewrite this row's id to match.
insert into public.admin_users (id, email, full_name, role, country_code, active)
values (gen_random_uuid(), 'lanaya@iera.org', 'Liliana Anaya', 'continental', null, true)
on conflict (email) do update set role = 'continental', active = true, country_code = null;
