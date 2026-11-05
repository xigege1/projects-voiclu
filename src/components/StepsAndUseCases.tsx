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
  { icon: "🎬", title: "YouTube dubbing", desc: "One video, one version per market — without re-recording." },
  { icon: "🎙️", title: "Podcasts", desc: "Publish episodes in multiple languages from a single recording." },
  { icon: "📚", title: "Audiobooks", desc: "Long-form narration from one short voice sample." },
  { icon: "🎓", title: "Online courses", desc: "One course, sold in five languages." },
];

export default function StepsAndUseCases() {
  return (
    <>
      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-gray-100 p-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-soft)] font-bold text-[var(--brand)]">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--brand-soft)] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold tracking-tight">What people build with it</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((u) => (
              <div key={u.title} className="rounded-2xl bg-white p-5">
                <div className="text-2xl">{u.icon}</div>
                <h3 className="mt-3 font-semibold">{u.title}</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
