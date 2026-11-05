import type { Metadata } from "next";
import ToolCard from "@/components/ToolCard";
import { LANG_COUNT_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Clonagem de Voz com IA — Clone Sua Voz em 3 Minutos",
  description:
    "Clone sua voz a partir de 30 segundos de áudio e faça ela falar 75+ idiomas sem gravar de novo. Teste grátis, sem cadastro.",
  alternates: {
    canonical: "/br",
    languages: { en: "/", "pt-BR": "/br", "x-default": "/" },
  },
};

/**
 * ⚠️ 上线节奏（方案硬性要求）：/br 不进 sitemap、不主动推 GSC，
 * 第 3~4 周单独上，届时把本页 URL 加进 sitemap.ts 并在英文页与葡语页互链。
 * hreflang 三处（en / pt-BR / x-default）必须都有，缺一处等于只做对一半。
 */

const FAQ = [
  {
    q: "Quanto áudio eu preciso?",
    a: "30 segundos a 3 minutos de fala limpa. Sem música, sem eco, sem outras vozes.",
  },
  {
    q: "É realmente grátis para testar?",
    a: "Sim. Uma geração completa, sem cartão de crédito e sem assinatura automática.",
  },
  {
    q: "Posso clonar a voz de outra pessoa?",
    a: "Só com autorização por escrito dela. Pedimos essa confirmação antes de cada clone e registramos o aceite. Vozes denunciadas são removidas — veja a página de remoção de voz.",
  },
  {
    q: "Preciso pagar em dólar?",
    a: "Os planos são cobrados em dólar. Os preços aparecem na página de planos com a conversão do seu cartão no momento da compra.",
  },
];

const USE_CASES = [
  { title: "Dublagem para YouTube", desc: "um vídeo, uma versão para cada mercado" },
  { title: "Podcasts", desc: "episódios em vários idiomas sem regravar" },
  { title: "Audiolivros", desc: "narração longa a partir de uma única amostra de voz" },
  { title: "Cursos online", desc: "um curso, vendido em cinco idiomas" },
];

export default function BrPage() {
  return (
    <div lang="pt-BR">
      <section className="bg-gradient-to-b from-[var(--brand-soft)] to-white py-14">
        <div className="mx-auto max-w-6xl px-4 lg:flex lg:items-start lg:gap-12">
          <div className="lg:max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight">Clonagem de Voz com IA</h1>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Clone sua voz a partir de 30 segundos de áudio. Depois deixe ela falar{" "}
              {LANG_COUNT_LABEL} idiomas — sem precisar gravar outra vez.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Sem cadastro para testar · Licença comercial nos planos pagos · Sua voz continua sua
            </p>

            <div className="mt-8 text-sm leading-7 text-gray-700">
              <ol className="list-decimal space-y-2 pl-5">
                <li><strong>Envie 30 segundos de áudio limpo</strong> — um lugar silencioso e sua voz normal bastam</li>
                <li><strong>Escolha o idioma e cole o texto</strong> — {LANG_COUNT_LABEL} idiomas disponíveis</li>
                <li><strong>Baixe o áudio</strong> — sua voz, falando outro idioma</li>
              </ol>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {USE_CASES.map((u) => (
                <div key={u.title} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="font-semibold">{u.title}</div>
                  <div className="mt-1 text-xs text-gray-500">{u.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex-1 lg:mt-0">
            <ToolCard />
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Ouça antes de se cadastrar</h2>
          <p className="mt-2 text-gray-500">A mesma frase. A mesma voz. Idiomas diferentes.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-4 text-left">
              <div className="text-sm font-semibold">Voz original</div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls preload="none" src="/demo/original-1.mp3" className="mt-2 w-full" />
            </div>
            <div className="rounded-xl bg-white p-4 text-left">
              <div className="text-sm font-semibold">Clone — inglês</div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls preload="none" src="/demo/clone-en-1.mp3" className="mt-2 w-full" />
            </div>
            <div className="rounded-xl bg-white p-4 text-left">
              <div className="text-sm font-semibold">Clone — português</div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls preload="none" src="/demo/clone-pt-1.mp3" className="mt-2 w-full" />
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Todas as amostras são pré-geradas. Sem cadastro, só apertar play.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-xl font-bold">Perguntas frequentes</h2>
          <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {FAQ.map((f) => (
              <details key={f.q} className="p-4">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-2 text-sm leading-6 text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
