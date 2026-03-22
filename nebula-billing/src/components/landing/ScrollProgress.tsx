import { motion, useScroll } from "framer-motion";

export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-0.5 origin-left bg-primary"
      style={{ scaleX: scrollYProgress }}
    />
  );
};
