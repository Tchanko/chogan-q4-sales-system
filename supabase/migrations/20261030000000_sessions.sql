-- =====================================================================
-- CHOGAN Q4 SALES SYSTEM — deux sessions de 10 places (30/10/2026)
-- À exécuter APRÈS 20261023000000_init.sql
-- (SQL Editor > New query > coller > Run, ou `supabase db push`).
--
-- * Session 2 : réservation de place déduite du prix (deposit_cents),
--   conditions acceptées (consent_deposit) et vérification du solde.
-- * Jamais plus de 10 inscriptions confirmées par session, même si deux
--   confirmations arrivent en même temps (verrou par session).
--   Si la capacité change dans src/content/offer.ts, la modifier ici aussi.
-- =====================================================================

alter table public.registrations
  add column if not exists deposit_cents        integer,
  add column if not exists consent_deposit      boolean not null default false,
  add column if not exists balance_verified_at  timestamptz,
  add column if not exists balance_reference    text;

alter table public.registrations
  drop constraint if exists registrations_deposit_amount,
  add constraint registrations_deposit_amount check (
    deposit_cents is null or (deposit_cents > 0 and deposit_cents < price_cents)
  ),
  drop constraint if exists registrations_deposit_requires_consent,
  add constraint registrations_deposit_requires_consent check (deposit_cents is null or consent_deposit),
  -- Référence de transaction du solde : JAMAIS de numéro de carte ou IBAN.
  drop constraint if exists registrations_balance_reference_length,
  add constraint registrations_balance_reference_length check (char_length(balance_reference) <= 200),
  -- Le solde ne se vérifie qu'après une réservation confirmée.
  drop constraint if exists registrations_balance_requires_deposit,
  add constraint registrations_balance_requires_deposit check (
    balance_verified_at is null or (deposit_cents is not null and status = 'confirmed')
  );

create index if not exists registrations_cohort_status_idx on public.registrations (cohort, status);

-- Refuse la confirmation qui dépasserait la capacité de la session.
create or replace function public.enforce_cohort_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_capacity constant integer := 10;
  v_confirmed integer;
begin
  if new.status = 'confirmed'
     and (tg_op = 'INSERT' or old.status <> 'confirmed' or old.cohort <> new.cohort) then
    -- Sérialise les confirmations d'une même session jusqu'à la fin de la transaction.
    perform pg_advisory_xact_lock(hashtext('cq4_cohort:' || new.cohort));
    select count(*) into v_confirmed
      from public.registrations
     where cohort = new.cohort and status = 'confirmed' and id <> new.id;
    if v_confirmed >= v_capacity then
      raise exception 'cohort_full' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists registrations_enforce_cohort_capacity on public.registrations;
create trigger registrations_enforce_cohort_capacity
  before insert or update on public.registrations
  for each row execute function public.enforce_cohort_capacity();

revoke execute on function public.enforce_cohort_capacity() from public, anon, authenticated;
