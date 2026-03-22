import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  BadgeIndianRupee,
  BarChart3,
  Boxes,
  ClipboardList,
  CloudUpload,
  FileSpreadsheet,
  Package,
  Route,
  Users2,
} from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Batch-Level Inventory",
    description:
      "Track stock, MRP, purchase rate, GST, HSN/SAC, expiry-sensitive batches, and product visuals in one master.",
    points: ["Batch and MRP tracking", "Low-stock alerts", "Product groups and units"],
  },
  {
    icon: BadgeIndianRupee,
    title: "Sales And Purchase Billing",
    description:
      "Create GST-compliant sales and purchase invoices with line-item tax logic, invoice history, and print-ready output.",
    points: ["Sales and purchase flows", "Outstanding and ledger context", "Fast repeat invoicing"],
  },
  {
    icon: Users2,
    title: "Party And Supplier Masters",
    description:
      "Keep customers, suppliers, salesmen, areas, vans, and account records connected to your daily billing desk.",
    points: ["Customer and supplier data", "Salesman and route mapping", "Shared business context"],
  },
  {
    icon: BarChart3,
    title: "Operational Dashboard",
    description:
      "Monitor monthly trends, top products, top customers, recent activity, and stock snapshots without exporting data elsewhere.",
    points: ["Daily health view", "Revenue and movement trends", "Recent business activity"],
  },
  {
    icon: CloudUpload,
    title: "Backup And Restore",
    description:
      "Protect the entire business database with backup history, restore points, and Google Drive sync support.",
    points: ["Backup history", "Restore confidence", "Cloud-connected safety"],
  },
  {
    icon: FileSpreadsheet,
    title: "GST And Register Reports",
    description:
      "Generate GSTR-1, GSTR-2, HSN summary, B2B, B2C, sales register, purchase register, and monthly GST views.",
    points: ["GST-ready report sets", "Summary and register views", "Export history support"],
  },
  {
    icon: Route,
    title: "Field Sales Visibility",
    description:
      "Tie bills, areas, vans, and salesmen together so distribution-style teams know what moved, where, and with whom.",
    points: ["Area-wise organization", "Van and route alignment", "Salesman performance context"],
  },
  {
    icon: ClipboardList,
    title: "Master Data That Stays Clean",
    description:
      "Centralize units, companies, groups, pricing structures, and business references so every invoice starts with trusted data.",
    points: ["Reusable masters", "Consistent tax setup", "Cleaner downstream reporting"],
  },
];

export const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative py-24">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="section-kicker">Product modules</div>
          <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground md:text-5xl">
            One system for the workflows that usually live in five different tools.
          </h2>
          <p className="mt-4 text-base leading-8 text-text-secondary">
            The product is not just a billing screen. It is a full operations workspace for
            stock control, billing, party data, route sales, GST reporting, and backup safety.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-card group flex h-full flex-col rounded-[1.75rem] p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{feature.description}</p>
              <div className="mt-5 space-y-3">
                {feature.points.map((point) => (
                  <div key={point} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-1 h-2 w-2 rounded-full bg-secondary" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.25 }}
          className="surface-panel mt-10 overflow-hidden"
        >
          <div className="grid gap-8 p-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="section-kicker">Built for trading desks</p>
              <h3 className="mt-6 max-w-2xl font-display text-2xl font-bold text-foreground md:text-3xl">
                The app mirrors how Indian wholesale and distribution businesses actually work day to day.
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-8 text-text-secondary">
                Masters connect to invoices. Invoices connect to stock movement. Stock movement
                flows into dashboards, GST reports, and backups. That continuity is what makes
                the product feel practical instead of fragmented.
              </p>
            </div>

            <div className="grid gap-4 rounded-[1.75rem] border border-border/70 bg-background/40 p-6">
              {[
                "Suppliers, customers, areas, vans, salesmen, and accounts stay linked to operations.",
                "Inventory carries real business detail like MRP, GST rate, HSN/SAC, and images.",
                "Report exports and history make compliance work easier to trace and reuse.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                  <Boxes className="mt-1 h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
