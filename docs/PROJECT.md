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

### 2.4 合规红线（先于 SEO）

| 要求 | 实现 | 状态 |
|---|---|---|
| 克隆前强制勾选授权声明 | 勾选后把 `consent_at` + `consent_ip` 写入 `voices` 表 | ✅ 已实现 |
| 生成音频标注 AI 生成 | 页脚声明 + 下载说明 + 水印参数 | ✅ 部分（水印参数待接供应商） |
| 声音下架入口 | `/voice-removal` 页 + `voice_removals` 表，48 小时内下架承诺 | ✅ 已实现 |
| 隐私政策披露「音频会发给第三方 TTS 供应商」 | `/privacy` | ✅ 已实现 |
| 巴西 LGPD 单独段落 | `/privacy` | ⬜ 待补 |

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

### 3.6 SEO

- `sitemap.xml`：6 条 URL，`/br` 故意排除（第 3~4 周启用）
- `robots.txt`：允许全站，屏蔽 `/api/`，带 `Sitemap:` 行
- 每页独立 Title / Description / H1，H1 只出现一次
- 首页 8 条 + `/free` 4 条 **FAQPage JSON-LD**
- canonical 统一指向 `https://voiclu.com`；`www` 308 跳转到主域
- `lastmod` 用固定日期（`CONTENT_UPDATED`），不用 `new Date()`——否则每次请求都是「现在」，Google 会判定 lastmod 不可靠

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

**需要本人操作（有账号依赖，无法代做）**

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

---

## 7. 风险

1. **巴西量最大但最不赚钱**（出价差一个量级）。葡语页是流量补充池，主力必须放英文页 + 美国定价。
2. **合规不行会先出事**。授权勾选 / 水印 / 下架入口是支付通道的护城河，不能等出问题再补。
3. **产能就是成本上限**。Creator 每月 $22 含 121 分钟，免费用户和你自己的测试都在这个池子里，所以免费额度只能是 1 次 ≤150 字符。
4. **`[实测填写]` 是时间成本大头**，但也是 `/best`、`/alternatives` 能排上去的唯一理由——编参数会被评论区拆穿，也过不了 Google 的质量判断。
5. **只等谷歌不行**。这条赛道的竞品直接访问占比 46.9%~63.6%，搜索只占 12%~39%，必须配短视频和社区传播。

---

## 8. 附录：文件索引

| 文件 | 说明 |
|---|---|
| `sql/schema.sql` | 7 张表建表脚本（Supabase SQL Editor 直接执行） |
| `.env.example` | 17 个环境变量模板（11 必需 + 4 可选 + 2 已配） |
| `scripts/push-env.sh` | 读 `.env.local` 批量推变量到 Vercel 生产环境 |
| `src/lib/constants.ts` | 价格、额度、语言数、`CONTENT_UPDATED` |
| `src/lib/billing.ts` | 缓存键、额度检查、计费记录 |
| `src/lib/elevenlabs.ts` | IVC + TTS 封装 |
| `src/lib/emails.ts` | 5 封邮件模板（Resend） |
| `src/lib/wav.ts` | 浏览器端 webm → 16-bit PCM WAV 转码 |
| `README.md` | 部署清单与操作步骤 |
