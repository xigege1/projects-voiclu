/**
 * demo 对比区 —— 成对试听：左边原声、右边克隆，同一条音轨，标签标明"变的是语言，不是声音"。
 *
 * 关键约束：音频必须预生成、放静态路径（public/demo/），绝不在访问时实时调接口。
 * 免费流量再多也不产生 API 成本（方案 D3）。
 *
 * 上线前动作：用真实账号跑一次克隆 + 6 条合成，把 mp3 放进 public/demo/。
 * 文件名约定：original-<n>.mp3 / clone-<lang>-<n>.mp3。放好后本区自动出现播放器，
 * 文件缺失时只显示语言标签，不再渲染一排灰秃秃的空 audio 控件。
 */

import fs from "node:fs";
import path from "node:path";
import { Card } from "@/components/ui/card";

type Pair = {
  id: string;
  lang: string;
  tag: string;
  original: string;
  clone: string;
};

// 6 组语言 + 3 组情绪。文件名与 public/demo/ 约定一一对应。
const LANGUAGE_PAIRS: Pair[] = [
  { id: "es", lang: "Spanish", tag: "English original → Spanish clone", original: "original-1.mp3", clone: "clone-es-1.mp3" },
  { id: "zh", lang: "Chinese", tag: "English original → Chinese clone", original: "original-1.mp3", clone: "clone-zh-1.mp3" },
  { id: "ja", lang: "Japanese", tag: "English original → Japanese clone", original: "original-1.mp3", clone: "clone-ja-1.mp3" },
  { id: "ko", lang: "Korean", tag: "English original → Korean clone", original: "original-1.mp3", clone: "clone-ko-1.mp3" },
  { id: "fr", lang: "French", tag: "English original → French clone", original: "original-1.mp3", clone: "clone-fr-1.mp3" },
  { id: "de", lang: "German", tag: "English original → German clone", original: "original-1.mp3", clone: "clone-de-1.mp3" },
];

const EMOTION_PAIRS: Pair[] = [
  { id: "excited", lang: "Excited", tag: "Same voice, excited delivery", original: "original-2.mp3", clone: "clone-excited-2.mp3" },
  { id: "sad", lang: "Sad", tag: "Same voice, sad delivery", original: "original-2.mp3", clone: "clone-sad-2.mp3" },
  { id: "calm", lang: "Calm", tag: "Same voice, calm delivery", original: "original-2.mp3", clone: "clone-calm-2.mp3" },
];

const DEMO_DIR = path.join(process.cwd(), "public", "demo");

function audioReady(file: string) {
  try {
    return fs.existsSync(path.join(DEMO_DIR, file));
  } catch {
    return false;
  }
}

function Player({ label, file }: { label: string; file: string }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls preload="none" src={`/demo/${file}`} className="w-full" />
    </div>
  );
}

function PairPlayer({ p }: { p: Pair }) {
  const ready = audioReady(p.original) && audioReady(p.clone);
  return (
    <Card className="items-start p-6">
      <div className="text-base font-semibold">{p.lang}</div>
      <div className="mt-1 text-sm text-muted-foreground">{p.tag}</div>

      {ready ? (
        <div className="mt-5 grid w-full gap-4 sm:grid-cols-2">
          <Player label="Original" file={p.original} />
          <Player label="Clone" file={p.clone} />
        </div>
      ) : (
        <div className="mt-5 flex min-h-14 w-full items-center justify-center rounded-lg border border-dashed border-border/70 bg-background/40 px-4 text-center text-sm text-muted-foreground">
          Sample audio coming soon
        </div>
      )}
    </Card>
  );
}

export default function DemoSection() {
  return (
    <section className="section-pad border-t border-border/60">
      <div className="container-gutter mx-auto max-w-6xl">
        <h2 className="section-title">Hear the same voice in 6 languages</h2>
        <p className="section-lead">
          The same sentence. The same voice. Only the language changes.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {LANGUAGE_PAIRS.map((p) => (
            <PairPlayer key={p.id} p={p} />
          ))}
        </div>

        <h3 className="mt-16 text-center text-xl font-semibold tracking-tight">
          Not just a new language — a new delivery
        </h3>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {EMOTION_PAIRS.map((p) => (
            <PairPlayer key={p.id} p={p} />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          All samples are pre-generated. No sign-up, just press play.
        </p>
      </div>
    </section>
  );
}
