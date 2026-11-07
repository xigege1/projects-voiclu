-- Voiclu 数据库 schema（Supabase / 任何 Postgres 16+）
-- 依据方案：五张表 + 缓存键 sha256(provider_voice_id|lang|text)
-- 在 Supabase SQL Editor 里整个执行一次即可。

-- ============ users（认证由 Supabase Auth 托管，此表存业务字段） ============
create table if not exists public.users (
  id uuid primary key,                    -- 与 auth.users.id 一致
  email text not null,
  plan text not null default 'free',      -- free | starter | creator | onetime
  credits_left integer not null default 0, -- 剩余字符额度
  created_at timestamptz not null default now()
);

-- ============ voices（克隆的声音档案） ============
create table if not exists public.voices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,                  -- auth UUID 或 anon:UUID
  provider text not null default 'elevenlabs',
  provider_voice_id text not null,
  name text,
  status text not null default 'active',  -- active | suspended | removed
  consent_at timestamptz not null,        -- 授权勾选时间（合规硬要求）
  consent_ip text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_voices_user on public.voices(user_id);

-- ============ jobs（每次合成任务 = 缓存 + 审计） ============
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  voice_id uuid not null references public.voices(id),
  text_hash text not null,                -- sha256(provider_voice_id|lang|text)
  lang text not null default 'en',
  chars integer not null,
  status text not null default 'pending', -- pending | done | failed
  audio_url text,
  api_called boolean not null default true, -- 缓存命中时为 false —— D2 验收看这列
  charged boolean not null default true,  -- 是否扣了额度（缓存命中不扣）
  created_at timestamptz not null default now()
);
-- 缓存查询的核心索引：同 hash 找最近一次成功任务
create index if not exists idx_jobs_hash on public.jobs(text_hash, status, created_at desc);
create index if not exists idx_jobs_user on public.jobs(user_id);

-- ============ usage（月度用量 + 免费次数，额度只信数据库，不信前端） ============
create table if not exists public.usage (
  user_id text primary key,               -- auth user id 或匿名 cookie id（anon uuid）
  month text not null,                    -- 最近一次生成所在月；免费次数跨月保留
  chars_used integer not null default 0,
  free_generations integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ============ orders（支付订单，webhook 幂等靠这个表） ============
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan text not null,
  provider text not null default 'creem',  -- creem | stripe | paddle —— 一个订单只属于一个收款渠道
  provider_txn text not null,              -- 渠道侧交易号
  amount numeric not null,
  currency text not null default 'USD',
  status text not null default 'paid',    -- paid | refunded | failed
  created_at timestamptz not null default now(),
  -- 幂等键带上 provider：不同渠道的交易号命名空间互不相干，不能只按 txn 去重；
  -- 同时这个字段决定对账和退款该找哪个渠道。
  unique (provider, provider_txn)
);
create index if not exists orders_provider_created_idx
  on public.orders (provider, created_at desc);

-- ============ voice_removals（/voice-removal 表单，48 小时下架承诺的凭证） ============
create table if not exists public.voice_removals (
  id uuid primary key default gen_random_uuid(),
  target_url text not null,
  contact text not null,
  statement text not null,
  evidence text,
  status text not null default 'received', -- received | acknowledged | removed
  created_at timestamptz not null default now()
);

-- ============ auth_codes（仅当你不用 Supabase OTP 自建验证码时才需要） ============
-- 用 Supabase signInWithOtp 时可跳过此表。
create table if not exists public.auth_codes (
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (email, code)
);

-- RLS：所有表默认由 service_role（服务端）访问。
-- 如果要开放匿名读写，必须逐表加策略 —— 当前架构全部走服务端，保持默认拒绝即可。
alter table public.users enable row level security;
alter table public.voices enable row level security;
alter table public.jobs enable row level security;
alter table public.usage enable row level security;
alter table public.orders enable row level security;
alter table public.voice_removals enable row level security;
alter table public.auth_codes enable row level security;
