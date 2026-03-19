import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Package, FileText, BarChart3, PieChart, CloudUpload } from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Inventory Management",
    description: "Track stock, batch numbers, MRP, GST rates and manage multiple warehouses in real-time.",
    size: "md:col-span-2 md:row-span-2",
  },
  {
    icon: FileText,
    title: "Billing System",
    description: "Create GST-compliant sales & purchase invoices with thermal/A4 print support.",
    size: "md:col-span-2 md:row-span-2",
  },
  {
    icon: BarChart3,
    title: "GST Reports",
    description: "Auto-generate GSTR-1, GSTR-2, HSN summaries ready for filing.",
    size: "md:col-span-1",
  },
  {
    icon: PieChart,
    title: "Analytics Dashboard",
    description: "Track top products, customers, revenue trends at a glance.",
    size: "md:col-span-1",
  },
  {
    icon: CloudUpload,
    title: "Backup & Restore",
    description: "Automatic Google Drive backups. Never lose your business data.",
    size: "md:col-span-2",
  },
];

export const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-foreground">
            Everything Your Business <span className="gradient-text">Needs</span>
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">
            From billing to inventory to GST compliance — one app replaces them all.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`glass-card p-6 rounded-2xl group hover:border-primary/50 transition-colors cursor-default ${feature.size}`}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
