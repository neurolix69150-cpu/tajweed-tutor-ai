-- =========================================================
-- 1. Débit atomique des crédits (aucune double analyse possible)
-- =========================================================
create or replace function public.consume_credits(p_user_id uuid, p_cost int default 1)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining int;
begin
  if p_cost is null or p_cost <= 0 then
    raise exception 'invalid cost';
  end if;

  update public.profiles
     set credits = credits - p_cost
   where id = p_user_id
     and credits >= p_cost
  returning credits into v_remaining;

  -- NULL = solde insuffisant (aucune ligne modifiée)
  return v_remaining;
end;
$$;

create or replace function public.refund_credits(p_user_id uuid, p_cost int default 1)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining int;
begin
  if p_cost is null or p_cost <= 0 then
    raise exception 'invalid cost';
  end if;

  update public.profiles
     set credits = credits + p_cost
   where id = p_user_id
  returning credits into v_remaining;

  return v_remaining;
end;
$$;

revoke all on function public.consume_credits(uuid, int) from public, anon, authenticated;
revoke all on function public.refund_credits(uuid, int)  from public, anon, authenticated;
grant execute on function public.consume_credits(uuid, int) to service_role;
grant execute on function public.refund_credits(uuid, int)  to service_role;

-- =========================================================
-- 2. Rate limiting atomique en base (fenêtre fixe)
-- =========================================================
create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  count        int not null default 0
);

alter table public.rate_limits enable row level security;
-- Aucune policy : seule la service_role (edge functions) y accède.

create or replace function public.check_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.rate_limits as rl (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
     set count = case
                   when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
                   else rl.count + 1
                 end,
         window_start = case
                   when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
                   else rl.window_start
                 end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;

-- =========================================================
-- 3. Consentement explicite pour la contribution au dataset (RGPD)
-- =========================================================
alter table public.profiles
  add column if not exists dataset_consent boolean not null default false,
  add column if not exists dataset_consent_at timestamptz;
