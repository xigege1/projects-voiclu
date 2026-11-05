# Voiclu 项目文档

> 业务需求、执行方案与当前进展。最后更新：2026-11-05

| 项 | 值 |
|---|---|
| 产品名 | Voiclu（voice + clone 截断，.com/.ai/.io 三后缀当时全可注册，Archive 无历史快照） |
| 域名 | `https://voiclu.com`（Cloudflare Registrar，NS：brenda / eoin.ns.cloudflare.com） |
| 定位 | 工具站（不是单页销售页）：AI 声音克隆 + 多语言配音 |
| 目标市场 | 英文站收钱（美国），葡语页补流量（巴西） |
| 代码仓库 | `github.com/xigege1/projects-voiclu`（main，SSH remote） |
| 线上环境 | Vercel 项目 `voiclu`（team `xigege2`），push 即部署 |
| 技术栈 | Next.js 16.4.5（App Router）+ TypeScript + Tailwind v4 + Supabase + ElevenLabs + Cloudflare R2 + Creem |

---

## 1. 项目概述

把 30 秒～3 分钟的干声上传，克隆成 voice_id，再让它说 75+ 种语言。核心链路是**离线**的（录音 → 转文字 → 翻译 → 合成），不做实时变声——离线才缓存得住、压得低成本。

商业模式：免费 1 次 → 订阅制（$9.9 / $29 / $99 买断），支付走 Creem（Merchant of Record，替你承担税务与支付争议）。

---

## 2. 业务需求

### 2.1 市场依据

**核心词与页面一一对应，一页只打一个词。**

| 页面 | 目标词 | 月搜索量 | 顶部广告出价 |
|---|---|---:|---|
| `/` | ai voice cloning | 4,400（美国） | $0.91 ~ $5.36 |
| `/free` | ai voice cloning free | 590（美国） | — |
| `/best` | best ai voice clone | 170（美国） | $1.32 ~ $12.11 |
| `/alternatives` | elevenlabs alternative | 480（美国整组） | $2.24 ~ $19.92 |
| `/text-to-speech` | ai voice clone text to speech | 90（美国） | — |
| `/br` | clonar voz | 5,400（巴西） | $0.05 ~ $0.80 |
| `/br` | clonar voz ia | 3,600（巴西） | — |

**关键判断**：

- 巴西是真实第二大盘，但**出价差一个量级**（巴西 $0.05~$0.80 vs 美国 $0.83~$4.94）。葡语页只是流量补充池，收钱靠英文页和美国定价。
- 西语（西班牙 `clonar voz` 720/月）、印尼语（核心词全部「未收录」，月搜 <10）**已从计划中剔除**，不铺多语言。
- 不做多语言批量生成页：新站短期大批量铺语言页会被判低质。

### 2.2 产品定位：工具站，不抄单页销售页

| 竞品 | 模式 | 该不该抄 |
|---|---|---|
| kikivoice.ai | 工具站：首页即工具卡（双 tab）+ 三步说明 + 每语言一个独立子目录，Title 含关键词 | ✅ 抄结构 |
| clonevoice.ai | 单页销售页：H1 不是关键词、无 meta description、正文 10 个 H1，63.6% 流量来自直接访问、搜索仅 12.1% | ❌ 不抄（它不靠搜索吃饭，我们靠） |

我们能在搜索侧切入的理由：核心词难度 21.5，SERP 里有 3 个小站占位（DR 28 也能排上首页）。

### 2.3 定价与成本模型

| 档位 | 价格 | 额度 | API 成本（按 $0.20/分钟估） | 毛利 |
|---|---|---|---|---|
| 免费 | $0 | 1 次生成，≤150 字符（约 30 秒） | ≈ $0.1 | — |
| Starter | $9.9/月 | 20,000 字符（约 20 分钟） | ≈ $4 | 60% |
| Creator | $29/月 | 80,000 字符（约 80 分钟） | ≈ $16 | 45% |
| One-time | $49 买断 | 40,000 字符（约 40 分钟） | ≈ $8 | 84% |
| 年付 | 5 个月价格买 12 个月 | — | — | LTV 提升约 25% |

**三条硬规则**：

1. **成本上限 ≤ 售价的 40%**，超了就降额度或换供应商，不许先上线再补。
2. **免费用户只给 1 次**（每天 3 次 / 每天 1 次都实测不出单，改成「只能生成 1 次」才出年付）。
3. **按字符计费，不按分钟**——ElevenLabs 官方 1 字符 = 1 credit，用户输多少算得准，不会因语速快慢超额。

**成本口径**（2026-11 官方价，`eleven_multilingual_v2` 为 1 字符 = 1 credit）：

