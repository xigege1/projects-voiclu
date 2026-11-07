-- 2026-11-07
-- 支持多渠道收款（Creem / Stripe / Paddle 并存）
--
-- 背景：orders 原来只有 provider_txn 单列唯一键，隐含「全站只有一个收款渠道」。
-- 要接第二个渠道时，交易号命名空间互不相干（Stripe 的 evt_/pi_、Creem 的 ID），
-- 只按 txn 去重既可能误撞，也没法判断退款该找谁。
--
-- 幂等键从 (provider_txn) 改为 (provider, provider_txn)。
-- 现有数据默认 provider='creem'，不会丢单。
--
-- 执行方式：Supabase → SQL Editor 粘贴执行，可重复运行。

alter table public.orders
  add column if not exists provider text not null default 'creem';

-- 旧的单列唯一约束（Postgres 默认命名 orders_provider_txn_key）
alter table public.orders
  drop constraint if exists orders_provider_txn_key;

do $$
begin
  alter table public.orders
    add constraint orders_provider_provider_txn_key unique (provider, provider_txn);
exception
  when duplicate_table then null;
  when duplicate_object then null;
end $$;

create index if not exists orders_provider_created_idx
  on public.orders (provider, created_at desc);
