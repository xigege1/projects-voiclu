# Voiclu — AI Voice Cloning 工具站

voiclu.com 的 Next.js (App Router) 项目。按 14 天方案（D0–D14）搭建，代码已就绪，上线只差填环境变量和几件必须你本人账号操作的事。

> **完整的业务需求、技术方案、执行记录与待办清单见 [`docs/PROJECT.md`](docs/PROJECT.md)。**

## 已完成（对应方案的哪一天）

| 方案 | 状态 |
|---|---|
| D0 项目骨架 | ✅ Next 16 + Tailwind 4，导航/页脚/布局 |
| D1 `/api/clone` + `/api/tts` | ✅ ElevenLabs IVC + TTS；默认模型已升级为 `eleven_v4`（官方 90+ 语言、单次 10,000 字符） |
| D2 五张表 + 缓存 | ✅ `sql/schema.sql`，缓存键 `sha256(provider_voice_id\|lang\|text)`，命中不扣额度（`jobs.api_called=false`） |
| D3 首页 8 模块 + demo 区 | ✅ 工具卡双 tab、consent 勾选、时长检测已就绪；`public/demo/` 13 个音频已生成（2026-11-07），6 组对比播放器可播放 |
| D4 登录 + 免费额度 | ✅ Supabase 邮箱验证码；额度记 `usage` 表；第 2 次生成弹付费窗（402），按钮不置灰 |
| D5 支付 | ⚠️ 桩已就绪：`/api/webhooks/creem` 幂等入账；Creem 产品和 checkout 链接要你注册后创建 |
| D6 5 个英文页 + TDK | ✅ `/` `/free` `/best` `/alternatives` `/text-to-speech` `/pricing` |
| D7 SEO | ✅ sitemap.xml（11 条，按页分别记 lastmod）、robots.txt、每页 canonical + TDK；GSC 网域资源已验证并提交 |
| D10-11 合规 | ⚠️ consent 落库（时间 + IP）、`/voice-removal` 页已上线；**生成音频的机器可读 AI 标记尚未实现**，见 `docs/PROJECT.md` §7 |
| /br 葡语页 | ✅ 已进 sitemap，hreflang 三处齐全（en / pt-BR / x-default） |
| Bing / IndexNow | ✅ `public/<key>.txt` + `scripts/indexnow.mjs`；2026-11-07 首次推送 11 条 URL，两端点均返回 HTTP 202 |

## 本地开发

```bash
cp .env.example .env.local   # 填 key（见下）
npm install
npm run dev                  # http://localhost:3000
```

没有 key 也能跑：页面和 demo 区正常渲染，只有真实克隆/生成会报错。

## 环境变量（.env.local）

见 `.env.example`。三个必填块：

1. **Supabase**：建项目 → SQL Editor 依次执行 `sql/schema.sql`、`sql/migrations/2026-11-08-atomic-usage-and-orders.sql` → Settings → API 拷贝三个值。已有数据库也必须在部署新版代码前执行该迁移（匿名声纹 ID 类型及额度 RPC）；Auth → Emails 里把发件模板里的 `{{ .Token }}` 留着（验证码模式）。
2. **ElevenLabs**：Profile → API Keys。Starter（$6/月）起才有 Instant Voice Cloning 与商用许可；免费档只能用 `ELEVENLABS_DEMO_VOICE_ID` 跑通链路。
3. **R2**：建 bucket `voiclu-audio` → 绑定公开域名（如 cdn.voiclu.com）→ 生成 API Token。

## 上线步骤（必须你本人操作的清单）

> **当前状态（2026-11-07）**：GitHub `xigege1/projects-voiclu` 已推送；Vercel 项目 `voiclu`（team xigege2）已部署且已接 GitHub 自动部署；`https://voiclu.com` 已上线，证书有效期至 2027-02-03，`www` 308 跳转到主域。**剩下主要是环境变量没填**，所以页面能看、API 会 500。

**Cloudflare DNS 已配好（Proxy = DNS only / 灰云）：**

| Type | Name | Content |
|---|---|---|
| A | `@` | `216.198.79.65`、`64.29.17.65`（Vercel anycast） |
| CNAME | `www` | `2833759d9d5b7e9e.vercel-dns-017.com` |

> 踩坑记录：域名刚挂上时 apex 用 CNAME 会与 Cloudflare 的 CNAME flattening 冲突，用 Vercel 面板给的 A 记录更稳。若出现「HTTP 能开、HTTPS 握手失败、证书列表里没有该域名」，说明证书没触发签发 —— 把域名从项目里摘掉再重新添加即可。

