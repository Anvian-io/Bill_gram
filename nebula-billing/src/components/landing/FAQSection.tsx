import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What kind of business is this product best suited for?",
    answer:
      "It fits trading, wholesale, and distribution-style businesses that need billing, inventory control, party management, GST-ready reporting, and operational backup from one desktop system.",
  },
  {
    question: "Does the website now explain more than just billing?",
    answer:
      "Yes. The updated structure covers inventory, master data, suppliers and customers, sales workflows, reporting, dashboard visibility, and backup and restore capability so the product story feels complete.",
  },
  {
    question: "Why use animation on a business software website?",
    answer:
      "The motion is there to add clarity and product energy. It highlights live activity, screen changes, and workflow progression without making the site feel distracting or decorative.",
  },
  {
    question: "How does the page make the UI feel more realistic?",
    answer:
      "The preview sections now resemble an actual desktop billing workspace with operational context, invoice data, alerts, reporting states, and backup status instead of generic placeholder blocks.",
  },
  {
    question: "Will this still feel usable on mobile?",
    answer:
      "Yes. The layout keeps the richer visuals while staying responsive, and the navigation now includes a mobile menu so visitors can move through the page more easily on smaller screens.",
  },
  {
    question: "Can the final call-to-action be connected to a real installer later?",
    answer:
      "Yes. The CTA is structured so a real download link, contact action, or demo flow can be wired in later without redesigning the section again.",
  },
];

export const FAQSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="section-kicker">FAQ</div>
          <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            Answer the practical questions before the visitor has to ask them.
          </h2>
          <p className="mt-4 text-base leading-8 text-text-secondary">
            A grounded FAQ makes the page feel more complete and reduces hesitation for people
            evaluating whether the product is real, relevant, and ready to use.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mx-auto mt-12 max-w-4xl"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.question}
                value={faq.question}
                className="glass-card rounded-[1.5rem] border px-6"
              >
                <AccordionTrigger className="text-left font-display text-lg font-semibold text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-base leading-8 text-text-secondary">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
