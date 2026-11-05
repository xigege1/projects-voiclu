import Link from "next/link";
import { LANG_COUNT_LABEL } from "@/lib/constants";

/**
 * 首页正文区 —— 300~500 词「什么是 voice cloning」+ 与 ElevenLabs 的 5 行对比表。
 * 审阅 B 的核心建议：首页正文 ≥800 词才有资格参与 SEO 竞争；
 * 对比表只放 5 行、手机不横向溢出，表底链到 /alternatives。
 */

const COMPARISON = [
  { k: "Price", voiclu: "From $9.9/mo", eleven: "From $5/mo (free tier limited)" },
  { k: "Languages", voiclu: LANG_COUNT_LABEL, eleven: "30+" },
  { k: "Commercial license", voiclu: "Included on paid plans", eleven: "Paid plans only" },
  { k: "Credit card to try", voiclu: "No", eleven: "No (free tier)" },
  { k: "Watermark", voiclu: "None on paid", eleven: "None on paid" },
];

export default function ExplainSection() {
  return (
    <section className="section-pad border-t border-border/60">
      <div className="container-gutter mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* 左：正文 */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              What is AI voice cloning?
            </h2>
            <div className="mt-5 space-y-4 text-base leading-7 text-muted-foreground">
              <p>
                Voice cloning turns a short recording of your voice into a digital copy that can
                speak new text you never recorded. You upload 30 seconds to 3 minutes of clean
                speech, and a model learns the sound of your voice — its timbre, accent, and
                rhythm — then synthesizes that same voice speaking any new sentence you type.
              </p>
              <p>
                The key difference from old text-to-speech is ownership. Instead of choosing a
                generic robotic voice, you keep your own voice, and it can speak in{" "}
                {LANG_COUNT_LABEL} languages without you learning a single word. You record once,
                and the clone handles every language, every script, every revision.
              </p>
              <p>
                The most common use is dubbing: record a YouTube video or podcast in English, then
                publish it in Spanish, Chinese, Japanese, Korean, French, and German — the same
                voice, the same energy, translated and re-spoken. Audiobook narrators clone their
                voice once and narrate whole books without returning to the studio. Course creators
                sell one course in five markets with the instructor still speaking.
              </p>
              <p>
                Because cloning touches real voices, it needs guardrails. Voiclu requires a consent
                confirmation before every clone, logs the timestamp and IP, and takes down any
                voice that is reported. You own your samples and your output; on paid plans you get
                a commercial license to use it in products you sell.
              </p>
            </div>
          </div>

          {/* 右：5 行对比表 */}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Voiclu vs ElevenLabs
            </h2>
            <div className="mt-5 overflow-hidden rounded-xl border bg-card">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-muted text-foreground">
                    <th className="px-4 py-3 font-semibold"></th>
                    <th className="px-4 py-3 font-semibold">Voiclu</th>
                    <th className="px-4 py-3 font-semibold">ElevenLabs</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={row.k} className={i % 2 ? "bg-muted/40" : "bg-card"}>
                      <td className="px-4 py-3 font-medium text-foreground">{row.k}</td>
                      <td className="px-4 py-3 text-foreground/90">{row.voiclu}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.eleven}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              See the full breakdown on{" "}
              <Link href="/alternatives" className="font-medium text-primary underline">
                the alternatives page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
