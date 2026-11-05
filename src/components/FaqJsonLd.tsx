/**
 * FAQPage JSON-LD —— 让 Google 在搜索结果里直接展示问答富摘要。
 * 只放页面 DOM 里确实存在的 Q/A（数据来自 constants 的同一份 FAQ）。
 */
export default function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