| 档 | 订阅价 | 含 credits | 折合 $/1000 字符 |
|---|---|---|---|
| Starter | $6/月 | 30,000 | $0.20 |
| Creator | $22/月（首月 $11） | 121,000 | $0.18 |
| Pro | $99/月 | 600,000 | $0.165 |

**第 4 条硬规则（外部审阅后补）**：超出额度**不自动续跑**。到量即停，提示加购或升级——否则重度用户会吃穿毛利，比没收入更糟。上线前用真实用量跑一次测算，不要只按上表估算。

> 注：免费试听「换便宜引擎」的意见已评估，当前免费量太小（每身份 1 次 ≤150 字符 ≈ $0.03），收益低于多接一家 provider 的复杂度，**暂缓**。见 §5.6。

### 2.4 合规红线（先于 SEO）

| 要求 | 实现 | 状态 |
|---|---|---|
| 克隆前强制勾选授权声明 | 勾选后把 `consent_at` + `consent_ip` 写入 `voices` 表 | ✅ 已实现 |
| 生成音频标注 AI 生成 | 页脚声明 + 下载说明 + 水印参数 | ✅ 部分（水印参数待接供应商） |
| 声音下架入口 | `/voice-removal` 页 + `voice_removals` 表，48 小时内下架承诺 | ✅ 已实现 |
| 隐私政策披露「音频会发给第三方 TTS 供应商」 | `/privacy` | ✅ 已实现 |
| 巴西 LGPD 单独段落 | `/privacy` | ⬜ 待补 |
| 禁用名人 / 第三方声音，加人工审核入口或禁止名单 | 待设计：`voices.status = suspended` + 审核队列 | ⬜ 待补（收款审核会查这条） |

> 合规优先于排名：投诉会先打到支付通道，收款断了比没排名更疼。

### 2.5 检查点

- **30 天**：6 个页面全部被收录，GSC 有曝光，1~3 个词进前 50
- **60 天**：首页进前 20 或 `/free` 进前 10，出现第一笔付费
- **90 天**：月收入 ≥ $100，至少一个词进前 10。**到点没做到就换词，不换方法。**

---

## 3. 技术方案

### 3.1 目录结构

```
src/
├── app/
│   ├── page.tsx                  首页（8 模块）
│   ├── free/ best/ alternatives/ text-to-speech/   4 个英文页
│   ├── pricing/                  三档价格
│   ├── terms/ privacy/ voice-removal/ refund/      法务四页
│   ├── br/                       葡语页（已写好，暂不进 sitemap）
│   ├── api/clone/ tts/ auth/ webhooks/creem/
│   ├── sitemap.ts  robots.ts  icon.svg  layout.tsx  globals.css
├── components/  ToolCard / DemoSection / PricingSection / AuthDialog / FaqSection ...
└── lib/         constants / supabase / storage / elevenlabs / billing / identity / emails / wav
sql/schema.sql   建表脚本
scripts/push-env.sh   把 .env.local 批量推到 Vercel
```

### 3.2 数据模型（7 张表）

| 表 | 用途 | 关键字段 |
|---|---|---|
| `users` | 账号与额度 | id, email, plan, credits_left |
| `voices` | 克隆声纹 + 授权留证 | provider_voice_id, status, **consent_at, consent_ip** |
| `jobs` | 合成任务与缓存 | voice_id, **text_hash**, lang, chars, audio_url, **api_called** |
| `usage` | 月度用量 | user_id, month, chars_used |
| `orders` | 订单（幂等） | provider_txn, plan, amount, status |
| `voice_removals` | 下架申请 | url, email, statement, status |
| `auth_codes` | 邮箱验证码 | email, code_hash, expires_at |

### 3.3 缓存与计费（毛利率的关键）

```
cacheKey = sha256(provider_voice_id | lang | text)
```

- **命中**：直接返回已有 `audio_url`，**不扣额度、不调 API**，`jobs.api_called = false`
- **未命中**：调 ElevenLabs → 音频存 R2 → 写 jobs → 扣额度
- 额度只存在数据库，**绝不放 localStorage**（清缓存即可绕过）

### 3.4 接口

| 接口 | 作用 | 要点 |
|---|---|---|
| `POST /api/clone` | 音频 → voice_id | 30s~3min、≤10MB、mp3/wav/m4a；每身份 24h 限流；consent 落库 |
| `POST /api/tts` | voice_id + 文本 → 音频 URL | 先查缓存；未命中才调 API；额度不足返回 **402** |
| `POST /api/auth/request-code` | 发邮箱验证码 | Supabase OTP |
| `POST /api/auth/verify` | 校验验证码换 session | 首次登录建业务行 |
| `POST /api/webhooks/creem` | 支付回调 | 按 `provider_txn` 幂等，重复回调只加一次额度 |

