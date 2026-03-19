import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Clock, ShieldCheck, Database, TrendingUp } from "lucide-react";

const stats = [
  { label: "Businesses", value: 10000, suffix: "+" },
  { label: "Invoices Generated", value: 5000000, suffix: "+" },
  { label: "Hours Saved Daily", value: 3, suffix: "hrs" },
  { label: "Uptime", value: 99.9, suffix: "%" },
];

const benefits = [
  { icon: Clock, title: "Save 3+ Hours Daily", description: "Automate billing, reports, and inventory tracking." },
  { icon: ShieldCheck, title: "Reduce Errors to Zero", description: "Auto GST calculation eliminates manual mistakes." },
  { icon: Database, title: "Centralized System", description: "Replace Excel sheets, notebooks, and tally headaches." },
  { icon: TrendingUp, title: "Grow Revenue", description: "Analytics help you identify top products and customers." },
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
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  const display = value >= 1000000
    ? `${(count / 1000000).toFixed(count >= value ? 0 : 1)}M`
    : value >= 1000
    ? `${(count / 1000).toFixed(count >= value ? 0 : 1)}K`
    : count % 1 !== 0
    ? count.toFixed(1)
    : count;

  return (
    <span ref={ref} className="font-display font-extrabold text-3xl md:text-4xl gradient-text">
      {display}{suffix}
    </span>
  );
}

export const WhyChooseUs = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="why-us" className="py-24 relative">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-foreground">
            Why <span className="gradient-text">10,000+</span> Businesses Trust Us
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">
            Replace your Excel sheets, notebooks and outdated software with one modern solution.
          </p>
        </motion.div>

        {/* Animated counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <p className="mt-2 text-sm text-text-secondary">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="glass-card rounded-2xl p-6 flex gap-4 group hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <b.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-text-secondary">{b.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
