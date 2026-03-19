import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Gupta",
    role: "Gupta Traders, Delhi",
    text: "BillFlow replaced our Excel sheets and 3 notebooks. We save 4 hours every day now. GST filing is so easy!",
  },
  {
    name: "Priya Sharma",
    role: "Sharma Wholesale, Jaipur",
    text: "The inventory tracking is a game changer. No more stockouts or over-ordering. Our profits improved by 20%.",
  },
  {
    name: "Mohammed Irfan",
    role: "Star Distributors, Hyderabad",
    text: "Best billing software for Indian wholesalers. The support team understands our business perfectly.",
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
          className="text-center mb-16"
        >
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-foreground">
            Loved by <span className="gradient-text">Businesses</span> Across India
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="glass-card rounded-2xl p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-secondary text-secondary" />
                ))}
              </div>
              <p className="text-foreground text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div>
                <p className="font-display font-bold text-foreground text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