### 3.5 前端要点

- 工具卡双 tab（Voice Cloning / Text to Speech），上传 + 浏览器录音（**webm→WAV 在浏览器端转码**，`lib/wav.ts`，零依赖）
- 前端先做时长/静音检测，不合格直接提示，不浪费 API 调用
- demo 区 **6 条音频全部预生成**放 `public/demo/`，页面只 `<audio src>`——**绝不实时调接口**
- 第 2 次生成弹付费窗，**按钮不禁用**（置灰会让人直接关页）

**视觉规范**（2026-11-05 外部审阅给出，落地时按表统一，不要逐块凭感觉调）：

| 项 | 规格 | 现状 |
|---|---|---|
| 栅格 | 内容最大宽 1120px；左右 24px（移动）/ 48px（桌面） | `max-w-6xl` ≈ 1152，基本合格 |
| 区块间距 | 上下 80px（移动）/ 120px（桌面） | `py-16` = 64px，**偏小** |
| 卡片内边距 | 24 / 32px | `p-5`/`p-6` 混用 |
| 字号阶梯 | H1 56/64（移动 36/40）、H2 36/40、H3 20/28、正文 16/28、辅助 14/22；正文行高 ≥1.5 | H1 用 `text-4xl sm:text-5xl`（36/48） |
| 字体 | 只用一种（现用 `geist`） | ✅ |
| 颜色 | 一个中性底色 + **一个**强调色；强调色只用于主按钮和播放按钮 | 需检查是否有装饰性使用 |
| 对比度 | 正文 ≥4.5:1（WCAG AA，硬指标） | 未测 |
| 圆角 | 统一 12 或 16px | `rounded-xl`/`rounded-2xl` 混用 |
| 按钮高度 | 44 / 48px | `py-2.5`/`py-3` 混用 |
| 阴影 | 只留一档（`0 1px 3px` + `0 8px 24px` 两层）；不同时加边框和阴影 | 需收敛 |
| 动效 | 不加花哨动效——首屏慢一秒人就走了 | ✅ |

> 一屏一个焦点：首屏=上传框，试听区=播放按钮，定价页=Creator 卡。

### 3.6 SEO

- `sitemap.xml`：**当前 6 条**（`/`、`/free`、`/best`、`/alternatives`、`/text-to-speech`、`/pricing`）。**待补 6 条**：`/terms`、`/refund`、`/privacy`、`/voice-removal`、`/about`、`/contact`；`/br` 启用后再加
- `robots.txt`：允许全站，屏蔽 `/api/`，带 `Sitemap:` 行
- 每页独立 Title / Description / H1，H1 只出现一次
- 首页 8 条 + `/free` 4 条 **FAQPage JSON-LD**
- canonical 统一指向 `https://voiclu.com`；`www` 308 跳转到主域
- `lastmod` 用固定日期（`CONTENT_UPDATED`），不用 `new Date()`——否则每次请求都是「现在」，Google 会判定 lastmod 不可靠
- **标题层级必须 H1 → H2 → H3 不跳级**：现在首页 H1 之后直接是 3 个 H3（Upload / Pick a language / Download），缺 H2 承接，待修

---

## 4. 原计划（D0–D14）

| 天 | 做什么 | 完成标准 |
|---|---|---|
| D0 | 注册域名；Vercel 建项目；GSC 加网域资源 | 域名能解析、GSC 能验证 |
| D1 | 接 ElevenLabs：`/clone` + `/tts` | 命令行跑通一次克隆 + 一次合成 |
| D2 | 建 5 张表 + 缓存 | 同 voice + 同文本第二次请求返回缓存 URL，不计费 |
| D3 | 首页工具卡 + 预生成 6 条 demo | 断网也能试听 demo |
| D4 | 登录 + 额度 + 价格页 | 新账号只能生成 1 次，第 2 次弹付费 |
| D5 | 接 Creem，真买一单 | 测试卡付款后额度到账 |
| D6 | 5 个页面正文 | 每页 H1 + 300 字以上 + 内链回首页 |
| D7 | 上线：sitemap / robots / HTTPS / GSC | `site:voiclu.com` 能搜到 |
| D8–9 | `/best`、`/alternatives` 实测对比 | 每页 8~11 个工具，真测过 |
| D10–11 | 合规三件事 | 不勾授权无法克隆 |
| D12–13 | 3 条短视频 + Product Hunt 草稿 | 素材做完待发 |
| D14 | 发布：Reddit / TikTok / Product Hunt | 拿到第一批外链和访问 |

**第 3~4 周**：单独开 `/br`（路径用 `/br` 不用 `/pt`，跟巴西排第 1 的 kikivoice.ai 一致），加 hreflang + 互链。

---

## 5. 实际执行记录

