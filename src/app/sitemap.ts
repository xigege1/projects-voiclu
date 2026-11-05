import type { MetadataRoute } from "next";
import { SITE, CONTENT_UPDATED } from "@/lib/constants";

/**
 * ⚠️ /br 故意不在里面：第 3~4 周单独启用葡语页时再把它加进来
 * （方案硬性要求：不要同一天铺好几个语言）
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${CONTENT_UPDATED}T00:00:00Z`);
  const pages = ["", "/free", "/best", "/alternatives", "/text-to-speech", "/pricing"];
  return pages.map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.8,
  }));
}
