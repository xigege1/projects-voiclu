#!/usr/bin/env node
/**
 * IndexNow 提交脚本 —— 把 sitemap 里的 URL 主动推给 Bing / Yandex / Seznam 等。
 *
 * 为什么需要：Google 只能靠 sitemap + 等爬虫；Bing 支持 IndexNow，
 * 提交后通常几分钟到几小时就能进索引，且一次提交会同步给所有参与引擎。
 * 注意：Google 没有加入 IndexNow，所以 sitemap 仍然要维护。
 *
 * 用法：
 *   npm run indexnow                      提交 sitemap 里全部 URL（批量 POST）
 *   npm run indexnow -- --dry-run         只列出 URL，不发请求
 *   npm run indexnow -- --url https://voiclu.com/free   只推一条（GET）
 *
 * 前置条件：public/<key>.txt 必须已经部署上线且可公开访问，
 * 否则搜索引擎校验不到 key 文件，会返回 403。
 * 返回 202 表示「已收到，key 校验中」，也是正常结果。
 */
import { readFileSync } from "node:fs";

const DEFAULT_KEY = "1007d7cf922e9a848e7c2a877e26f699";
const SITE_URL = (
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://voiclu.com"
).replace(/\/+$/, "");
const KEY = process.env.INDEXNOW_KEY || DEFAULT_KEY;
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const HOST = new URL(SITE_URL).host;

// 两个端点都投：共享端点覆盖全部参与引擎，Bing 直投确保 BWT 的
// IndexNow Insights 报表能记录到提交（共享端点有时不会立即出现在该报表里）。
const ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const singleIdx = args.indexOf("--url");
const singleUrl = singleIdx >= 0 ? args[singleIdx + 1] : null;

function assertSameHost(url) {
  try {
    return new URL(url).host === HOST;
  } catch {
    return false;
  }
}

async function urlsFromSitemap() {
  const res = await fetch(`${SITE_URL}/sitemap.xml`, {
    headers: { "User-Agent": "voiclu-indexnow/1.0" },
  });
  if (!res.ok) throw new Error(`抓取 sitemap.xml 失败：HTTP ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
  if (!urls.length) throw new Error("sitemap.xml 里没有找到 <loc>");
  const sameHost = urls.filter(assertSameHost);
  if (sameHost.length !== urls.length) {
    console.log(`[提示] 过滤了 ${urls.length - sameHost.length} 条非本域 URL`);
  }
  return sameHost;
}

function explain(status) {
  return {
    200: "已接收",
    202: "已接收，key 校验中（正常）",
    400: "请求格式错误",
    403: "key 校验失败：确认 public/<key>.txt 已部署且内容一致",
    422: "URL 与 host 不匹配，或 key 格式不合规",
    429: "提交过于频繁，稍后重试",
  }[status] || "未知状态，查看响应体";
}

async function postBatch(urls) {
  const body = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  });
  let ok = 0;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
      });
      const text = await res.text().catch(() => "");
      console.log(`  ${endpoint} -> HTTP ${res.status} ${explain(res.status)}`);
      if (text.trim()) console.log(`    ${text.trim().slice(0, 200)}`);
      if (res.status === 200 || res.status === 202) ok++;
    } catch (err) {
      console.log(`  ${endpoint} -> 请求失败：${err.message}`);
    }
  }
  return ok;
}

async function getSingle(url) {
  let ok = 0;
  for (const endpoint of ENDPOINTS) {
    const target = `${endpoint}?url=${encodeURIComponent(url)}&key=${KEY}`;
    try {
      const res = await fetch(target);
      console.log(`  ${endpoint} -> HTTP ${res.status} ${explain(res.status)}`);
      if (res.status === 200 || res.status === 202) ok++;
    } catch (err) {
      console.log(`  ${endpoint} -> 请求失败：${err.message}`);
    }
  }
  return ok;
}

async function main() {
  // 本地自检：key 文件必须和脚本里的 KEY 一致，否则线上校验必然 403
  try {
    const local = readFileSync(new URL(`../public/${KEY}.txt`, import.meta.url), "utf8").trim();
    console.log(`[本地] public/${KEY}.txt ${local === KEY ? "内容匹配" : "内容与 KEY 不一致，请检查"}`);
  } catch {
    console.log(`[本地] 找不到 public/${KEY}.txt`);
  }
  console.log(`[配置] host=${HOST}  keyLocation=${KEY_LOCATION}`);

  const urls = singleUrl ? [singleUrl] : await urlsFromSitemap();
  if (singleUrl && !assertSameHost(singleUrl)) {
    throw new Error(`URL 必须属于 ${HOST}`);
  }
  console.log(`[URL] 共 ${urls.length} 条${dryRun ? "（dry-run，不发送）" : ""}`);
  urls.forEach((u) => console.log(`  ${u}`));
  if (dryRun) return;

  const ok = singleUrl ? await getSingle(singleUrl) : await postBatch(urls);
  console.log(`[结果] ${ok}/${ENDPOINTS.length} 个端点接收成功`);
  if (ok === 0) {
    console.log("[结果] 全部失败：先确认站点已部署最新 public 文件，再重试");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`[失败] ${err.message}`);
  process.exitCode = 1;
});
