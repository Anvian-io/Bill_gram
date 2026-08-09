import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Boxes,
  KeyRound,
  Mail,
  ShieldCheck,
  Lock,
  Fingerprint,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { requestOtp, verifyOtp } from '@/lib/api';
import { getStoredAdminAuth, setStoredAdminAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';

const OTP_LENGTH = 6;

// ─── Animated security badge ──────────────────────────────────────────────────
const SecurityBadge = ({
  icon,
  label,
  delay,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  delay: number;
  active?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    className="flex items-center gap-3 rounded-2xl px-4 py-3"
    style={{
      background: active
        ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))'
        : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
    }}
  >
    <div
      className="flex h-8 w-8 items-center justify-center rounded-xl"
      style={{
        background: active ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
        color: active ? '#818cf8' : '#64748b',
      }}
    >
      {icon}
    </div>
    <span
      className="text-sm font-medium"
      style={{ color: active ? '#c7d2fe' : '#64748b' }}
    >
      {label}
    </span>
    {active && (
      <motion.div
        className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
      </motion.div>
    )}
  </motion.div>
);

// ─── Pulsing lock orb ─────────────────────────────────────────────────────────
const LockOrb = ({ unlocked }: { unlocked: boolean }) => (
  <div className="relative flex h-24 w-24 items-center justify-center">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid rgba(99,102,241,${0.4 - i * 0.12})` }}
        animate={{ scale: [1, 1.15 + i * 0.15, 1], opacity: [0.8, 0, 0.8] }}
        transition={{
          duration: 2.5,
          delay: i * 0.7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    ))}
    <motion.div
      className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl"
      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
      animate={unlocked ? { rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        {unlocked ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
          >
            <CheckCircle2 className="h-7 w-7 text-white" />
          </motion.div>
        ) : (
          <motion.div
            key="lock"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Lock className="h-7 w-7 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  </div>
);

// ─── Floating data particles ──────────────────────────────────────────────────
const particles = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 4,
  duration: Math.random() * 4 + 4,
}));

// ─── Login Page ───────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [requestedEmail, setRequestedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [developmentOtp, setDevelopmentOtp] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (getStoredAdminAuth()) navigate('/AdminPage', { replace: true });
  }, [navigate]);

  const emailStepReady = useMemo(
    () => requestedEmail.length > 0,
    [requestedEmail],
  );

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestingOtp(true);
    try {
      const response = await requestOtp(email.trim());
      setRequestedEmail(email.trim().toLowerCase());
      setDevelopmentOtp(response.otp ?? '');
      setOtp('');
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to request OTP',
      );
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVerifyingOtp(true);
    try {
      const response = await verifyOtp(requestedEmail, otp);
      setStoredAdminAuth({
        email: response.email,
        sessionToken: response.sessionToken,
        expiresAt: response.expiresAt,
      });
      setUnlocked(true);
      toast.success(response.message);
      setTimeout(() => navigate('/AdminPage', { replace: true }), 800);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to verify OTP',
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Background layers */}
      <div className="mesh-bg absolute inset-0 opacity-90" />
      <div className="grid-bg absolute inset-0 opacity-[0.10]" />
      <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-primary/20 blur-[130px]" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary/15 blur-[150px]" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/10 blur-[90px]" />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{ y: [-10, 10, -10], opacity: [0.2, 0.7, 0.2] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_500px]">
          {/* ── LEFT PANEL ── */}
          <section className="hidden flex-col justify-center lg:flex">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10 flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Boxes className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold text-foreground">
                BillGram
              </span>
            </motion.div>

            {/* Lock orb */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-8"
            >
              <LockOrb unlocked={unlocked} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary/70"
            >
              Secure Admin Portal
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-display text-5xl font-extrabold leading-tight text-foreground"
            >
              Identity-first
              <br />
              <span className="gradient-text">admin access.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-4 max-w-md text-base leading-7 text-text-secondary"
            >
              Two-step email + OTP verification ensures only whitelisted admins
              can manage users, tokens, and billing data.
            </motion.p>

            <div className="mt-8 max-w-md space-y-3">
              <SecurityBadge
                icon={<Mail className="h-4 w-4" />}
                label="Email validated against allowlist"
                delay={0.45}
                active
              />
              <SecurityBadge
                icon={<KeyRound className="h-4 w-4" />}
                label="Time-limited OTP via backend"
                delay={0.55}
                active={emailStepReady}
              />
              <SecurityBadge
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Session token stored securely"
                delay={0.65}
                active={unlocked}
              />
              <SecurityBadge
                icon={<Fingerprint className="h-4 w-4" />}
                label="Single-device admin session"
                delay={0.75}
              />
            </div>
          </section>

          {/* ── RIGHT PANEL: CARD ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="flex items-center"
          >
            <div
              className="w-full rounded-3xl p-8"
              style={{
                background: 'rgba(10,8,28,0.82)',
                border: '1px solid rgba(99,102,241,0.2)',
                backdropFilter: 'blur(20px)',
                boxShadow:
                  '0 32px 80px -24px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.08) inset',
              }}
            >
              {/* Card header */}
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Boxes className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-foreground">
                    Admin Sign In
                  </h2>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    Email + OTP — two layers, zero shortcuts.
                  </p>
                </div>
              </div>

              {/* Step indicator */}
              <div className="mb-8 flex items-center gap-2">
                {['Email', 'OTP', 'Access'].map((step, i) => {
                  const done =
                    i === 0
                      ? emailStepReady || unlocked
                      : i === 1
                        ? unlocked
                        : unlocked;
                  const current =
                    i === 0
                      ? !emailStepReady && !unlocked
                      : i === 1
                        ? emailStepReady && !unlocked
                        : unlocked;
                  return (
                    <div key={step} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300"
                          style={{
                            background:
                              done || current
                                ? 'rgba(99,102,241,0.8)'
                                : 'rgba(255,255,255,0.06)',
                            color: done || current ? 'white' : '#475569',
                            border: current
                              ? '1px solid rgba(165,180,252,0.5)'
                              : '1px solid transparent',
                          }}
                        >
                          {done ? '✓' : i + 1}
                        </div>
                        <span
                          className="text-xs font-medium transition-colors duration-300"
                          style={{
                            color: current
                              ? '#c7d2fe'
                              : done
                                ? '#818cf8'
                                : '#475569',
                          }}
                        >
                          {step}
                        </span>
                      </div>
                      {i < 2 && (
                        <div
                          className="h-px w-8 transition-all duration-500"
                          style={{
                            background: done
                              ? 'rgba(99,102,241,0.6)'
                              : 'rgba(255,255,255,0.08)',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {!emailStepReady ? (
                  /* ── Step 1: Email ── */
                  <motion.form
                    key="email-form"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                    onSubmit={handleEmailSubmit}
                  >
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-semibold text-slate-300"
                      >
                        Admin email address
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="admin@yourcompany.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-13 rounded-xl border-white/10 bg-white/5 pl-11 text-sm text-foreground placeholder:text-slate-500 focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          style={{ height: '52px' }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Only pre-approved admin emails can proceed.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={requestingOtp}
                      className="h-13 w-full gap-2 rounded-xl text-base font-bold"
                      style={{
                        height: '52px',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
                      }}
                    >
                      <KeyRound className="h-4 w-4" />
                      {requestingOtp ? (
                        <span className="flex items-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                          />
                          Verifying email…
                        </span>
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </motion.form>
                ) : (
                  /* ── Step 2: OTP ── */
                  <motion.form
                    key="otp-form"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                    onSubmit={handleOtpSubmit}
                  >
                    {/* Email pill */}
                    <div
                      className="flex items-center justify-between rounded-2xl px-4 py-3"
                      style={{
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.25)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20">
                          <Mail className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">
                            OTP dispatched to
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {requestedEmail}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRequestedEmail('');
                          setDevelopmentOtp('');
                          setOtp('');
                        }}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary/80 transition-colors hover:bg-primary/10"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Change
                      </button>
                    </div>

                    {/* OTP input */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-300">
                        Enter 6-digit OTP
                      </Label>
                      <div className="flex justify-center">
                        <InputOTP
                          value={otp}
                          onChange={setOtp}
                          maxLength={OTP_LENGTH}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                          </InputOTPGroup>
                          <InputOTPSeparator />
                          <InputOTPGroup>
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>

                    {/* Dev OTP box */}
                    {developmentOtp && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl p-4"
                        style={{
                          background: 'rgba(16,185,129,0.07)',
                          border: '1px solid rgba(16,185,129,0.25)',
                        }}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">
                          Dev OTP
                        </p>
                        <p className="mt-2 font-mono text-3xl font-black tracking-[0.3em] text-foreground">
                          {developmentOtp}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-400">
                          Visible only in development mode — remove this in
                          production.
                        </p>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={verifyingOtp || otp.length !== OTP_LENGTH}
                      className="h-13 w-full gap-2 rounded-xl text-base font-bold"
                      style={{
                        height: '52px',
                        background:
                          otp.length === OTP_LENGTH
                            ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                            : undefined,
                        boxShadow:
                          otp.length === OTP_LENGTH
                            ? '0 4px 24px rgba(99,102,241,0.35)'
                            : undefined,
                      }}
                    >
                      {verifyingOtp ? (
                        <span className="flex items-center gap-2">
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                          />
                          Verifying…
                        </span>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Verify & Enter Admin Panel
                        </>
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
