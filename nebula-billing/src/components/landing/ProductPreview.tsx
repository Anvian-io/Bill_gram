import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const tabs = [
  {
    id: "inventory",
    label: "Inventory",
    rows: [
      { name: "Amul Butter 500g", stock: "340", mrp: "₹280", gst: "5%" },
      { name: "Tata Salt 1kg", stock: "1,200", mrp: "₹28", gst: "0%" },
      { name: "Fortune Oil 5L", stock: "87", mrp: "₹720", gst: "5%" },
      { name: "Parle-G 800g", stock: "560", mrp: "₹95", gst: "18%" },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    rows: [
      { name: "INV-2024-0451", stock: "Sharma Store", mrp: "₹12,450", gst: "Paid" },
      { name: "INV-2024-0450", stock: "Gupta Traders", mrp: "₹8,200", gst: "Pending" },
      { name: "INV-2024-0449", stock: "RS Wholesale", mrp: "₹34,800", gst: "Paid" },
      { name: "INV-2024-0448", stock: "Verma & Sons", mrp: "₹5,600", gst: "Paid" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    rows: [
      { name: "GSTR-1 Jan 2024", stock: "Filed", mrp: "₹2,34,000", gst: "✓" },
      { name: "GSTR-2 Jan 2024", stock: "Draft", mrp: "₹1,87,000", gst: "—" },
      { name: "HSN Summary", stock: "Ready", mrp: "₹4,21,000", gst: "✓" },
      { name: "GSTR-1 Dec 2023", stock: "Filed", mrp: "₹3,12,000", gst: "✓" },
    ],
  },
];

export const ProductPreview = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState("inventory");
  const activeData = tabs.find((t) => t.id === activeTab)!;

  return (
    <section id="preview" className="py-24 relative">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-foreground">
            See It In <span className="gradient-text">Action</span>
          </h2>
          <p className="mt-4 text-text-secondary">A quick look at the desktop app interface.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto glass-card rounded-2xl p-6 glow-primary"
        >
          <div className="flex gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">GST</th>
                </tr>
              </thead>
              <tbody>
                {activeData.rows.map((row, i) => (
                  <motion.tr
                    key={row.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">{row.name}</td>
                    <td className="py-3 px-4 text-text-secondary">{row.stock}</td>
                    <td className="py-3 px-4 text-foreground font-semibold">{row.mrp}</td>
                    <td className="py-3 px-4 text-text-secondary">{row.gst}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
