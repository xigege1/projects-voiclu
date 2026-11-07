import { LANG_COUNT_LABEL } from "@/lib/constants";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

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
    desc: "MP3, straight from the browser. Every file is AI-generated from the voice you cloned.",
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
          <h2 className="section-title">How it works</h2>
          <p className="section-lead">
            Three steps from a short recording to a finished dub — no studio, no re-recording.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <Card key={s.n} className="items-start p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-[var(--brand-light)] ring-1 ring-primary/25">
                  {s.n}
                </div>
                <CardTitle className="mt-5 text-lg">{s.title}</CardTitle>
                <CardContent className="px-0 text-[15px] leading-7 text-muted-foreground">
                  {s.desc}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 使用场景：两列宽卡，正文不再被挤成 15 字一行 */}
      <section className="section-pad border-t border-border/60">
        <div className="container-gutter mx-auto max-w-5xl">
          <h2 className="section-title">What people build with it</h2>
          <p className="section-lead">
            One voice, reused everywhere — the part that used to cost weeks of studio time.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {USE_CASES.map((u) => (
              <Card key={u.title} className="items-start p-7">
                <CardTitle className="text-lg">{u.title}</CardTitle>
                <CardContent className="px-0 text-[15px] leading-7 text-muted-foreground">
                  {u.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
