import { FAQ_HOME } from "@/lib/constants";

export default function FaqSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-2xl font-bold tracking-tight">FAQ</h2>
        <div className="mt-8 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {FAQ_HOME.map((f) => (
            <details key={f.q} className="p-5">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm leading-6 text-gray-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