### 5.1 时间线（2026-11-05）

| 时间 | 事件 |
|---|---|
| 上午 | 读三份方案 → 初始化 Next.js 项目 → 建 schema 与 lib 层 |
| 上午 | 写 `/api/clone`、`/api/tts`、Creem webhook、登录、价格页 |
| 上午 | 写首页 8 模块 + 4 个英文页 + 法务四页 + `/br` |
| 上午 | 加 `sitemap.ts` / `robots.ts` / `.env.example` / README 部署清单 |
| 上午 | 构建通过，21 条路由生成，生产模式全路由 200 |
| 下午 | 补：录音 webm→WAV 转码、Umami 埋点、5 封邮件模板、FAQ JSON-LD |
| 下午 | 推 GitHub（`git@github.com:xigege1/projects-voiclu.git`） |
| 20:35 | Vercel 部署成功：`voiclu.vercel.app`，13 路由全 200，接上 GitHub 自动部署 |
| 22:25 | 用户配好 Cloudflare DNS（apex A 记录 + www CNAME，灰云） |
| 22:29 | 修复证书未签发问题，`https://voiclu.com` 上线，证书至 2027-02-03 |
| 22:33 | `www` 配 308 跳转到主域 |
| 22:40 | GSC 网域资源验证通过，提交 sitemap |
| 22:50 | 修复 sitemap 的 `lastmod` 每次请求都变的问题 |

### 5.2 已完成

**代码（D1–D4、D6 已全部完成）**

- ✅ `/api/clone`（ElevenLabs IVC + consent 留证 + 24h 限流）
- ✅ `/api/tts`（sha256 缓存键，命中不扣费；额度不足 402）
- ✅ Creem webhook（幂等入账 + 付款成功邮件）
- ✅ Supabase 邮箱验证码登录 + 数据库计数额度
- ✅ 首页 8 模块 + 工具卡（上传/录制双模式 + 转码 + 时长检测）
- ✅ 5 个英文页 + 法务四页 + `/br` 葡语页
- ✅ sitemap / robots / canonical / FAQ JSON-LD / OG 元数据
- ✅ 5 封邮件模板（Resend，无 key 静默跳过）
- ✅ `scripts/push-env.sh` 批量推环境变量

**部署与上线（D0、D7 部分）**

- ✅ 域名 `voiclu.com` 已购并解析
- ✅ Vercel 部署 + GitHub 自动部署
- ✅ HTTPS 证书签发（Let's Encrypt，CN=voiclu.com，到期 2027-02-03）
- ✅ `www` → 主域 308
- ✅ 13 条线上路由全部 200；sitemap / robots 内容正确
- ✅ GSC 网域资源验证通过

### 5.3 待办

#### P0 · 挡住收入的六件事（2026-11-05 两份外部审阅后重排）

| # | 事项 | 为什么是 P0 | 依赖 |
|---|---|---|---|
| P0-1 | **修 `/api/tts` 付费扣减**：登录且 `plan != free` 走 `credits_left`，不再走 `checkAndReserveFree` | 现在付费用户生成第二次就被 402 拦住——渠道通了也用不了 | 无，**可立即做** |
| P0-2 | **确认收款主体**（大陆 / 香港 / 美国）→ 据此定渠道顺序 | 决定后面所有支付工作，主体不定就接支付等于白写代码 | **等用户决定** |
| P0-3 | **修 `/br` 与 sitemap 的矛盾**：把 `/br` 补进 sitemap，或先用 301 下线 | hreflang 声明了 `pt-BR → /br`，但 sitemap 里没有，是明确的技术错误 | 无，**可立即做** |
| P0-4 | **清掉法务页占位符**：`/terms`、`/privacy` 的 `[上线日期]`（填 2026-11-05）+ `/terms` 的 `[选择一个司法辖区…]` | 收款审核第一眼看条款页，带中文占位符基本被退回 | 司法辖区**需用户定**（新加坡/美国某州） |
| P0-5 | **补 `/about`、`/contact`**，footer 的 Contact 组补链接 | 合规页齐全才过得了收款审核 | 无，**可立即做** |
| P0-6 | **sitemap 补 6 条**：`/terms`、`/refund`、`/privacy`、`/voice-removal`、`/about`、`/contact` | 这些页都是 200 却没进 sitemap，等于没提交给 Google | 无，**可立即做** |

> P0-1~P0-3 详见 §5.6 与 `docs/REVIEW-2026-11.md`；P0-4~P0-6 详见 §5.7 与 `docs/REVIEW-2026-11-pages.md`。
> 除 P0-2 与 P0-4 的司法辖区外，其余四项不需要额外信息。

#### P1 · 转化与内容（审阅 B）

