-- =====================================================================
-- CHOGAN Q4 SALES SYSTEM — schéma initial
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- (ou `supabase db push` si vous utilisez la CLI Supabase).
--
-- Principe de sécurité :
-- * RLS activée sur toutes les tables, AUCUNE politique pour les rôles
--   `anon` et `authenticated` : la clé publique ne donne accès à rien.
-- * Seul le serveur Next.js, avec la clé secrète (service_role), lit et
--   écrit. Cette clé ne doit jamais être exposée au navigateur.
-- * Aucune donnée bancaire n'est stockée.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Prospects (formulaire de capture)
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  first_name       text not null check (char_length(first_name) between 2 and 50),
  email            text check (email is null or char_length(email) <= 254),
  whatsapp         text not null unique check (whatsapp ~ '^\+[1-9][0-9]{6,15}$'),
  challenge        text not null check (challenge in
                     ('quoi_publier', 'visuels', 'prospects', 'ia', 'facebook_ads', 'temps', 'autre')),
  status           text not null default 'new' check (status in ('new', 'contacted', 'unsubscribed')),
  submissions      integer not null default 1 check (submissions >= 1),
  consent_version  text not null,
  consent_at       timestamptz not null default now(),
  opted_out_at     timestamptz,
  utm_source       text check (char_length(utm_source) <= 150),
  utm_medium       text check (char_length(utm_medium) <= 150),
  utm_campaign     text check (char_length(utm_campaign) <= 150),
  utm_content      text check (char_length(utm_content) <= 150),
  utm_term         text check (char_length(utm_term) <= 150),
  referrer_host    text check (char_length(referrer_host) <= 253),
  landing_path     text check (char_length(landing_path) <= 200)
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (email) where email is not null;

-- ---------------------------------------------------------------------
-- Demandes d'inscription
-- ---------------------------------------------------------------------
create table if not exists public.registrations (
  id                           uuid primary key default gen_random_uuid(),
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  reference                    text not null unique check (reference ~ '^CQ4-[A-Z0-9]{6}$'),
  cohort                       text not null,
  full_name                    text not null check (char_length(full_name) between 3 and 100),
  whatsapp                     text not null check (whatsapp ~ '^\+[1-9][0-9]{6,15}$'),
  email                        text check (email is null or char_length(email) <= 254),
  country                      text not null check (country ~ '^[A-Z]{2}$'),
  payment_method               text not null check (char_length(payment_method) <= 50),
  price_cents                  integer not null check (price_cents > 0),
  currency                     text not null check (currency ~ '^[A-Z]{3}$'),
  terms_version                text not null,
  consent_early_start          boolean not null,
  consent_marketing            boolean not null default false,
  status                       text not null default 'request_received'
                                 check (status in ('request_received', 'payment_pending', 'confirmed', 'cancelled')),
  payment_verified_at          timestamptz,
  payment_verification_source  text check (payment_verification_source in ('manual', 'provider')),
  payment_provider             text check (char_length(payment_provider) <= 50),
  -- Référence de transaction ou description du justificatif : JAMAIS de numéro de carte ou IBAN.
  payment_reference            text check (char_length(payment_reference) <= 200),
  admin_note                   text check (char_length(admin_note) <= 1000),
  utm_source                   text check (char_length(utm_source) <= 150),
  utm_medium                   text check (char_length(utm_medium) <= 150),
  utm_campaign                 text check (char_length(utm_campaign) <= 150),
  utm_content                  text check (char_length(utm_content) <= 150),
  utm_term                     text check (char_length(utm_term) <= 150),
  referrer_host                text check (char_length(referrer_host) <= 253),
  landing_path                 text check (char_length(landing_path) <= 200),
  -- Garde-fou : une inscription ne peut être confirmée sans vérification de paiement tracée.
  constraint registrations_confirmed_requires_verification check (
    status <> 'confirmed'
    or (payment_verified_at is not null and payment_verification_source is not null)
  )
);

create index if not exists registrations_created_at_idx on public.registrations (created_at desc);
create index if not exists registrations_whatsapp_idx on public.registrations (whatsapp);
create index if not exists registrations_status_idx on public.registrations (status);

-- ---------------------------------------------------------------------
-- Désinscriptions des communications marketing (historique)
-- ---------------------------------------------------------------------
create table if not exists public.marketing_opt_outs (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  whatsapp    text check (whatsapp ~ '^\+[1-9][0-9]{6,15}$'),
  email       text check (char_length(email) <= 254),
  constraint marketing_opt_outs_contact check (whatsapp is not null or email is not null)
);

