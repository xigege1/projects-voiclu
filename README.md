# Voiclu — AI Voice Cloning 工具站

voiclu.com 的 Next.js (App Router) 项目。按 14 天方案（D0–D14）搭建，代码已就绪，上线只差填环境变量和几件必须你本人账号操作的事。

## 已完成（对应方案的哪一天）

| 方案 | 状态 |
|---|---|
| D0 项目骨架 | ✅ Next 16 + Tailwind 4，导航/页脚/布局 |
| D1 `/api/clone` + `/api/tts` | ✅ ElevenLabs IVC + TTS，curl 可测 |
| D2 五张表 + 缓存 | ✅ `sql/schema.sql`，缓存键 `sha256(provider_voice_id\|lang\|text)`，命中不扣额度（`jobs.api_called=false`） |
| D3 首页 8 模块 + demo 区 | ✅ 工具卡双 tab、consent 勾选、时长检测、demo 引用 `/demo/*.mp3`（预生成） |
| D4 登录 + 免费额度 | ✅ Supabase 邮箱验证码；额度记 `usage` 表；第 2 次生成弹付费窗（402），按钮不置灰 |
| D5 支付 | ⚠️ 桩已就绪：`/api/webhooks/creem` 幂等入账；Creem 产品和 checkout 链接要你注册后创建 |
| D6 5 个英文页 + TDK | ✅ `/` `/free` `/best` `/alternatives` `/text-to-speech` `/pricing` |
| D7 SEO | ✅ sitemap.xml、robots.txt、每页 metadata；提交 GSC 需你操作 |
| D10-11 合规 | ✅ consent 落库（时间+IP）、生成文件标 AI-generated、`/voice-removal` 页（48h 承诺） |
| /br 葡语页 | ✅ 已写好但**故意不进 sitemap**，第 3~4 周再启用 |

## 本地开发

```bash
cp .env.example .env.local   # 填 key（见下）
npm install
npm run dev                  # http://localhost:3000
```

没有 key 也能跑：页面和 demo 区正常渲染（demo 音频断网可播），只有真实克隆/生成会报错。

## 环境变量（.env.local）

见 `.env.example`。三个必填块：

1. **Supabase**：建项目 → SQL Editor 里整段执行 `sql/schema.sql` → Settings → API 拷贝三个值。Auth → Emails 里把发件模板里的 `{{ .Token }}` 留着（验证码模式）。
2. **ElevenLabs**：Profile → API Keys。
3. **R2**：建 bucket `voiclu-audio` → 绑定公开域名（如 cdn.voiclu.com）→ 生成 API Token。

## 上线步骤（必须你本人操作的清单）

> **当前状态（2026-11-05）**：GitHub `xigege1/projects-voiclu` 已推送；Vercel 项目 `voiclu`（team xigege2）已部署且已接 GitHub 自动部署；**`https://voiclu.com` 已上线**，13 个路由全部 200，Let's Encrypt 证书已签发（有效期至 2027-02-03），`www.voiclu.com` 308 跳转到主域。**剩下只有环境变量没填**（当前仅 `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_SUPPORT_EMAIL`），所以页面能看、API 会 500。

**Cloudflare DNS 已配好（Proxy = DNS only / 灰云）：**

| Type | Name | Content |
|---|---|---|
| A | `@` | `216.198.79.65`、`64.29.17.65`（Vercel anycast） |
| CNAME | `www` | `2833759d9d5b7e9e.vercel-dns-017.com` |

> 踩坑记录：域名刚挂上时 apex 用 CNAME 会与 Cloudflare 的 CNAME flattening 冲突，用 Vercel 面板给的 A 记录更稳。若出现「HTTP 能开、HTTPS 握手失败、证书列表里没有该域名」，说明证书没触发签发 —— 把域名从项目里摘掉再重新添加即可（本次即用此法修复）。

1. **GitHub 私有仓库**：`git remote add origin … && git push -u origin main` ✅ 已完成（remote 用 SSH）
2. **Vercel**：✅ 已部署 `https://voiclu.vercel.app`；后续 `git push` 自动触发部署
3. **Cloudflare DNS**：✅ 已完成，证书自动签发，`https://voiclu.com` 可访问
4. **GSC**：加"网域资源" `voiclu.com`，Cloudflare 加 TXT 验证 → Sitemaps 提交 `sitemap.xml` → 网址检查首页 → 请求编入索引 ⬅️ **下一步就做这个**
5. **环境变量**：把 `.env.example` 复制成 `.env.local` 填好值，然后 `bash scripts/push-env.sh` 批量推到 Vercel → `npx vercel deploy --prod --yes` 重新部署
6. **demo 音频**：用真实账号克隆自己的声音，跑 6 条合成（原声×2、克隆英文×2、克隆葡语×2），文件按此命名放进 `public/demo/`：
   `original-1.mp3` `clone-en-1.mp3` `clone-pt-1.mp3` `original-2.mp3` `clone-en-2.mp3` `clone-pt-2.mp3`
7. **Creem**：注册 → 建 4 个产品（Starter $9.9/月、Creator $29/月、One-time $49、年付）→ checkout 链接替换 `PricingSection.tsx` 里的 TODO → webhook 指向 `https://voiclu.com/api/webhooks/creem` → 签名密钥填 `CREEM_WEBHOOK_SECRET` → **用测试卡真买一单**，确认额度到账
8. **上线检查**（D7 清单）：
   - `https://voiclu.com/robots.txt` 没有 `Disallow: /`，有 `Sitemap:` 行
   - `/sitemap.xml` 打开是 6 个 URL（无 /br）
   - 每页 Title/Description 非空（查看网页源代码确认）
   - 移动端工具卡能点
   - 48h 后 `site:voiclu.com` 能搜到

## 上线前必须补的内容（不能编的）

- `/best`、`/alternatives` 里所有 `[实测填写]`：9~11 个工具各注册试用一遍再填（这是这两页能排名的唯一理由）
- `constants.ts` 的 `LANG_COUNT`：按 ElevenLabs 实际支持语言数改，别虚假宣传 75+
- `/terms` 司法辖区、`/privacy` 分析工具与存储区域、各页 `[上线日期]`

## 关键架构决策（防亏钱的三道闸）

1. **缓存**：`sha256(provider_voice_id|lang|text)` 命中 → 返回已有 URL，不调 API 不扣额度（`src/lib/billing.ts`）
2. **demo 预生成**：首页试听全部走 `public/demo/` 静态文件，免费流量零 API 成本
3. **额度只信数据库**：免费 1 次记 `usage` 表；匿名（cookie）1 次 + 登录 1 次，服务端限流每身份 24h 5 次克隆

## 第 3~4 周启用 /br 时

1. `sitemap.ts` 加 `/br`
2. 确认 `src/app/br/page.tsx` 与首页的 hreflang 三处齐全（en / pt-BR / x-default）——已写好
3. 英文页导航/页脚已有 `Português (Brasil)` 链接，葡语页链回英文页
4. GSC 提交 /br 单独请求收录