| # | 事项 | 完成标准 |
|---|---|---|
| P1-1 | demo 音频生成进 `public/demo/`，并按 Original/Clone 成对重排 | 未注册可点播 6 组，无 404 |
| P1-2 | 首页加 `<h2>How it works</h2>` 包住 3 个步骤 H3 | 层级 H1→H2→H3 不跳级 |
| P1-3 | 首页加 `<h2>What is AI voice cloning?</h2>` 300~500 词 + 3 个场景 H3 | 首页正文 ≥800 词 |
| P1-4 | 首页加 5 行 Voiclu vs ElevenLabs 对比表，链到 `/alternatives` | 手机不横向溢出 |
| P1-5 | 定价页加月付/年付切换（显示省 58%）+ 字符计算器 | 切换后三卡价格同步 |
| P1-6 | `/pricing` 三个按钮接真实 checkout + 支付成功页 | 真卡走通：付款 → 额度到账 → 生成 → 下载，全程不手改库 |

> P1-6 与 `docs/REVIEW-2026-11.md` 的 P1 是同一件事，阻塞于 P0-2。

#### 需要本人操作（有账号依赖，无法代做）

| # | 事项 | 影响 | 备注 |
|---|---|---|---|
| 1 | Supabase 建项目 + 执行 `sql/schema.sql` + 取 3 个 key | 没有它全部 API 报错 | Auth 里要打开 Email OTP，Site URL 填 `https://voiclu.com` |
| 2 | ElevenLabs API Key | 克隆和合成不可用 | 免费层级就能拿到 key，先配 `ELEVENLABS_DEMO_VOICE_ID` 用预置声音跑通全链路（见 5.5）；真实克隆需 Starter $6/月起 |
| 3 | Cloudflare R2：建 bucket + 公开域名 + API Token（6 个变量） | 音频存不下来 | 建议绑 `cdn.voiclu.com` |
| 4 | Creem 注册 + 建 4 个产品 + webhook 密钥 | 收不了钱 | webhook 指向 `https://voiclu.com/api/webhooks/creem`；要真买一单验证 |
| 5 | 填 `.env.local` → `bash scripts/push-env.sh` → 重新部署 | 11 个必需变量仍是空的 | `NEXT_PUBLIC_*` 不重新部署不生效 |
| 6 | GSC 等 sitemap 转「成功」 | 目前状态「无法抓取」 | 域名太新，Google 会自动重试，24~48h 正常 |
| 7 | 生成 6 条 demo 音频放 `public/demo/` | demo 区播放器为空 | 命名见 README |
| 8 | 填 `/best`、`/alternatives` 的 `[实测填写]` | 这两页能排名的唯一理由 | 9~11 个工具各注册试用一遍，约 2~3 天 |
| 9 | 3 条短视频 + Product Hunt / Reddit 发布 | 冷启动 | 脚本和文案见原方案 |

**可选（不填不影响主流程）**：`RESEND_API_KEY` + `RESEND_FROM`（交易邮件）、`NEXT_PUBLIC_UMAMI_*`（埋点）。

### 5.4 踩坑记录

| 问题 | 现象 | 原因 | 解法 |
|---|---|---|---|
| SWC 原生二进制损坏 | `@next/swc-win32-x64-msvc` 报「不是有效的 Win32 应用程序」 | npm 下载被中断，文件截断在 17MB（应为 105MB） | 重装该包；临时用 `next build --webpack`（WASM 回退） |
| 动态 OG 图编译失败 | `Cannot get final name for export 'ImageResponse'` | 只有 metadata route 走特殊编译链，WASM 模式下解析不了 `next/og` 的再导出 | 不用动态 OG，改静态 PNG |
| 路由里 `runtime` 导出冲突 | Next 16 `cacheComponents` 报错 | 与 route segment config 冲突 | 删掉 `export const runtime = "nodejs"`（本来就是默认） |
| Google Fonts 拉不通 | 直连 TLS 失败，两个代理都超时 | 本机网络 | 改用 npm 包 `geist`（Vercel 官方，字体自托管、离线可构建） |
| 预渲染报错 | `new Date()` 在 Footer 里报错 | 静态预渲染时不允许 | 改为固定年份 |
| **域名 HTTPS 握手失败** | HTTP 200 但 TLS 直接 EOF，`domains verify` 却返回 verified | **证书没触发签发**（不是 DNS 错） | 把域名从项目摘掉再重新添加，1 分钟内签发 |
| sitemap `lastmod` 每次都变 | 每次请求都是当前时间 | 用了 `new Date()` | 改成固定常量 `CONTENT_UPDATED` |
| `.gitignore` 漏掉模板 | `.env*` 把 `.env.example` 也忽略了 | 默认规则过宽 | 加 `!.env.example` 例外 |

