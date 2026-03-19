import { motion } from "framer-motion";
import { ArrowDown, Download, Sparkles } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated background */}
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-8"
        >
          <Sparkles className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-muted-foreground">Trusted by 10,000+ Indian businesses</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display font-extrabold text-4xl sm:text-5xl md:text-7xl leading-tight max-w-4xl mx-auto"
        >
          All-in-One{" "}
          <span className="gradient-text">Billing & Business</span>{" "}
          Management Software
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto font-body"
        >
          Manage inventory, generate GST-compliant invoices, track analytics, and run your
          wholesale business — all from one powerful desktop app.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#download"
            className="shimmer-btn bg-primary text-primary-foreground px-8 py-4 rounded-xl text-base font-bold glow-primary flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Download className="w-5 h-5" />
            Download Now
          </a>
          <a
            href="#features"
            className="glass-card px-8 py-4 rounded-xl text-base font-semibold text-foreground hover:bg-muted/50 transition-colors flex items-center gap-2"
          >
            View Features
            <ArrowDown className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Floating dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="glass-card p-2 rounded-2xl glow-primary">
            <div className="bg-card rounded-xl overflow-hidden">
              {/* Mock dashboard */}
              <div className="flex">
                {/* Sidebar */}
                <div className="w-48 border-r border-border p-4 hidden md:block">
                  <div className="space-y-3">
                    {["Dashboard", "Invoices", "Inventory", "Reports", "Settings"].map((item, i) => (
                      <div
                        key={item}
                        className={`text-xs font-medium px-3 py-2 rounded-lg ${i === 0 ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Main content */}
                <div className="flex-1 p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Today Sales", value: "₹1,24,500" },
                      { label: "Invoices", value: "47" },
                      { label: "Items Low", value: "12" },
                      { label: "Revenue", value: "₹18.5L" },
                    ].map((stat) => (
                      <div key={stat.label} className="glass-card p-3 rounded-lg">
                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                        <p className="text-sm font-bold font-display text-foreground mt-1">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Chart placeholder */}
                  <div className="glass-card rounded-lg p-4 h-32 flex items-end gap-1">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.4, delay: 0.8 + i * 0.05 }}
                        className="flex-1 bg-gradient-to-t from-primary to-secondary rounded-t-sm"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
