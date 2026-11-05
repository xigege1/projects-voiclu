import { FAQ_HOME } from "@/lib/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FaqSection() {
  return (
    <section className="section-pad border-t border-border/60">
      <div className="container-gutter mx-auto max-w-3xl">
        <h2 className="section-title">FAQ</h2>
        <Accordion type="single" collapsible className="mt-8 w-full">
          {FAQ_HOME.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left font-medium">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
