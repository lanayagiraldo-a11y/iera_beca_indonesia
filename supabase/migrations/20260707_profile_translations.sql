-- ============================================================================
-- University Academic Profile translations (EN / AR) per candidate
-- ============================================================================
-- Stores the curated bilingual texts used by the "Academic Profile (EN/AR)"
-- export page. Structured fields (education level, arabic level, etc.) are
-- translated in the frontend; this table holds the free-text pieces that
-- need human/AI translation: summary, knowledge level, motivation, dawah.

create table if not exists public.profile_translations (
  candidate_id     uuid primary key references public.candidates(id) on delete cascade,
  name_ar          text,
  summary_en       text,
  summary_ar       text,
  islamic_level_en text,
  islamic_level_ar text,
  motivation_en    text,
  motivation_ar    text,
  dawah_en         text,
  dawah_ar         text,
  updated_at       timestamptz not null default now(),
  updated_by       uuid references auth.users(id)
);

alter table public.profile_translations enable row level security;

-- Continental admins: full access.
drop policy if exists "continental_full" on public.profile_translations;
create policy "continental_full" on public.profile_translations
  for all to authenticated
  using (public.is_continental())
  with check (public.is_continental());

-- Country managers: read/write translations for candidates of their country.
drop policy if exists "cm_country" on public.profile_translations;
create policy "cm_country" on public.profile_translations
  for all to authenticated
  using (
    exists (
      select 1
        from public.candidates ca
        join public.countries co on co.id = ca.country_id
       where ca.id = profile_translations.candidate_id
         and co.code = public.my_country_code()
    )
  )
  with check (
    exists (
      select 1
        from public.candidates ca
        join public.countries co on co.id = ca.country_id
       where ca.id = profile_translations.candidate_id
         and co.code = public.my_country_code()
    )
  );
