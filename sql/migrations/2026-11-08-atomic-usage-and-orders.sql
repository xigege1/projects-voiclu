-- Apply before deploying the matching application code. Safe to rerun.
-- Anonymous identities are `anon:<uuid>` and cannot fit in uuid columns.
alter table public.voices alter column user_id type text using user_id::text;
alter table public.jobs alter column user_id type text using user_id::text;

-- A free run is once per identity, not once per calendar month. The insert and
-- conflict update take the row lock in PostgreSQL, so two concurrent requests
-- cannot both reserve the same free run.
create or replace function public.reserve_free_generation(p_user_id text, p_chars integer)
returns boolean
language plpgsql
set search_path = ''
as $$
declare v_user_id text;
begin
  if p_user_id is null or p_user_id = '' or p_chars is null or p_chars < 1 or p_chars > 150 then
    return false;
  end if;

  insert into public.usage (user_id, month, chars_used, free_generations)
  values (p_user_id, to_char(now() at time zone 'utc', 'YYYY-MM'), 0, 1)
  on conflict (user_id) do update
    set free_generations = 1, updated_at = now()
    where public.usage.free_generations = 0
  returning user_id into v_user_id;

  return v_user_id is not null;
end;
$$;

create or replace function public.release_free_generation(p_user_id text)
returns void
language sql
set search_path = ''
as $$
  update public.usage
  set free_generations = 0, updated_at = now()
  where user_id = p_user_id and free_generations = 1;
$$;

create or replace function public.restore_credits(p_user_id uuid, p_chars integer)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_chars is null or p_chars < 1 then raise exception 'invalid credit amount'; end if;
  update public.users
  set credits_left = credits_left + p_chars
  where id = p_user_id;
  if not found then raise exception 'user not found'; end if;
end;
$$;

-- Job audit and monthly usage either both persist or neither does.
create or replace function public.record_generation(
  p_job_id uuid, p_user_id text, p_voice_id uuid, p_text_hash text, p_lang text,
  p_chars integer, p_audio_url text, p_api_called boolean,
  p_charged boolean, p_bucket text
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_month text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_inserted uuid;
begin
  insert into public.jobs
    (id, user_id, voice_id, text_hash, lang, chars, status, audio_url, api_called, charged)
  values
    (p_job_id, p_user_id, p_voice_id, p_text_hash, p_lang, p_chars, 'done', p_audio_url, p_api_called, p_charged)
  on conflict (id) do nothing
  returning id into v_inserted;

  if v_inserted is null then return; end if;

  if p_charged then
    insert into public.usage (user_id, month, chars_used, free_generations)
    values (p_user_id, v_month, p_chars, case when p_bucket = 'free' then 1 else 0 end)
    on conflict (user_id) do update
      set month = v_month,
          chars_used = case when public.usage.month = v_month
            then public.usage.chars_used + excluded.chars_used
            else excluded.chars_used end,
          free_generations = greatest(public.usage.free_generations, excluded.free_generations),
          updated_at = now();
  end if;
end;
$$;

-- The order's idempotency key and the user's balance are committed together.
-- Locking the user row also serializes two different purchases for one user.
create or replace function public.grant_plan(
  p_provider text, p_txn_id text, p_user_id uuid, p_plan text,
  p_amount numeric, p_currency text, p_chars integer
)
returns table (applied boolean, balance integer, user_email text)
language plpgsql
set search_path = ''
as $$
declare
  v_user public.users%rowtype;
  v_order_id uuid;
  v_balance integer;
begin
  if p_chars is null or p_chars < 1 or p_txn_id is null or p_txn_id = '' then
    raise exception 'invalid grant';
  end if;

  select * into v_user from public.users where id = p_user_id for update;
  if not found then raise exception 'user not found'; end if;

  insert into public.orders (user_id, plan, provider, provider_txn, amount, currency, status)
  values (p_user_id, p_plan, p_provider, p_txn_id, p_amount, p_currency, 'paid')
  on conflict (provider, provider_txn) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    return query select false, v_user.credits_left, v_user.email;
    return;
  end if;

  update public.users
  set plan = p_plan, credits_left = credits_left + p_chars
  where id = p_user_id
  returning credits_left into v_balance;

  return query select true, v_balance, v_user.email;
end;
$$;

revoke all on function public.reserve_free_generation(text, integer) from public, anon, authenticated;
revoke all on function public.release_free_generation(text) from public, anon, authenticated;
revoke all on function public.restore_credits(uuid, integer) from public, anon, authenticated;
revoke all on function public.record_generation(uuid, text, uuid, text, text, integer, text, boolean, boolean, text) from public, anon, authenticated;
revoke all on function public.grant_plan(text, text, uuid, text, numeric, text, integer) from public, anon, authenticated;
grant execute on function public.reserve_free_generation(text, integer) to service_role;
grant execute on function public.release_free_generation(text) to service_role;
grant execute on function public.restore_credits(uuid, integer) to service_role;
grant execute on function public.record_generation(uuid, text, uuid, text, text, integer, text, boolean, boolean, text) to service_role;
grant execute on function public.grant_plan(text, text, uuid, text, numeric, text, integer) to service_role;

notify pgrst, 'reload schema';
