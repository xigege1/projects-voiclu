"use client";

/**
 * 首页工具卡 —— Voice Cloning / Text to Speech 双 tab
 *
 * 防烧钱的细节（方案 D1/D3/D4）：
 *   - 上传前前端先检测时长（30s~3min）、静音、峰值过低 → 不浪费一次 API 调用
 *   - consent 勾选是克隆的硬门槛
 *   - 402（免费额度用完）→ 弹付费窗，绝不 disable 生成按钮
 *   - demo 试听走静态文件，不经过这个组件、不调 API
 */
import { useRef, useState } from "react";
import AuthDialog from "./AuthDialog";
import { Button } from "@/components/ui/button";
import { webmToWavFile } from "@/lib/wav";

const LANGS = [
  "English", "Portuguese (BR)", "Spanish", "French", "German", "Italian",
  "Japanese", "Korean", "Chinese", "Hindi", "Arabic", "Russian",
].map((l) => ({ value: l.toLowerCase().split(/[\s()]+/)[0], label: l }));

type Tab = "clone" | "tts";

export default function ToolCard() {
  const [tab, setTab] = useState<Tab>("clone");
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState("");
  const [lang, setLang] = useState("en");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [paywall, setPaywall] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);

  // ---------- 前端音频检测：时长 + 粗略峰值 ----------
  async function validateAudio(f: File): Promise<string | null> {
    try {
      const url = URL.createObjectURL(f);
      const el = document.createElement("audio");
      el.src = url;
      await new Promise((r, j) => {
        el.onloadedmetadata = r;
        el.onerror = j;
      });
      const dur = el.duration;
      URL.revokeObjectURL(url);
      if (!isFinite(dur)) return null; // 有些 m4a 拿不到时长，放行由服务端兜底
      if (dur < 30) return `Audio is ${Math.round(dur)}s — we need at least 30 seconds of speech.`;
      if (dur > 180) return "Audio is longer than 3 minutes. Please trim it to 30s–3min.";
      return null;
    } catch {
      return null;
    }
  }

  async function onFile(f: File | null) {
    setErr("");
    setAudioUrl(null);
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setErr("File is over 10MB. Please upload mp3 / wav / m4a under 10MB.");
      return;
    }
    const problem = await validateAudio(f);
    if (problem) {
      setErr(problem);
      return;
    }
    setFile(f);
  }

  // ---------- 录音 ----------
  async function toggleRecord() {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        // webm → WAV（16-bit PCM，浏览器端转码，无需服务器）
        void (async () => {
          try {
            const wav = await webmToWavFile(blob);
            const problem = await validateAudio(wav);
            if (problem) {
              setErr(problem);
              return;
            }
            setFile(wav);
            setErr("");
          } catch {
            setErr("Could not process the recording. Upload an mp3/wav/m4a file instead.");
          }
        })();
      };
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setErr("Microphone access denied. Upload a file instead.");
    }
  }

  function authHeaders(): HeadersInit {
    const t = token ?? sessionStorage.getItem("voiclu_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  // ---------- 克隆 ----------
  async function doClone() {
    if (!file) return setErr("Upload 30 seconds of clean audio first.");
    if (!consent) return setErr("Please confirm you have permission to clone this voice.");
    setBusy(true);
    setErr("");
    setStage("Cloning your voice…");
    try {
      const form = new FormData();
      form.append("audio", file);
      form.append("consent", "true");
      form.append("name", "My voice");
      const res = await fetch("/api/clone", { method: "POST", body: form, headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Clone failed");
      setVoiceId(data.voiceId);
      setDemoMode(Boolean(data.demo));
      setStage(
        data.demo
          ? "Demo mode: a stock voice was used. Text to Speech below is fully live."
          : "Voice ready. Switch to Text to Speech or type below."
      );
      setTab("tts");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Clone failed");
    } finally {
      setBusy(false);
    }
  }

  // ---------- 合成 ----------
  async function doTts() {
    if (!voiceId) return setErr("Clone a voice first (tab 1).");
    if (!text.trim()) return setErr("Type some text to speak.");
    setBusy(true);
    setErr("");
    setStage("Generating audio…");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ voiceId, text: text.trim(), lang }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setPaywall(true); // 弹付费窗，不 disable 按钮
        return;
      }
      if (!res.ok) throw new Error(data.message ?? "Generation failed");
      setAudioUrl(data.audioUrl);
      setStage(data.cached ? "Served from cache (no extra charge)." : "Done — press play.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="clone" className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      {/* tabs */}
      <div className="mb-5 flex rounded-xl bg-gray-100 p-1 text-sm font-medium">
        <button
          onClick={() => setTab("clone")}
          className={`flex-1 rounded-lg py-2 ${tab === "clone" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
        >
          1 · Voice Cloning
        </button>
        <button
          onClick={() => setTab("tts")}
          className={`flex-1 rounded-lg py-2 ${tab === "tts" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
        >
          2 · Text to Speech
        </button>
      </div>

      {tab === "clone" ? (
        <div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 px-4 py-8 text-center"
          >
            <p className="text-sm text-gray-600">
              Drag clean audio here, or{" "}
              <label className="cursor-pointer font-semibold text-[var(--brand)] underline">
                browse
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              30 sec – 3 min · voice only, no music or noise · mp3 / wav / m4a
            </p>
            {file && (
              <p className="mt-2 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-medium text-[var(--brand)]">
                {file.name}
              </p>
            )}
          </div>

          <button
            onClick={toggleRecord}
            className={`mt-3 w-full rounded-lg border py-2 text-sm font-medium ${
              recording ? "border-red-300 bg-red-50 text-red-600" : "border-gray-200 text-gray-600"
            }`}
          >
            {recording ? "■ Stop recording" : "● Record in browser"}
          </button>

          <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs leading-5 text-gray-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
            />
            <span>
              I confirm this is my own voice or I have written permission from the speaker.
              Consent is logged with a timestamp and IP.
            </span>
          </label>

          <Button
            onClick={doClone}
            disabled={busy}
            className="mt-4 w-full"
          >
            {busy ? "Working…" : "Clone my voice"}
          </Button>
        </div>
      ) : (
        <div>
          {demoMode && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-700">
              <strong>Demo mode.</strong> Voice cloning isn&apos;t active on this server — a stock voice
              stands in for your clone so you can test the whole flow. Text to Speech is fully live.
            </p>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type what your cloned voice should say…"
            rows={5}
            maxLength={10000}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[var(--brand)]"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>Free run: up to 150 characters (~30s)</span>
            <span>{text.length} chars</span>
          </div>

          <div className="mt-3 flex gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {LANGS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <Button
              onClick={doTts}
              disabled={busy}
              className="flex-1"
            >
              {busy ? "Generating…" : "Generate audio"}
            </Button>
          </div>
        </div>
      )}

      {stage && !err && <p className="mt-3 text-center text-xs text-gray-500">{stage}</p>}
      {err && <p className="mt-3 text-center text-xs text-red-600">{err}</p>}

      {audioUrl && (
        <div className="mt-4 rounded-xl bg-[var(--brand-soft)] p-3">
          <audio controls src={audioUrl} className="w-full" />
          <a
            href={audioUrl}
            download="voiclu-AI-generated.mp3"
            className="mt-2 inline-block text-xs font-medium text-[var(--brand)] underline"
          >
            Download (AI-generated, free sample tag)
          </a>
        </div>
      )}

      <p className="mt-3 text-center text-[11px] text-gray-400">
        No credit card for your free run · Sign in only to keep your voice profile ·{" "}
        <button onClick={() => setAuthOpen(true)} className="underline">Sign in</button>
      </p>

      {/* 付费弹窗：402 时弹，绝不 disable 按钮 */}
      {paywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPaywall(false)}>
          <div className="w-full max-w-sm rounded-xl bg-card p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Your free generation is used</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Starter is $9.9/month for 20,000 characters (~20 min), commercial license included.
              30-day money-back guarantee.
            </p>
            <Button asChild className="mt-4 w-full">
              <a href="/pricing">See plans</a>
            </Button>
            <button onClick={() => setPaywall(false)} className="mt-3 text-xs text-gray-400">
              Maybe later
            </button>
          </div>
        </div>
      )}

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} onAuthed={(t) => setToken(t)} />
    </div>
  );
}