1. **GitHub 私有仓库**：✅ 已完成（remote 用 SSH）
2. **Vercel**：✅ 已部署；后续 `git push` 自动触发部署
3. **Cloudflare DNS**：✅ 已完成，证书自动签发
4. **Google Search Console**：✅ 网域资源已验证、sitemap 已提交且状态「成功」。**待办**：站点地图页删掉旧记录重新提交（GSC 上次读取 11/5，读到的是 6 条的旧版），再用「网址检查」对首页和 4 个核心页逐个请求编入索引
5. **Bing**：见下一节，走 GSC 一键导入最快
6. **环境变量**：把 `.env.example` 复制成 `.env.local` 填好值 → `bash scripts/push-env.sh` → `npx vercel deploy --prod --yes`
7. **demo 音频**：✅ 已生成（2026-11-07，Sarah 音色，13 个文件 1.31 MB）。重新生成用一条命令：
   `npm run demo:audio -- --voice-id <voice_id>`（`--dry-run` 可先看计划与 credits 消耗）。
   情绪样本走 `eleven_v3` 音频标签，套餐不支持时自动回退。若换成真人原声，用 `--originals <目录>` 传入
   `original-1.mp3` / `original-2.mp3`，其余克隆片段由脚本合成。
8. **Creem**：注册 → 建 4 个产品 → checkout 链接替换 `PricingSection.tsx` 里的 TODO → webhook 指向 `https://voiclu.com/api/webhooks/creem` → 填 `CREEM_WEBHOOK_SECRET` → **用测试卡真买一单**
9. **上线检查**：
   - `https://voiclu.com/robots.txt` 没有 `Disallow: /`，有 `Sitemap:` 行
   - `/sitemap.xml` 打开是 **11 个 URL**（含 `/br`，不含已 noindex 的 `/best` `/alternatives`）
   - `https://voiclu.com/1007d7cf922e9a848e7c2a877e26f699.txt` 返回 key 本身
   - 每页 Title / Description / canonical 非空

## Bing / IndexNow 收录（2026-11-07 加）

Google 只能靠 sitemap 等爬虫；Bing 支持 IndexNow，提交后通常几分钟到几小时进索引，且一次提交会同步给 Yandex / Seznam / Naver 等参与引擎。**Google 没有加入 IndexNow**，所以 sitemap 仍要维护。

**一次性接入（需要你本人账号）**

1. 打开 `https://www.bing.com/webmasters`，用 Microsoft / Google 账号登录
2. `Add a site` → 选 **Import from Google Search Console**：GSC 网域资源已验证，Bing 会连站点和 sitemap 一起导入，不需要再放验证文件（约 2 分钟）
3. 左侧 `Sitemaps` 确认 `https://voiclu.com/sitemap.xml` 已导入；没有就手动提交一次
4. 左侧 `IndexNow Insights` 看提交记录与收录速度。若这里一直显示 "get started"，说明只走了共享端点，直投 `www.bing.com/indexnow` 才会登记 —— 脚本已经两个端点都投了

**每次内容更新后**

```bash
git push                                     # Vercel 自动部署，public/<key>.txt 随之上线
npm run indexnow                             # 把 sitemap 全部 URL 推给 Bing + 协议共享端点
npm run indexnow -- --dry-run                # 只列 URL，不发请求
npm run indexnow -- --url https://voiclu.com/free   # 只推一条
```

前置条件：`public/1007d7cf922e9a848e7c2a877e26f699.txt` 必须已部署且可公开访问，否则 key 校验失败返回 403。返回 **202 = 已接收、key 校验中**，属正常结果；部署完成后再跑一次即可完成校验。

> 2026-11-07 首次提交时 key 文件尚未部署，两端点返回 202（待校验）。**部署后必须再跑一次 `npm run indexnow`**，否则这次提交不会真正生效。

## 上线前必须补的内容（不能编的）

- `/best`、`/alternatives` 里所有 `[实测填写]`：9~11 个工具各注册试用一遍再填（这两页目前 noindex 且不在 sitemap，填完再加回）
- **生成音频的机器可读 AI 标记**：FAQ 里已宣称「每个文件都在元数据里标记 AI 生成」，但 `synthesize()` 目前只返回裸 MP3，尚未写入 ID3 / C2PA 标记。EU AI Act 第 50 条对存量系统的期限是 2026-12-02
- `/privacy` 的 LGPD 段落、`/terms` 司法辖区（当前暂用 Singapore，待与收款主体一起确认）

## 关键架构决策（防亏钱的三道闸）

1. **缓存**：`sha256(provider_voice_id|lang|text)` 命中 → 返回已有 URL，不调 API 不扣额度（`src/lib/billing.ts`）
2. **demo 预生成**：首页试听全部走 `public/demo/` 静态文件，免费流量零 API 成本（13 个文件共 1.31 MB，`npm run demo:audio` 可重生成）
3. **额度只信数据库**：免费 1 次记 `usage` 表；匿名（cookie）1 次 + 登录 1 次，服务端限流每身份 24h 5 次克隆

## TTS 模型与文案的一致性

`src/lib/elevenlabs.ts` 默认 `eleven_v4`（官方 90+ 语言 / 单次 10,000 字符），全站文案写 "75+" 是保守下限，不构成虚假宣传。用 `ELEVENLABS_MODEL_ID` 可覆盖模型，`/api/tts` 会按模型自动调整单次字符上限。

**回滚到 `eleven_multilingual_v2` 时必须同步把全站 "75+" 下调到 29 种语言** —— 旧配置正是栽在这里。各厂商能力与报价的完整评估见 `docs/PROJECT.md` §5.8。
