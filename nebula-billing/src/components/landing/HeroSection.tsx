import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  Download,
  Sparkles,
  TrendingUp,
  Package,
  FileText,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Floating Invoice Card ────────────────────────────────────────────────────
const invoices = [
  {
    id: "INV-4821",
    customer: "Sharma Traders",
    amount: "₹48,200",
    gst: "GST 18%",
    color: "#6366f1",
  },
  {
    id: "INV-4822",
    customer: "Patel Wholesale",
    amount: "₹1,23,500",
    gst: "GST 12%",
    color: "#8b5cf6",
  },
  {
    id: "INV-4823",
    customer: "Mehta & Sons",
    amount: "₹67,800",
    gst: "GST 5%",
    color: "#a78bfa",
  },
  {
    id: "INV-4824",
    customer: "Gupta Dist.",
    amount: "₹2,08,900",
    gst: "GST 28%",
    color: "#7c3aed",
  },
];

// ─── Ticker items ─────────────────────────────────────────────────────────────
const tickerItems = [
  "₹18,500 sale — Sharma Traders",
  "Stock LOW: Sunflower Oil 5L",
  "GST Return filed ✓ Q3",
  "New PO from Mehta & Sons",
  "₹2,08,900 — Largest order today",
  "12 items below reorder level",
  "GSTR-1 due in 3 days",
  "Van Route A — 9 deliveries",
];

// ─── Orbit ring data ──────────────────────────────────────────────────────────
interface OrbitNode {
  label: string;
  icon: React.ReactNode;
  color: string;
  angle: number;
  radius: number;
  speed: number;
}

// ─── Particle ─────────────────────────────────────────────────────────────────
const Particle = ({
  cx,
  cy,
  tx,
  ty,
  color,
}: {
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  color: string;
}) => (
  <motion.circle
    r={2.5}
    fill={color}
    initial={{ cx, cy, opacity: 0, scale: 0 }}
    animate={{ cx: tx, cy: ty, opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
    transition={{
      duration: 2.2,
      repeat: Infinity,
      repeatDelay: Math.random() * 2,
      ease: "easeInOut",
    }}
  />
);

// ─── Animated GST Ticker ──────────────────────────────────────────────────────
const GSTTicker = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setIndex((p) => (p + 1) % tickerItems.length),
      2200,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div className="overflow-hidden h-5 flex items-center">
      <motion.div
        key={index}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -16, opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="text-[11px] font-mono text-emerald-400 whitespace-nowrap"
      >
        {tickerItems[index]}
      </motion.div>
    </div>
  );
};

