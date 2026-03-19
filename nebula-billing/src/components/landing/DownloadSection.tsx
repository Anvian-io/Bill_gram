import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  CheckCircle2,
  Download,
  HardDrive,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";

export const DownloadSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="download" className="relative py-24">
      <div className="grid-bg absolute inset-0 opacity-20" />
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-[160px]" />

      <div className="container relative z-10 mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="surface-panel overflow-hidden"
        >
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-8 sm:p-10">
              <div className="section-kicker">Ready to onboard</div>
              <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground md:text-5xl">
                Give the product page a closing section that feels trustworthy and practical.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-text-secondary">
                The website now explains what the app does, how it fits real operations, and why a
                desktop-first business tool can still feel modern. This final CTA keeps the message
                focused on action.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  className="shimmer-btn glow-primary inline-flex items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Download className="h-5 w-5" />
                  Download For Windows
                </button>
                <a
                  href="#faq"
                  className="inline-flex items-center justify-center rounded-2xl border border-border bg-card/70 px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-muted/60"
                >
                  Review FAQ First
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  "Windows 10 and 11 ready",
                  "Desktop-first workflow",
                  "Backup-aware setup",
                ].map((item) => (
                  <span key={item} className="info-chip">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-border/70 bg-background/35 p-8 sm:p-10 lg:border-l lg:border-t-0">
              <div className="grid gap-4">
                {[
                  {
                    icon: MonitorSmartphone,
                    title: "Install",
                    body: "Set up the desktop app on the billing machine your team already uses every day.",
                  },
                  {
                    icon: HardDrive,
                    title: "Import and organize",
                    body: "Bring masters, products, and opening stock into a cleaner operating structure.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Run with confidence",
                    body: "Invoice, report, and back up from the same system instead of juggling separate files.",
                  },
                ].map((step) => (
                  <div key={step.title} className="glass-card rounded-[1.5rem] p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-display text-lg font-bold text-foreground">{step.title}</p>
                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
