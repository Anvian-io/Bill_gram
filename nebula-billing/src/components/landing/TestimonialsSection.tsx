import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Gupta",
    role: "Gupta Traders / Delhi",
    text: "The biggest win for us is that billing, stock, and party records finally speak to each other. We spend less time checking who updated what.",
    tag: "Wholesale billing flow",
  },
  {
    name: "Priya Sharma",
    role: "Sharma Wholesale / Jaipur",
    text: "Inventory and GST reporting used to feel like separate jobs. Now the monthly review is calmer because the data is already structured properly.",
    tag: "GST and stock visibility",
  },
  {
    name: "Mohammed Irfan",
    role: "Star Distributors / Hyderabad",
    text: "The route and salesman setup makes the software feel made for distribution work, not just for a basic retail counter.",
    tag: "Distribution desk fit",
  },
];

export const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="testimonials" className="py-24">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <div className="section-kicker">Customer voice</div>
          <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            The value is clearest when the workflow feels lighter for the team.
          </h2>
          <p className="mt-4 text-base leading-8 text-text-secondary">
            These quotes are framed around the kinds of improvements businesses usually care about:
            cleaner billing, better stock confidence, calmer reporting, and less operational chasing.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="glass-card rounded-[1.75rem] p-6 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary">
                  {t.tag}
                </span>
                <Quote className="h-5 w-5 text-primary" />
              </div>
              <div className="mb-4 mt-5 flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-secondary text-secondary" />
                ))}
              </div>
              <p className="mb-6 text-sm leading-7 text-foreground">&quot;{t.text}&quot;</p>
              <div>
                <p className="font-display text-sm font-bold text-foreground">{t.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
