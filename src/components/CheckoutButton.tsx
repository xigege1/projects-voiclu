"use client";

/**
 * 结账按钮。
 *
 * 登录态在 sessionStorage（`voiclu_token`），普通 `<a href>` 带不上 Authorization 头，
 * 所以这里点下去先换个一次性 checkout 会话（POST /api/checkout），再跳到 Creem 收银台。
 *
 * 未登录时不报错，直接弹登录框；登录成功后自动继续结账，不用再点一次。
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AuthDialog from "./AuthDialog";

const TOKEN_KEY = "voiclu_token";

export default function CheckoutButton({
  planId,
  label,
  highlighted = false,
}: {
  planId: string;
  label: string;
  highlighted?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");

  async function start(token: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId }),
      });

      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setAuthOpen(true);
        return;
      }

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError("Checkout is unavailable right now. Please try again in a moment.");
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
    void start(token);
  }

  return (
    <div className="w-full">
      <Button
        onClick={onClick}
        disabled={busy}
        className={cn("w-full", highlighted && "btn-primary")}
        variant={highlighted ? "default" : "outline"}
      >
        {busy ? "Opening checkout…" : label}
      </Button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={(t) => {
          setAuthOpen(false);
          void start(t);
        }}
      />
    </div>
  );
}