### 5.5 ElevenLabs 免费层级验证方案（演示模式）

**背景**：ElevenLabs 免费计划（$0，10k credits/月）**不包含 Instant Voice Cloning**，调 `/v1/voices/add` 会返回 401。IVC 从 Starter（$6/月，30k credits，10 个声音槽）起才有；Professional Voice Cloning 要 Creator（$22/月）。

**做法**：`ELEVENLABS_DEMO_VOICE_ID` 存在时，`cloneVoice()` 跳过真实 API，直接返回该预置声音的 `voice_id`。TTS 仍真实调用 ElevenLabs、真实写 R2、真实扣额度、真实走缓存。

配置步骤：

```bash
# 1. elevenlabs.io → 头像 → API Keys，建 key 填进 .env.local 的 ELEVENLABS_API_KEY
# 2. 一条命令：查层级 + 剩余额度 + 列出声音 + 自动写入 DEMO_VOICE_ID
node scripts/check-elevenlabs.mjs
# 3. 推环境变量 + 重新部署
bash scripts/push-env.sh && npx vercel deploy --prod --yes
```

**能验证 / 验不了**：

| 环节 | 免费+演示模式 |
|---|---|
| 上传、时长/格式/静音校验、consent 勾选门槛 | ✅ 真实 |
| `voices` 表落库（含 `consent_at` / `consent_ip`） | ✅ 真实（`provider` 存 `elevenlabs-demo` 以便区分） |
| TTS 合成、写 R2、`cdn.voiclu.com` 公开播放 | ✅ 真实 |
| 额度和计费、缓存命中不扣费、转化邮件 | ✅ 真实 |
| 克隆出来像不像你自己 | ❌ 验不了 |

**升级路径**：ElevenLabs 换成 Starter 后，把 `ELEVENLABS_DEMO_VOICE_ID` 清空 → 重新部署，代码零改动，自动切回真实克隆。历史演示行可用 `select * from voices where provider = 'elevenlabs-demo'` 找出来清理。

**注意**：免费额度只有 10k credits ≈ 66 次 150 字符的试听；且免费身份的免费额度**每身份只有 1 次**，测试时用无痕窗口（匿名身份靠 cookie 区分）。

### 5.6 外部审阅意见（2026-11-05）

收到一份第三方诊断报告，原文留档在 **`docs/REVIEW-2026-11.md`**。下面是并入本方案后的结论——报告部分内容基于上线早期快照，已按当前代码校正。

#### 采纳

| 意见 | 落到哪里 |
|---|---|
| 定价按钮全指回 `/pricing`，没有一条能走完的付款路径 | 确认属实，`PricingSection.tsx` 是 `TODO(checkout)`；列为 P1，阻塞于主体确认 |
| 缺结账页 / 支付成功页 / 账户页 | 确认属实，只有 webhook 没有发起端 |
| `/br` 在 hreflang 里但不在 sitemap | 确认属实，列为 **P0**（改动最小、错误最明确） |
| 首页正文太薄（正文约 400 词，目标 ≥800） | 确认属实；补 ElevenLabs 对比精简版 + 300~500 词"什么是 voice cloning" |
| 缺 demo 音频 / 用户证言 | 确认属实，`public/demo/` 仍为空 |
| 必须做毛利测算再定定价 | 采纳，列为 P2 |
| 产品红线：只允许本人或有书面授权的声音，加人工审核入口/禁止名单 | 采纳，consent + 时间戳 + IP 已在做，补审核入口 |
| Creem 有审核严/封户/提现不支持支付宝的风险 | 采纳为风险项，见 §7 |
| 内页分工：首页锁 `ai voice cloning`，`/alternatives` 攻 `elevenlabs alternative(s)`，`/text-to-speech` 不硬碰 301k 大词 | 与现有分工一致，确认 |

#### 修正（不照抄）

**1. "Stripe 主力 + PayPal 兜底，Creem 排第三"——有身份前提。**
Stripe 需要香港/美国/新加坡等地的主体或本人身份 + 当地银行账户，大陆个人开不了正式账户。若只有大陆主体，**Creem 这类 MoR 反而是唯一可行解**（MoR 自己当卖家，你只是供应商），"排第三"不成立。所以先定主体（P0-B），再定顺序。

**2. "免费试听走便宜引擎"——方向对，现在做性价比低。**
当前免费额度是**每身份 1 次、上限 150 字符**，最多 150 credits ≈ $0.03，省下来的钱不足以抵消多接一个 provider 的成本（多一套密钥、错误处理，且免费音色与付费音色不一致会造成体验割裂）。真正的成本风险在付费后，靠定价和用量上限解决。**暂缓到免费流量真的起来再上。**

