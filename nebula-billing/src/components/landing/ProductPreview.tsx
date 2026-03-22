import { AnimatePresence, motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const tabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "A manager view that surfaces what needs attention first.",
    description:
      "Open the app and immediately see billing volume, collections, stock risks, and recent actions without digging into multiple screens.",
    stats: [
      { label: "Net sales today", value: "Rs. 2,18,400" },
      { label: "Collections", value: "Rs. 1,42,000" },
      { label: "Low stock", value: "7 items" },
    ],
    rows: [
      { name: "Top route collection", status: "South Zone", amount: "Rs. 42,000", note: "Recovered" },
      { name: "Most active customer", status: "Mahalakshmi Stores", amount: "12 invoices", note: "Weekly" },
      { name: "Pending approvals", status: "Purchase inward", amount: "3 entries", note: "Review" },
      { name: "Latest backup", status: "Cloud synced", amount: "08:42 PM", note: "Safe" },
    ],
    sideTitle: "Why it feels useful",
    sidePoints: [
      "Teams can start the day from one screen instead of opening separate reports.",
      "Recent activity helps managers trace what changed without asking around.",
      "Collections and stock risks stay visible while invoices are being posted.",
    ],
    chart: [48, 52, 61, 58, 68, 83, 77],
  },
  {
    id: "billing",
    label: "Billing Desk",
    title: "Fast invoice creation with the business context already attached.",
    description:
      "Customer, batch, GST, pricing, and outstanding context travel with the invoice so billing stays quick without becoming error-prone.",
    stats: [
      { label: "Open invoices", value: "14 drafts" },
      { label: "Average invoice time", value: "Under 2 min" },
      { label: "Credit customers", value: "28 active" },
    ],
    rows: [
      { name: "INV-2026-0451", status: "Sharma Store", amount: "Rs. 12,450", note: "Printed" },
      { name: "INV-2026-0450", status: "Gupta Traders", amount: "Rs. 8,200", note: "Pending" },
      { name: "INV-2026-0449", status: "RS Wholesale", amount: "Rs. 34,800", note: "Paid" },
      { name: "INV-2026-0448", status: "Verma and Sons", amount: "Rs. 5,600", note: "Delivered" },
    ],
    sideTitle: "Billing details included",
    sidePoints: [
      "Sales and purchase documents follow the same clear operational structure.",
      "Invoice history makes reprints, checks, and follow-ups easier for the team.",
      "GST logic stays close to the transaction instead of being fixed later in reports.",
    ],
    chart: [38, 42, 50, 61, 72, 78, 90],
  },
  {
    id: "gst",
    label: "GST Reports",
    title: "Compliance screens that are tied to live transaction data.",
    description:
      "The reporting layer is built for monthly review, GST filing prep, summary checks, and export workflows that need auditability.",
    stats: [
      { label: "GSTR status", value: "March ready" },
      { label: "HSN groups", value: "21 buckets" },
      { label: "Export history", value: "Tracked" },
    ],
    rows: [
      { name: "GSTR-1 March 2026", status: "Prepared", amount: "Rs. 5,24,000", note: "Ready" },
      { name: "GSTR-2 March 2026", status: "Draft", amount: "Rs. 3,87,000", note: "Review" },
      { name: "HSN Summary", status: "Grouped", amount: "12 categories", note: "Clean" },
      { name: "Sales Register", status: "Exported", amount: "124 invoices", note: "Saved" },
    ],
    sideTitle: "Reporting outcomes",
    sidePoints: [
      "Summary, register, B2B, B2C, and HSN views can be reviewed from one reporting area.",
      "Exports can be preserved with history so teams know what was generated and when.",
      "GST filing prep becomes less stressful when source data is already structured well.",
    ],
    chart: [44, 59, 54, 69, 73, 84, 88],
  },
  {
    id: "backup",
    label: "Backup Center",
    title: "Business continuity is treated like a product feature, not an afterthought.",
    description:
      "Restore points, backup history, and Google Drive sync give teams a practical safety net when devices fail or records need to be recovered.",
    stats: [
      { label: "Last backup", value: "08:42 PM" },
      { label: "Restore points", value: "14 kept" },
      { label: "Sync target", value: "Drive ready" },
    ],
    rows: [
      { name: "Daily close backup", status: "Completed", amount: "482 MB", note: "Today" },
      { name: "Weekly archive", status: "Completed", amount: "2.1 GB", note: "Sunday" },
      { name: "Restore test", status: "Verified", amount: "2 min", note: "Pass" },
      { name: "Cloud mirror", status: "Connected", amount: "Google Drive", note: "Active" },
    ],
    sideTitle: "Why teams care",
    sidePoints: [
      "Backup history gives confidence before system changes or data cleanups.",
      "Restore workflows matter for real businesses with daily billing pressure.",
      "Cloud sync adds resilience without hiding the local desktop-first model.",
    ],
    chart: [56, 62, 68, 72, 78, 85, 92],
  },
];

export const ProductPreview = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const activeData = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <section id="preview" className="relative py-24">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="section-kicker">Realistic screens</div>
          <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            A closer look at how the product feels in actual day-to-day use.
          </h2>
          <p className="mt-4 text-base leading-8 text-text-secondary">
            Instead of generic mock cards, this preview is organized around the screens a billing
            operator, owner, or accountant would actually open throughout the day.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="surface-panel mx-auto mt-12 max-w-6xl overflow-hidden p-4 sm:p-6"
        >
          <div className="flex flex-wrap gap-2 border-b border-border/70 pb-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card/70 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeData.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.25 }}
              className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]"
            >
              <div className="grid gap-6 rounded-[1.75rem] border border-border/70 bg-background/35 p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">{activeData.label}</p>
                  <h3 className="mt-3 font-display text-2xl font-bold text-foreground">
                    {activeData.title}
                  </h3>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-text-secondary">
                    {activeData.description}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {activeData.stats.map((stat) => (
                    <div key={stat.label} className="glass-card rounded-2xl p-4">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="mt-3 font-display text-xl font-bold text-foreground">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/75">
                  <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b border-border/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <span>Name</span>
                    <span>Status</span>
                    <span>Amount</span>
                    <span>Note</span>
                  </div>
                  <div className="divide-y divide-border/60">
                    {activeData.rows.map((row, index) => (
                      <motion.div
                        key={row.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 px-4 py-4 text-sm"
                      >
                        <span className="font-medium text-foreground">{row.name}</span>
                        <span className="text-muted-foreground">{row.status}</span>
                        <span className="font-medium text-foreground">{row.amount}</span>
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {row.note}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-card rounded-[1.75rem] p-6">
                  <p className="font-display text-xl font-bold text-foreground">
                    {activeData.sideTitle}
                  </p>
                  <div className="mt-5 space-y-4">
                    {activeData.sidePoints.map((point) => (
                      <div key={point} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                        <span className="mt-2 h-2 w-2 rounded-full bg-secondary" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-[1.75rem] p-6">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-xl font-bold text-foreground">Weekly pulse</p>
                    <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary">
                      Live style animation
                    </span>
                  </div>
                  <div className="mt-6 flex h-44 items-end gap-2">
                    {activeData.chart.map((height, index) => (
                      <motion.div
                        key={`${activeData.id}-${height}`}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.45, delay: 0.1 + index * 0.05 }}
                        className="flex-1 rounded-t-2xl bg-gradient-to-t from-primary via-primary/80 to-secondary"
                      />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    Motion here is used to make the product feel active and alive without turning the
                    screen into decoration.
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