// ─── Live stat counter ────────────────────────────────────────────────────────
const LiveCounter = ({
  value,
  prefix = "",
}: {
  value: number;
  prefix?: string;
}) => {
  const [display, setDisplay] = useState(value * 0.6);
  useEffect(() => {
    let frame: number;
    const start = value * 0.6;
    setDisplay(start);
    const duration = 1800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (value - start) * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <span>
      {prefix}
      {Math.floor(display).toLocaleString("en-IN")}
    </span>
  );
};

// ─── Inventory Bar ────────────────────────────────────────────────────────────
const stockItems = [
  { name: "Sunflower Oil 5L", stock: 12, max: 100, warn: true },
  { name: "Basmati Rice 25kg", stock: 67, max: 100, warn: false },
  { name: "Sugar 50kg", stock: 8, max: 100, warn: true },
  { name: "Wheat Flour 10kg", stock: 45, max: 100, warn: false },
  { name: "Toor Dal 30kg", stock: 3, max: 100, warn: true },
];

const InventoryBars = () => (
  <div className="space-y-2">
    {stockItems.map((item, i) => (
      <div key={item.name} className="flex items-center gap-2">
        <span className="text-[9px] text-slate-400 w-28 truncate">
          {item.name}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${item.warn ? "bg-red-500" : "bg-emerald-500"}`}
            initial={{ width: 0 }}
            animate={{ width: `${item.stock}%` }}
            transition={{ duration: 1, delay: 0.6 + i * 0.1, ease: "easeOut" }}
          />
        </div>
        {item.warn && (
          <motion.span
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-[8px] text-red-400 font-bold"
          >
            LOW
          </motion.span>
        )}
      </div>
    ))}
  </div>
);

// ─── Central Rupee Orb ────────────────────────────────────────────────────────
const RupeeOrb = () => (
  <div className="relative w-20 h-20 flex items-center justify-center">
    {/* Outer ring pulses */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute inset-0 rounded-full border border-violet-500/30"
        animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.6, 0] }}
        transition={{
          duration: 2,
          delay: i * 0.6,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
    ))}
    {/* Core */}
    <motion.div
      className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white"
      style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      ₹
    </motion.div>
  </div>
);

// ─── Orbital Ring ─────────────────────────────────────────────────────────────
const ORBIT_NODES = [
  {
    label: "Invoices",
    icon: <FileText size={12} />,
    color: "#6366f1",
    angleDeg: 0,
    radius: 100,
    duration: 12,
  },
  {
    label: "Inventory",
    icon: <Package size={12} />,
    color: "#10b981",
    angleDeg: 90,
    radius: 100,
    duration: 12,
  },
  {
    label: "Reports",
    icon: <TrendingUp size={12} />,
    color: "#f59e0b",
    angleDeg: 180,
    radius: 100,
    duration: 12,
  },
  {
    label: "GST",
    icon: <Zap size={12} />,
    color: "#ef4444",
    angleDeg: 270,
    radius: 100,
    duration: 12,
  },
];

const OrbitNode = ({
  label,
  icon,
  color,
  angleDeg,
  radius,
  duration,
}: (typeof ORBIT_NODES)[0]) => {
  const angle = useMotionValue((angleDeg * Math.PI) / 180);
  const x = useTransform(angle, (a) => Math.cos(a) * radius);
  const y = useTransform(angle, (a) => Math.sin(a) * radius);

  useAnimationFrame((_, delta) => {
    angle.set(angle.get() + (delta / 1000) * ((2 * Math.PI) / duration));
  });

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ x, y }}
    >
      <motion.div
        className="w-9 h-9 rounded-full flex flex-col items-center justify-center gap-0.5 border"
        style={{ background: `${color}22`, borderColor: `${color}66`, color }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
        <span className="text-[7px] font-semibold">{label}</span>
      </motion.div>
    </motion.div>
  );
};

// ─── Flying Invoice Card ───────────────────────────────────────────────────────
const FlyingInvoice = ({
  inv,
  delay,
  startX,
  startY,
}: {
  inv: (typeof invoices)[0];
  delay: number;
  startX: number;
  startY: number;
}) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: startX, top: startY, zIndex: 20 }}
    initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
    animate={{
      opacity: [0, 1, 1, 0],
      scale: [0.5, 1, 1, 0.7],
      rotate: [-15, 0, 3, 10],
      x: [0, -10, 5, -20],
      y: [0, -30, -60, -120],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 4 + 2,
      ease: "easeInOut",
    }}
  >
    <div
      className="w-44 rounded-xl p-3 shadow-2xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(30,25,60,0.95), rgba(20,15,45,0.98))",
        border: `1px solid ${inv.color}44`,
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono text-slate-400">{inv.id}</span>
        <span
          className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold"
          style={{ background: `${inv.color}33`, color: inv.color }}
        >
          {inv.gst}
        </span>
      </div>
      <p className="text-[10px] text-slate-300 truncate mb-1">{inv.customer}</p>
      <p className="text-sm font-bold" style={{ color: inv.color }}>
        {inv.amount}
      </p>
      <div className="mt-1.5 h-0.5 rounded-full overflow-hidden bg-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: inv.color }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 3.5, delay: delay + 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  </motion.div>
);

// ─── Data Stream Lines (SVG) ──────────────────────────────────────────────────
const DataStreams = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    style={{ zIndex: 1 }}
  >
    <defs>
      <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* Animated dashes */}
    {[
      { d: "M 20 80 Q 120 40 220 90", delay: 0 },
      { d: "M 10 150 Q 140 100 260 160", delay: 0.4 },
      { d: "M 30 220 Q 150 170 270 230", delay: 0.8 },
    ].map((line, i) => (
      <motion.path
        key={i}
        d={line.d}
        stroke="url(#lineGrad1)"
        strokeWidth={1}
        fill="none"
        strokeDasharray="4 6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.7, 0.7, 0] }}
        transition={{
          duration: 3,
          delay: line.delay,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    ))}
    {/* Particles along paths */}
    <Particle cx={20} cy={80} tx={220} ty={90} color="#8b5cf6" />
    <Particle cx={10} cy={150} tx={260} ty={160} color="#6366f1" />
    <Particle cx={30} cy={220} tx={270} ty={230} color="#a78bfa" />
  </svg>
);

// ─── Main Crazy Right-Side Animation ─────────────────────────────────────────
const BillingUniverse = () => {
  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      style={{ minHeight: 520 }}
    >
      {/* Ambient glows */}
      <div
        className="absolute top-10 right-10 w-56 h-56 rounded-full blur-[80px]"
        style={{ background: "rgba(99,102,241,0.18)" }}
      />
      <div
        className="absolute bottom-16 left-8 w-40 h-40 rounded-full blur-[60px]"
        style={{ background: "rgba(139,92,246,0.14)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px]"
        style={{ background: "rgba(167,139,250,0.07)" }}
      />

      {/* Flying invoices */}
      {invoices.map((inv, i) => (
        <FlyingInvoice
          key={inv.id}
          inv={inv}
          delay={i * 1.8}
          startX={60 + i * 55}
          startY={300 + (i % 2 === 0 ? 0 : 30)}
        />
      ))}

      {/* Central orbit system */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Top alert strip */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono"
          style={{
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.3)",
          }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-emerald-400">LIVE</span>
          <GSTTicker />
        </motion.div>

        {/* Orbit ring + central orb */}
        <div className="relative w-52 h-52 flex items-center justify-center">
          {/* Orbit rings (visual dashes) */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 208 208">
            <circle
              cx={104}
              cy={104}
              r={100}
              fill="none"
              stroke="rgba(99,102,241,0.15)"
              strokeWidth={1}
              strokeDasharray="3 5"
            />
            <motion.circle
              cx={104}
              cy={104}
              r={100}
              fill="none"
              stroke="rgba(139,92,246,0.35)"
              strokeWidth={1.5}
              strokeDasharray="20 200"
              animate={{ rotate: 360 }}
              style={{ originX: "104px", originY: "104px" }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </svg>
          {/* Orbit nodes */}
          {ORBIT_NODES.map((node) => (
            <OrbitNode key={node.label} {...node} />
          ))}
          {/* Central rupee */}
          <RupeeOrb />
        </div>

        {/* Two main cards side by side */}
        <div className="flex gap-3 w-full max-w-xs">
          {/* Stats card */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1 rounded-2xl p-3 relative overflow-hidden"
            style={{
              background: "rgba(15,12,40,0.85)",
              border: "1px solid rgba(99,102,241,0.25)",
              backdropFilter: "blur(14px)",
            }}
          >
            <DataStreams />
            <p className="text-[9px] text-slate-400 mb-2 font-semibold uppercase tracking-wider">
              Today
            </p>
            <p className="text-lg font-black text-white">
              <LiveCounter value={124500} prefix="₹" />
            </p>
            <p className="text-[8px] text-emerald-400 mt-0.5">
              ▲ 23% vs yesterday
            </p>
            <div className="mt-2 flex gap-0.5 items-end h-10">
              {[30, 55, 40, 75, 50, 90, 65, 85, 70, 95].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{
                    background:
                      i === 9
                        ? "linear-gradient(to top, #6366f1, #a78bfa)"
                        : "rgba(99,102,241,0.3)",
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{
                    duration: 0.5,
                    delay: 0.8 + i * 0.06,
                    ease: "backOut",
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Inventory card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex-1 rounded-2xl p-3"
            style={{
              background: "rgba(15,12,40,0.85)",
              border: "1px solid rgba(139,92,246,0.25)",
              backdropFilter: "blur(14px)",
            }}
          >
            <p className="text-[9px] text-slate-400 mb-2 font-semibold uppercase tracking-wider">
              Stock
            </p>
            <InventoryBars />
          </motion.div>
        </div>

        {/* Bottom GST summary strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex gap-3 w-full max-w-xs"
        >
          {[
            { label: "CGST", value: "₹9,810", color: "#6366f1" },
            { label: "SGST", value: "₹9,810", color: "#8b5cf6" },
            { label: "IGST", value: "₹4,200", color: "#a78bfa" },
          ].map((tax) => (
            <div
              key={tax.label}
              className="flex-1 rounded-xl px-3 py-2 text-center"
              style={{
                background: `${tax.color}14`,
                border: `1px solid ${tax.color}33`,
              }}
            >
              <p className="text-[8px] text-slate-400">{tax.label}</p>
              <p
                className="text-xs font-bold mt-0.5"
                style={{ color: tax.color }}
              >
                {tax.value}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

// ─── FULL HERO SECTION ────────────────────────────────────────────────────────
export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/15 rounded-full blur-[100px] animate-pulse-glow"
        style={{ animationDelay: "1s" }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-0">
          {/* ── LEFT: Text content ── */}
          <div className="flex-1 lg:max-w-xl text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-8"
            >
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-muted-foreground">
                Trusted by 10,000+ Indian businesses
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl leading-tight"
            >
              All-in-One{" "}
              <span className="gradient-text">Billing & Business</span>{" "}
              Management Software
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-text-secondary max-w-xl font-body"
            >
              Manage inventory, generate GST-compliant invoices, track
              analytics, and run your wholesale business — all from one powerful
              desktop app.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
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
          </div>

          {/* ── RIGHT: Crazy Animation ── */}
          <div className="flex-1 flex items-center justify-center lg:justify-end">
            <BillingUniverse />
          </div>
        </div>
      </div>
    </section>
  );
};