**3. "缺 5 个信任页"——已过时 2 个。**
`/privacy`、`/terms`、`/refund`、`/voice-removal` 都已上线并有正文；实际只缺 `/about`、`/contact`。

**4. 报告漏了一条更挡路的。**
`/api/tts` 的付费扣减仍是 `TODO`，付费用户第二次生成就被 402 拦住。这比支付渠道选型更紧急，已提为 P0-A。

#### 报告给的关键词数据（第三方口径，用前复核）

| 词 | 美国月搜 | 难度 / 备注 |
|---|---|---|
| `ai voice cloning` | 4,400（近 12 月 6,600 → 3,600） | 39.1/100，进前十需 40~80 引用域（中值 55）；10 席中 6 席是专页、无首页；最弱占位 kikivoice.ai（DR 9，注册 16 个月，月访问 55.9 万） |
| `voice cloning` / `voice clone` | 6,600 / 6,600 | |
| `elevenlabs alternative(s)` | 480（整组） | 顶部出价 $2.24–19.92，商业价值最高 |
| free 类 | 720 | `/free` 目标 |
| `text to speech` | 301,000 | 不正面竞争，降级打"用自己的声音做 TTS"长尾 |

外链参考：voiceisolator.io（EMD + 1755 词首页 + 30 个外链域名）。

### 5.7 外部审阅 B：页面 / 设计 / 合规（2026-11-05）

同批次第二份报告，原文与完整核对表在 **`docs/REVIEW-2026-11-pages.md`**。核心判断是：**页面不是"丑"，是"空"**——能证明效果（成对试听）、能证明可信（用户量/证言/合规页）、能收钱（结账）三样都缺，配色是最后一层。

#### 采纳

| 意见 | 落到哪里 |
|---|---|
| `/terms` 留着 `[上线日期]`、中文司法辖区占位符 | 确认属实，**`/privacy` 也有 `[上线日期]`**（报告漏了这处）；列 P0-B1/B2 |
| sitemap 只有 6 条，法务页全在 sitemap 外 | 确认属实，列 P0-B6 |
| `/refund` 写 MoR 但站上没有 checkout | 确认属实，列 P0-B3 |
| 缺 `/about`、`/contact` | 确认属实，列 P0-B4/B5 |
| H1 后直接 3 个 H3，无 H2 承接 | 确认属实，列 P1-B8 |
| 成对试听（Original/Clone 并排、6 语言 + 3 情绪） | 采纳，替代现有 6 张平铺卡片，列 P1-B7 |
| 首页正文补到 ≥800 词 + 5 行对比表 | 采纳，列 P1-B9/B10 |
| 定价页月付/年付切换 + 字符计算器 | 采纳，列 P1-B11 |
| 视觉规范（栅格/字号/颜色/圆角/阴影/对比度） | 全量采纳，已进 §3.5 表格，列 P2-B12~B14 |
| **Stripe 不是 MoR**，MoR 是 Creem/Paddle | 确认，且是改写文案的前提，见下方修正 1 |

#### 修正（不照抄）

**1. "Stripe 不是 MoR" 这条要写进硬约束。**
MoR 指以自己的名义卖、并承担代缴税义务的一方。Stripe 是收单/支付处理商（PSP），不是 MoR。
- 用 Stripe → 你就是卖家，VAT/GST/销售税自己处理，`/refund` 里"我们的 MoR（Creem / Paddle）"**必须删掉重写**
- 用 Creem/Paddle → 他们当卖家，税务由他们承担，原句才成立

所以顺序固定：**先定主体和渠道 → 再写收款文案**，不能反。

**2. "补 `/privacy`" 是错的。**
`/privacy` 已上线且有完整正文（81 行：采集项、留存期、第三方共享、删除方式）。要做的只是把里面的 `[上线日期]` 换掉。按"从零新建"会白花半天。

**3. "Hero 重构"已经做完。**
副标题、3 个 chips、上传框作为首屏焦点，全部已实现。这条直接跳过。

**4. "首页没有任何示例播放器"——描述不准。**
`DemoSection` 里有 6 个 `<audio>` 播放器，但 `public/demo/` **目录根本不存在**，所以 6 个播放器全是 404 空壳。结论（听不到东西）对，修法是**生成音频文件**，不是改组件结构。但结构本身仍建议按"成对试听"重排（P1-B7）。

**5. footer 不是"改成三列"。**
现在已经是 4 列（Brand / Product / Legal / Contact）。只需要在 Contact 组补 About、Contact 两个链接。

#### 与审阅 A 的关系

两份报告的 P0 会撞车：A 的"确认收款主体"（P0-B）同时决定 B 的"改收款文案"（P0-B3）。**主体不定，B3 就无法完成。** 其余 P0（B1/B2/B4/B5/B6）不依赖主体，可以立刻做。

