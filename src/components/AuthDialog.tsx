"use client";

/**
 * 登录弹窗（邮箱验证码，只做这一种，不做密码找回）
 * 成功后 token 存 sessionStorage，请求 API 时放 Authorization: Bearer
 */
import { useState } from "react";

export default function AuthDialog({
  open,
  onClose,
  onAuthed,
}: {
  open: boolean;
  onClose: () => void;
  onAuthed: (token: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  async function requestCode() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const msg: string = (await res.json()).message ?? "Failed to send code";
        // Supabase 有 20 秒频控，原文对用户不友好，换成人话
        throw new Error(
          /only request this after/i.test(msg)
            ? "Please wait a few seconds before requesting another code."
            : msg
        );
      }
      setSent(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Invalid code");
      sessionStorage.setItem("voiclu_token", data.access_token);
      onAuthed(data.access_token);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">Sign in to Voiclu</h2>
        <p className="mt-1 text-sm text-gray-500">
          {sent
            ? `We sent a code to ${email}. It expires in 10 minutes.`
            : "Email code only — no passwords, nothing to reset."}
        </p>

        {!sent ? (
          <>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
            />
            <button
              onClick={requestCode}
              disabled={busy || !email}
              className="mt-3 w-full rounded-lg bg-[var(--brand)] py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send code"}
            </button>
          </>
        ) : (
          <>
            <input
              inputMode="numeric"
              placeholder="Code from email"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-[var(--brand)]"
            />
            <button
              onClick={verify}
              disabled={busy || code.length < 6}
              className="mt-3 w-full rounded-lg bg-[var(--brand)] py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Verifying…" : "Verify"}
            </button>
          </>
        )}

        {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        <button onClick={onClose} className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600">
          Close
        </button>
      </div>
    </div>
  );
}
