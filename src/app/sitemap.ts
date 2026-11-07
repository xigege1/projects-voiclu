import type { MetadataRoute } from "next";
import { SITE, CONTENT_UPDATED, PAGES_ADDED } from "@/lib/constants";

/**
 * sitemap —— 所有返回 200 且允许索引的页面都应该在这里，否则等于没提交给 Google。
 *
 * 2026-11-05 修：之前只有 6 条，四个法务页全在外面；而首页 hreflang 已经
 * 声明了 `pt-BR → /br`，sitemap 里却没有 /br —— 明确的自相矛盾。
 *
 * 2026-11-07 修：11 条 URL 全用同一个 11-05 的 lastmod，11-06 新增的页面
 * 没有独立时间戳，GSC 一直显示「上次读取 11/5 / 已发现 6 个网页」的旧快照。
 * 现在按页面真实改动日分别记录。
 *
 * ⚠️ 维护规则：lastmod 只在页面正文真的改动时才改，不要跟着部署时间走。
 * 仅仅增删 URL 而正文没变时，新增 URL 本身就是信号，不必全站刷日期。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  type Freq = "daily" | "weekly" | "monthly" | "yearly";
  // [路径, 优先级, 更新频率, 正文最后改动日]
  const pages: Array<[string, number, Freq, string]> = [
    // 核心转化页（11-05 上线时的原始页面）
    ["", 1, "weekly", CONTENT_UPDATED],
    ["/pricing", 0.9, "weekly", CONTENT_UPDATED],
    ["/free", 0.9, "weekly", CONTENT_UPDATED],
    // 内容页（各自锁一个词族）
    // ⚠️ /alternatives 与 /best 暂移出 sitemap：正文含 [实测填写] 占位符，
    // 页面已加 noindex，等真实试用填完后重新加回（改这一处即可）。
    ["/text-to-speech", 0.8, "weekly", CONTENT_UPDATED],
    // 语言副本（与首页 hreflang 对应，漏了就是 hreflang 指向 sitemap 外的页面）
    ["/br", 0.7, "weekly", CONTENT_UPDATED],
    // 公司页 + 法务页：11-06 新建，或当天清掉占位符 / 补上法域
    ["/about", 0.5, "monthly", PAGES_ADDED],
    ["/contact", 0.5, "monthly", PAGES_ADDED],
    ["/privacy", 0.3, "yearly", PAGES_ADDED],
    ["/terms", 0.3, "yearly", PAGES_ADDED],
    ["/refund", 0.3, "yearly", PAGES_ADDED],
    ["/voice-removal", 0.3, "yearly", PAGES_ADDED],
  ];

  return pages.map(([p, priority, changeFrequency, lastmod]) => ({
    url: `${SITE.url}${p}`,
    lastModified: new Date(`${lastmod}T00:00:00Z`),
    changeFrequency,
    priority,
  }));
}