---

## 6. 上线检查清单

- [x] `https://voiclu.com/robots.txt` 没有 `Disallow: /`，有 `Sitemap:` 行
- [x] `/sitemap.xml` 能打开，6 条真实 URL，`Content-Type: application/xml`
- [x] 每页 Title / Description 不为空
- [x] 地址栏有锁（HTTPS），证书有效期至 2027-02-03
- [x] 首页移动端正常，工具卡可点
- [x] GSC 网域资源验证通过
- [x] GSC 提交 sitemap
- [ ] GSC sitemap 状态转为「成功」（待 Google 重试）
- [ ] Google 搜 `site:voiclu.com` 能看到页面
- [ ] API 真实链路跑通（等环境变量）
- [ ] Creem 真买一单额度到账
- [ ] 全站搜 `[` 无占位符残留（`/terms`、`/privacy` 各一处）
- [ ] `/sitemap.xml` ≥12 条
- [ ] 五个合规页 + `/about` + `/contact` 全部 200
- [ ] 首页正文 ≥800 词，标题层级 H1→H2→H3 不跳级
- [ ] demo 区 6 组音频可点播（无 404）

---

## 7. 风险

1. **巴西量最大但最不赚钱**（出价差一个量级）。葡语页是流量补充池，主力必须放英文页 + 美国定价。
2. **合规不行会先出事**。授权勾选 / 水印 / 下架入口是支付通道的护城河，不能等出问题再补。
3. **产能就是成本上限**。Creator 每月 $22 含 121 分钟，免费用户和你自己的测试都在这个池子里，所以免费额度只能是 1 次 ≤150 字符。
4. **`[实测填写]` 是时间成本大头**，但也是 `/best`、`/alternatives` 能排上去的唯一理由——编参数会被评论区拆穿，也过不了 Google 的质量判断。
5. **只等谷歌不行**。这条赛道的竞品直接访问占比 46.9%~63.6%，搜索只占 12%~39%，必须配短视频和社区传播。
6. **Creem 有封户与提现风险**（社群 2026-09~11 多次反馈：生成式 AI 业务审核严、要 6 个月交易记录、退款率 <1%、Visa 付款失败、有封户案例、提现不支持支付宝）。缓解：合规页与退款政策做实、预留第二个 MoR（Paddle / Lemon Squeezy）随时可切、不要把单一渠道当命门。
7. **收款主体是硬约束**。大陆个人身份开不了 Stripe；有港/美主体才能走 Stripe + PayPal，否则只能依赖 MoR。这条决定渠道顺序，必须先确认。
8. **定价可能卖亏**。$9.9 / 20,000 字符，若用户跑满且模型是 `eleven_multilingual_v2`（1 字符 = 1 credit），单用户月消耗约 20,000 credits。上线前必须做毛利测算（含超额策略），不能拍脑袋定价。
9. **demo 区是空的，这是当前最大的转化损失**。`DemoSection` 有 6 个播放器，但 `public/demo/` 目录不存在，点播全是 404。对"克隆声音"这种必须听效果的品类，等于让人盲买。
10. **收款文案写错会变成合规问题**。`/refund` 现在写"我们的 MoR（Creem / Paddle）"——如果最终用 Stripe 收单，这句就是假的（Stripe 不是 MoR，你自己才是卖家，税自己担）。先定渠道再写文案，顺序不能反。

---

## 8. 附录：文件索引

| 文件 | 说明 |
|---|---|
| `sql/schema.sql` | 7 张表建表脚本（Supabase SQL Editor 直接执行） |
| `.env.example` | 17 个环境变量模板（11 必需 + 4 可选 + 2 已配） |
| `scripts/push-env.sh` | 读 `.env.local` 批量推变量到 Vercel 生产环境 |
| `scripts/check-elevenlabs.mjs` | 查 ElevenLabs 层级/额度/声音，自动配演示声音 |
| `docs/REVIEW-2026-11.md` | 外部审阅 A 原文 + 现状核对（定位 / 收款 / 关键词） |
| `docs/REVIEW-2026-11-pages.md` | 外部审阅 B 原文 + 现状核对（页面 / 设计 / 合规）+ 视觉规范 |
| `src/lib/constants.ts` | 价格、额度、语言数、`CONTENT_UPDATED` |
| `src/lib/billing.ts` | 缓存键、额度检查、计费记录 |
| `src/lib/elevenlabs.ts` | IVC + TTS 封装 |
| `src/lib/emails.ts` | 5 封邮件模板（Resend） |
| `src/lib/wav.ts` | 浏览器端 webm → 16-bit PCM WAV 转码 |
| `README.md` | 部署清单与操作步骤 |
