import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  PackageCheck,
  Truck,
} from "lucide-react";

const steps = [
  {
    icon: Building2,
    title: "Create clean masters",
    body: "Start with suppliers, customers, products, units, companies, areas, vans, and salesmen so every later workflow stays consistent.",
  },
  {
    icon: PackageCheck,
    title: "Bring stock inward",
    body: "Record purchase invoices and inventory details with batch, rate, MRP, GST, and HSN information attached to the item.",
  },
  {
    icon: Truck,
    title: "Bill and dispatch",
    body: "Create sales invoices, track status, align with field sales movement, and keep party-wise data visible during the day.",
  },
  {
    icon: ClipboardCheck,
    title: "Review, report, and back up",
    body: "Close the loop with dashboards, GST reports, exports, notifications, and restore-friendly backup history.",
  },
];

export const WorkflowSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="workflow" className="relative py-24">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="section-kicker">Workflow story</div>
          <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            Show the product as a complete operating cycle, not a pile of isolated screens.
          </h2>
          <p className="mt-4 text-base leading-8 text-text-secondary">
            This section helps visitors understand how the app supports daily trade operations from
            data setup through billing, reporting, and recovery.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="glass-card relative rounded-[1.75rem] p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{step.body}</p>
              {index < steps.length - 1 ? (
                <ArrowRight className="absolute -right-3 top-10 hidden h-6 w-6 text-primary lg:block" />
              ) : null}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="surface-panel mt-10 p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="section-kicker">Why this matters</p>
              <h3 className="mt-6 font-display text-2xl font-bold text-foreground">
                Product pages become more convincing when they explain operational continuity.
              </h3>
              <p className="mt-4 text-base leading-8 text-text-secondary">
                Visitors should quickly understand that the software is useful before sale, during
                billing, during review, and after the day closes. That is the difference between a
                tool that looks nice and a tool that feels dependable.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Inventory is not separate from billing.",
                "Masters are not separate from reporting.",
                "Backups are not separate from operations.",
                "UI clarity reduces training and billing mistakes.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/70 bg-background/40 px-4 py-4 text-sm leading-7 text-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