-- ---------------------------------------------------------------------
-- Limitation de débit partagée entre instances serveur
-- (la clé est une empreinte HMAC : aucune adresse IP en clair)
-- ---------------------------------------------------------------------
create table if not exists public.rate_limits (
  key           text not null check (char_length(key) <= 200),
  window_start  timestamptz not null,
  hits          integer not null default 0,
  primary key (key, window_start)
);

-- ---------------------------------------------------------------------
-- Horodatage automatique des mises à jour
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

drop trigger if exists registrations_set_updated_at on public.registrations;
create trigger registrations_set_updated_at
  before update on public.registrations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Fonctions appelées par le serveur (RPC)
-- ---------------------------------------------------------------------

-- Crée ou met à jour un prospect (dédoublonnage par numéro WhatsApp).
-- L'attribution du premier contact est conservée.
create or replace function public.upsert_lead(
  p_first_name text,
  p_email text,
  p_whatsapp text,
  p_challenge text,
  p_consent_version text,
  p_utm_source text,
  p_utm_medium text,
  p_utm_campaign text,
  p_utm_content text,
  p_utm_term text,
  p_referrer_host text,
  p_landing_path text
)
returns table (id uuid, is_new boolean)
language sql
set search_path = ''
as $$
  insert into public.leads as l (
    first_name, email, whatsapp, challenge, consent_version,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer_host, landing_path
  )
  values (
    p_first_name, p_email, p_whatsapp, p_challenge, p_consent_version,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term, p_referrer_host, p_landing_path
  )
  on conflict (whatsapp) do update set
    first_name      = excluded.first_name,
    email           = coalesce(excluded.email, l.email),
    challenge       = excluded.challenge,
    consent_version = excluded.consent_version,
    consent_at      = now(),
    submissions     = l.submissions + 1,
    status          = case when l.status = 'unsubscribed' then 'new' else l.status end,
    opted_out_at    = null
  returning l.id, (l.xmax = 0) as is_new;
$$;

-- Enregistre une désinscription et l'applique aux prospects et inscrits correspondants.
create or replace function public.record_opt_out(p_whatsapp text, p_email text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.marketing_opt_outs (whatsapp, email) values (p_whatsapp, p_email);

  update public.leads
     set status = 'unsubscribed', opted_out_at = now()
   where (p_whatsapp is not null and whatsapp = p_whatsapp)
      or (p_email is not null and email = p_email);

  update public.registrations
     set consent_marketing = false
   where (p_whatsapp is not null and whatsapp = p_whatsapp)
      or (p_email is not null and email = p_email);
end;
$$;

-- Incrémente le compteur d'une fenêtre fixe ; renvoie true si la limite n'est pas dépassée.
create or replace function public.hit_rate_limit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;

  -- Purge occasionnelle des anciennes fenêtres.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;

-- ---------------------------------------------------------------------
-- Vue de suivi du tunnel (lisible dans Supabase Studio)
-- ---------------------------------------------------------------------
create or replace view public.funnel_by_source
with (security_invoker = true)
as
with l as (
  select coalesce(lower(utm_source), lower(referrer_host), 'direct') as source,
         count(*) as leads
    from public.leads
   group by 1
),
r as (
  select coalesce(lower(utm_source), lower(referrer_host), 'direct') as source,
         count(*) filter (where status <> 'cancelled') as registrations,
         count(*) filter (where status = 'confirmed') as confirmed_payments
    from public.registrations
   group by 1
)
select coalesce(l.source, r.source)          as source,
       coalesce(l.leads, 0)                  as leads,
       coalesce(r.registrations, 0)          as registrations,
       coalesce(r.confirmed_payments, 0)     as confirmed_payments
  from l
  full outer join r on r.source = l.source;

-- ---------------------------------------------------------------------
-- Contrôle d'accès
-- ---------------------------------------------------------------------
alter table public.leads              enable row level security;
alter table public.registrations      enable row level security;
alter table public.marketing_opt_outs enable row level security;
alter table public.rate_limits        enable row level security;

-- Aucune politique n'est créée pour anon / authenticated : accès refusé par défaut.
-- On retire en plus les privilèges accordés par défaut (défense en profondeur).
revoke all on table public.leads, public.registrations, public.marketing_opt_outs,
                    public.rate_limits, public.funnel_by_source
  from anon, authenticated;

-- Les fonctions sont exécutables par PUBLIC par défaut : on les réserve au serveur.
revoke execute on function public.upsert_lead(text, text, text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.record_opt_out(text, text) from public, anon, authenticated;
revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

grant execute on function public.upsert_lead(text, text, text, text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.record_opt_out(text, text) to service_role;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;
grant all on table public.leads, public.registrations, public.marketing_opt_outs,
                   public.rate_limits to service_role;
grant select on public.funnel_by_source to service_role;
