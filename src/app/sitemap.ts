import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

/**
 * ⚠️ /br 故意不在里面：第 3~4 周单独启用葡语页时再把它加进来
 * （方案硬性要求：不要同一天铺好几个语言）
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ["", "/free", "/best", "/alternatives", "/text-to-speech", "/pricing"];
  return pages.map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.8,
  }));
}
