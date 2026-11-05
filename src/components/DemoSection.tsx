/**
 * demo 对比区 —— 成对试听：左边原声、右边克隆，同一条音轨，标签标明"变的是语言，不是声音"。
 *
 * 关键约束：音频必须预生成、放静态路径（public/demo/），绝不在访问时实时调接口。
 * 免费流量再多也不产生 API 成本（方案 D3）。
 *
 * 上线前动作：用真实账号跑一次克隆 + 6 条合成，把 mp3 放进 public/demo/。
 * 文件名约定：original-<n>.mp3 / clone-<lang>-<n>.mp3。放好后本区自动可播。
 * 音频缺失时降级为占位提示，结构不动，补文件即恢复。
 */

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

function PairPlayer({ p, fallback }: { p: Pair; fallback: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 sm:p-6">
      <div className="mb-1 text-sm font-semibold text-gray-900">{p.lang}</div>
      <div className="mb-4 text-xs text-gray-500">{p.tag}</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Original</div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls preload="none" src={`/demo/${p.original}`} className="w-full" />
        </div>
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Clone</div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls preload="none" src={`/demo/${p.clone}`} className="w-full" />
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">{fallback}</p>
    </div>
  );
}

export default function DemoSection() {
  return (
    <section className="section-pad bg-gray-50">
      <div className="container-gutter mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Hear the same voice in 6 languages
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-500">
          The same sentence. The same voice. Only the language changes.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {LANGUAGE_PAIRS.map((p) => (
            <PairPlayer key={p.id} p={p} fallback="Demo audio coming soon." />
          ))}
        </div>

        <h3 className="mt-14 text-center text-xl font-semibold text-gray-900">
          Not just a new language — a new delivery
        </h3>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {EMOTION_PAIRS.map((p) => (
            <PairPlayer key={p.id} p={p} fallback="Demo audio coming soon." />
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          All samples are pre-generated. No sign-up, just press play.
        </p>
      </div>
    </section>
  );
}
