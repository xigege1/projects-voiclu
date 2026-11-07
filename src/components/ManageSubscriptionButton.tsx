"use client";

/**
 * 「管理订阅」按钮。
 *
 * 存在的理由不是体验，是合规：Creem 的商户要求里写明，用户必须能在产品内
 * 自助取消订阅（走 Customer Portal 也算）。只靠收据邮件里的链接不够——
 * 用户删了邮件就投诉无门，而投诉到 Creem 会由他们代退款。
 *
 * 未登录时弹登录框，登录成功自动继续，不用再点第二次。
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import AuthDialog from "./AuthDialog";

const TOKEN_KEY = "voiclu_token";

export default function ManageSubscriptionButton({ label = "Manage subscription" }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");

  async function open(token: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/billing/portal", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setAuthOpen(true);
        return;
      }

      if (res.status === 404) {
        setError("This account has no Creem purchase yet. If you paid with a different email, contact support.");
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (!res.ok || !data.url) {
        setError("Could not open the billing portal. Email support and we will sort it out.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function onClick() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setAuthOpen(true);
      return;
    }
    void open(token);
  }

  return (
    <div>
      <Button variant="outline" onClick={onClick} disabled={busy}>
        {busy ? "Opening portal…" : label}
      </Button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={(t) => {
          setAuthOpen(false);
          void open(t);
        }}
      />
    </div>
  );
}
