import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ActivitySquare,
  Clock3,
  Database,
  Route,
  ShieldCheck,
} from "lucide-react";

const stats = [
  { label: "Master records handled", value: 9, suffix: "+" },
  { label: "Core workflows in one app", value: 7, suffix: "" },
  { label: "Report views supported", value: 10, suffix: "+" },
  { label: "Desktop workspace to manage", value: 1, suffix: "" },
];

const benefits = [
  {
    icon: Clock3,
    title: "Faster Daily Operations",
    description: "Teams move from inward entry to billing to reporting without retyping the same data repeatedly.",
  },
  {
    icon: ShieldCheck,
    title: "Safer GST And Audit Readiness",
    description: "Structured product, tax, and invoice data makes monthly review cleaner and less stressful.",
  },
  {
    icon: Database,
    title: "One Source Of Truth",
    description: "Replace disconnected notebooks, spreadsheets, and scattered desktop files with a shared workflow.",
  },
  {
    icon: Route,
    title: "Distribution-Friendly Design",
    description: "Salesmen, areas, vans, and party ledgers fit naturally into the same operating system.",
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1500;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Number(current.toFixed(1)));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  const display = Number.isInteger(value) ? Math.round(count) : count.toFixed(1);

  return (
    <span ref={ref} className="font-display text-3xl font-extrabold md:text-4xl gradient-text">
      {display}
      {suffix}
    </span>
  );
}

export const WhyChooseUs = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="proof" className="relative py-24">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="section-kicker">Why this works</div>
          <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            Built for real trading desks, not just generic invoice templates.
          </h2>
          <p className="mt-4 text-base leading-8 text-text-secondary">
            The strongest part of the product is how connected the workflow feels. Inventory,
            billing, masters, reports, and backups all reinforce each other instead of behaving
            like isolated modules.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-card rounded-[1.75rem] p-6 text-center"
            >
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <p className="mt-3 text-sm leading-6 text-text-secondary">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="glass-card group flex gap-4 rounded-[1.75rem] p-6 transition-colors hover:border-primary/50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <b.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{b.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.45 }}
          className="surface-panel mt-10 p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="section-kicker">Operational fit</p>
              <h3 className="mt-6 font-display text-2xl font-bold text-foreground">
                Helpful for owners, billing operators, accountants, and field-oriented sales teams.
              </h3>
              <p className="mt-4 text-base leading-8 text-text-secondary">
                Whether the business is dispatch-heavy, route-driven, or compliance-sensitive, the
                product keeps the core workflow understandable for the people who use it every day.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Wholesale counters",
                "Distribution offices",
                "FMCG stockists",
                "Hardware traders",
                "Agro input sellers",
                "Medical and general suppliers",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/70 bg-background/35 px-4 py-4 text-sm font-medium text-foreground"
                >
                  <div className="flex items-center gap-3">
                    <ActivitySquare className="h-4 w-4 text-secondary" />
                    <span>{item}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
