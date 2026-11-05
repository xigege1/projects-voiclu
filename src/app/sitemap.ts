import type { MetadataRoute } from "next";
import { SITE, CONTENT_UPDATED } from "@/lib/constants";

/**
 * sitemap —— 所有返回 200 的页面都应该在这里，否则等于没提交给 Google。
 *
 * 2026-11-05 修：之前只有 6 条，四个法务页全在外面；而首页 hreflang 已经
 * 声明了 `pt-BR → /br`，sitemap 里却没有 /br —— 明确的自相矛盾。
 * 现在按页面类型分优先级，法务页给低权重，避免稀释首页。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${CONTENT_UPDATED}T00:00:00Z`);

  // [路径, 优先级, 更新频率]
  const pages: Array<[string, number, "daily" | "weekly" | "monthly" | "yearly"]> = [
    // 核心转化页
    ["", 1, "weekly"],
    ["/pricing", 0.9, "weekly"],
    ["/free", 0.9, "weekly"],
    // 内容页（各自锁一个词族）
    ["/alternatives", 0.8, "weekly"],
    ["/best", 0.8, "weekly"],
    ["/text-to-speech", 0.8, "weekly"],
    // 语言副本（与首页 hreflang 对应，漏了就是 hreflang 指向一个 sitemap 外的页面）
    ["/br", 0.7, "weekly"],
    // 公司页
    ["/about", 0.5, "monthly"],
    ["/contact", 0.5, "monthly"],
    // 法务页：真实存在、收款审核会看，但不需要高权重
    ["/privacy", 0.3, "yearly"],
    ["/terms", 0.3, "yearly"],
    ["/refund", 0.3, "yearly"],
    ["/voice-removal", 0.3, "yearly"],
  ];

  return pages.map(([p, priority, changeFrequency]) => ({
    url: `${SITE.url}${p}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
