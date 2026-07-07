-- ============================================================================
-- Fix: allow country managers to CREATE candidates in their own country
-- ============================================================================
-- Problem: candidates RLS only allowed INSERT for `anon` (public form) and for
-- continental admins (`continental_full`). A country_manager creating a
-- candidate from the admin panel hit:
--   "new row violates row-level security policy for table candidates"
-- because no INSERT policy applied to their authenticated role.
--
-- This adds an INSERT policy scoped to the manager's assigned country, mirroring
-- the existing cm_read_country / cm_update_country policies. The matching
-- stages_history insert is already covered by `cm_history_country` (for all).
-- ----------------------------------------------------------------------------

drop policy if exists "cm_insert_country" on public.candidates;
create policy "cm_insert_country" on public.candidates
  for insert to authenticated
  with check (
    exists (
      select 1 from public.countries co
      where co.id = candidates.country_id
        and co.code = public.my_country_code()
    )
  );
