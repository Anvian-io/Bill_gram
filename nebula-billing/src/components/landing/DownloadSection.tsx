import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Download, Monitor } from "lucide-react";

export const DownloadSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="download" className="py-24 relative">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/15 rounded-full blur-[150px]" />

      <div className="container mx-auto px-6 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-foreground">
            Start Managing Your Business{" "}
            <span className="gradient-text">Smartly</span>
          </h2>
          <p className="mt-4 text-text-secondary text-lg">
            Download BillFlow for Windows and transform how you run your wholesale business.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="shimmer-btn bg-primary text-primary-foreground px-10 py-5 rounded-xl text-lg font-bold glow-primary flex items-center gap-3 hover:opacity-90 transition-opacity">
              <Download className="w-6 h-6" />
              Download for Windows
            </button>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Monitor className="w-4 h-4" />
              <span>Windows 10/11 • 85 MB • Free</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
