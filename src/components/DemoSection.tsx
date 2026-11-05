/**
 * demo 对比区 —— 关键技巧：音频必须预生成、放静态路径（public/demo/），
 * 绝不在访问时实时调用接口。免费流量再多也不产生 API 成本（方案 D3）。
 *
 * 上线前动作：用真实账号跑一次克隆 + 6 条合成，把 mp3 放进 public/demo/。
 * 文件名约定见 README。放好后本区自动可播，断网（key 置空）也不报错。
 */

const DEMOS = [
  { file: "original-1.mp3", label: "Original voice", note: "The real recording" },
  { file: "clone-en-1.mp3", label: "Clone — English", note: "Same voice, generated" },
  { file: "clone-pt-1.mp3", label: "Clone — Portuguese", note: "Same voice, new language" },
  { file: "original-2.mp3", label: "Original voice (2)", note: "A different speaker" },
  { file: "clone-en-2.mp3", label: "Clone — English (2)", note: "Same voice, generated" },
  { file: "clone-pt-2.mp3", label: "Clone — Portuguese (2)", note: "Same voice, new language" },
];

export default function DemoSection() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight">Hear it before you sign up</h2>
        <p className="mt-2 text-center text-gray-500">
          The same sentence. The same voice. Different languages.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DEMOS.map((d) => (
            <div key={d.file} className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="text-sm font-semibold">{d.label}</div>
              <div className="text-xs text-gray-400">{d.note}</div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls preload="none" src={`/demo/${d.file}`} className="mt-3 w-full" />
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          All samples are pre-generated. No sign-up, just press play.
        </p>
      </div>
    </section>
  );
}
