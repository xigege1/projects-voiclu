import { LANG_COUNT_LABEL } from "@/lib/constants";

const STEPS = [
  {
    n: 1,
    title: "Upload 30 seconds of clean audio",
    desc: "A quiet room and your normal voice are enough. No music, no echo, no other speakers.",
  },
  {
    n: 2,
    title: `Pick a language and paste your text`,
    desc: `${LANG_COUNT_LABEL} languages. The voice stays yours — accent and timbre come from your sample.`,
  },
  {
    n: 3,
    title: "Download the audio",
    desc: "MP3 in the browser, WAV on Creator plans. Every file is marked AI-generated.",
  },
];

const USE_CASES = [
  {
    title: "YouTube dubbing",
    body: "Record once, publish in every market. Cloned voice keeps the same tone and energy as your original, so a single video becomes one version per language — no re-recording, no awkward subtitles.",
  },
  {
    title: "Podcasts",
    body: "Turn one episode into a multi-language show. The same host's voice, translated and re-spoken, so international listeners hear you — not a robotic narrator.",
  },
  {
    title: "Audiobook narration",
    body: "Narrate an entire book from one short sample. Long-form narration keeps a consistent voice across chapters, even when you add or rewrite sections later.",
  },
  {
    title: "Online courses",
    body: "One course, sold in five languages. Re-voice every lecture in your own voice, so the instructor stays the instructor in every market you enter.",
  },
];

export default function StepsAndUseCases() {
  return (
    <>
      {/* 三步说明：H1 后需要 H2 承接，避免 H1 → H3 跳级 */}
      <section className="section-pad">
        <div className="container-gutter mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-gray-100 p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-soft)] font-bold text-[var(--brand)]">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使用场景：标题扩成可读段落（首页正文量的主要来源） */}
      <section className="section-pad bg-[var(--brand-soft)]">
        <div className="container-gutter mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            What people build with it
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((u) => (
              <div key={u.title} className="rounded-xl bg-white p-6">
                <h3 className="font-semibold text-gray-900">{u.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{u.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
