"use client";

/**
 * 邮件链接登录落地处理。
 *
 * 用户点邮件里的 "Confirm email address" / "Sign in" 链接时，Supabase 会跳回
 * https://voiclu.com/#access_token=...&refresh_token=...
 * 这个组件在任意页面挂载时检查 hash，把 token 交给服务端校验、写入 sessionStorage，
 * 然后清掉 URL 里的 hash 并刷新，让页面进入已登录状态。
 *
 * 这样即使邮件模板里只有链接、没有 6 位验证码，登录依然可用。
 */
import { useEffect } from "react";

export default function HashAuth() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.includes("access_token=")) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    if (!accessToken) return;

    // 立刻清掉 hash，避免 token 留在地址栏、被复制或进历史记录
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    (async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: accessToken }),
        });
        if (!res.ok) return;
        sessionStorage.setItem("voiclu_token", accessToken);
        const refresh = params.get("refresh_token");
        if (refresh) sessionStorage.setItem("voiclu_refresh", refresh);
        // 刷新一次让各组件读到新的登录态
        window.location.replace(window.location.pathname);
      } catch {
        /* 静默失败：用户可以退回用 6 位验证码登录 */
      }
    })();
  }, []);

  return null;
}
