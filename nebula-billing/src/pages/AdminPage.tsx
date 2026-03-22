import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  KeyRound,
  LogOut,
  RefreshCw,
  UserPlus,
  Users,
  CheckCheck,
  Boxes,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  generateAdminToken,
  getAllUsers,
  registerUser,
  type RegisteredUser,
} from "@/lib/api";
import { clearStoredAdminAuth, getStoredAdminAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Section heading component ────────────────────────────────────────────────
const SectionHeading = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center gap-3">
    <div
      className="flex h-10 w-10 items-center justify-center rounded-xl"
      style={{
        background: "rgba(99,102,241,0.18)",
        color: "#818cf8",
        border: "1px solid rgba(99,102,241,0.3)",
      }}
    >
      {icon}
    </div>
    <div>
      <h3 className="font-display text-lg font-bold text-foreground">
        {title}
      </h3>
      {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
    </div>
  </div>
);

// ─── Styled card shell ────────────────────────────────────────────────────────
const Panel = ({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) => (
  <div
    className={`rounded-3xl p-7 ${className}`}
    style={{
      background: "rgba(10,8,28,0.78)",
      border: `1px solid ${glow ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
      backdropFilter: "blur(18px)",
      boxShadow: glow
        ? "0 0 40px rgba(99,102,241,0.1), 0 24px 60px -16px rgba(0,0,0,0.7)"
        : "0 24px 60px -16px rgba(0,0,0,0.7)",
    }}
  >
    {children}
  </div>
);

// ─── Token display ────────────────────────────────────────────────────────────
const TokenDisplay = ({
  token,
  expiry,
  onCopy,
}: {
  token: string;
  expiry: string;
  onCopy: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!token) {
    return (
      <div
        className="flex h-28 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px dashed rgba(255,255,255,0.1)",
        }}
      >
        <p className="text-sm text-slate-500">
          Generated token will appear here
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl p-4"
      style={{
        background:
          "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.08))",
        border: "1px solid rgba(99,102,241,0.35)",
      }}
    >
      {/* Glow sweep */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)",
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10">
        <div className="mb-2 flex items-center justify-between">
          <span
            className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
          >
            <Zap className="h-2.5 w-2.5" />
            Active Token
          </span>
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.92 }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              background: copied
                ? "rgba(16,185,129,0.15)"
                : "rgba(99,102,241,0.15)",
              color: copied ? "#34d399" : "#818cf8",
              border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(99,102,241,0.3)"}`,
            }}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" /> Copied!
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <p className="break-all font-mono text-sm font-semibold leading-6 text-foreground">
          {token}
        </p>

        {expiry && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="h-3 w-3" />
            Expires {new Date(expiry).toLocaleString()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Styled form field ────────────────────────────────────────────────────────
const Field = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) => (
  <div className="space-y-2">
    <Label
      htmlFor={id}
      className="text-xs font-semibold uppercase tracking-wider text-slate-400"
    >
      {label}
    </Label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="h-11 rounded-xl border-white/10 bg-white/5 text-sm text-foreground placeholder:text-slate-600 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
    />
  </div>
);

// ─── User table row ───────────────────────────────────────────────────────────
const UserRow = ({ user, index }: { user: RegisteredUser; index: number }) => (
  <motion.tr
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
    className="group border-b border-white/5 transition-colors hover:bg-white/[0.03]"
  >
    <td className="py-3.5 pl-4 pr-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{
            background: `hsl(${(user.name.charCodeAt(0) * 37) % 360}, 60%, 35%)`,
          }}
        >
          {user.name.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-foreground">{user.name}</span>
      </div>
    </td>
    <td className="px-3 py-3.5 text-sm text-slate-400">{user.email}</td>
    <td className="px-3 py-3.5 font-mono text-sm text-slate-400">
      {user.phoneNumber}
    </td>
    <td className="px-3 py-3.5">
      <span
        className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc" }}
      >
        {user.registeredBy}
      </span>
    </td>
    <td className="px-3 py-3.5 pr-4 text-xs text-slate-500">
      {new Date(user.createdAt).toLocaleString()}
    </td>
  </motion.tr>
);

// ─── Admin Page ───────────────────────────────────────────────────────────────
const AdminPage = () => {
  const navigate = useNavigate();
  const auth = useMemo(() => getStoredAdminAuth(), []);

  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [tokenExpiryDays, setTokenExpiryDays] = useState("30");
  const [latestToken, setLatestToken] = useState("");
  const [latestTokenExpiry, setLatestTokenExpiry] = useState("");
  const [form, setForm] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    token: "",
  });

  const setFormField = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const loadUsers = useCallback(async () => {
    if (!auth) return;
    setUsersLoading(true);
    try {
      const response = await getAllUsers(auth);
      setUsers(response.users);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load users";
      toast.error(message);
      if (message.toLowerCase().includes("session")) {
        clearStoredAdminAuth();
        navigate("/login", { replace: true });
      }
    } finally {
      setUsersLoading(false);
    }
  }, [auth, navigate]);

  useEffect(() => {
    if (!auth) {
      navigate("/login", { replace: true });
      return;
    }
    void loadUsers();
  }, [auth, loadUsers, navigate]);

  const handleGenerateToken = async () => {
    if (!auth) return;
    setTokenLoading(true);
    try {
      const days = Number(tokenExpiryDays);
      const response = await generateAdminToken(
        auth,
        Number.isFinite(days) ? days : undefined,
      );
      setLatestToken(response.token.token);
      setLatestTokenExpiry(response.token.expiresAt);
      setFormField("token")(response.token.token);
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to generate token",
      );
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRegisterUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) return;
    setRegisterLoading(true);
    try {
      const response = await registerUser(auth, {
        email: form.email.trim(),
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        token: form.token.trim(),
      });
      toast.success(response.message);
      setForm({ email: "", name: "", phoneNumber: "", token: "" });
      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to register user",
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredAdminAuth();
    navigate("/login", { replace: true });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Background */}
      <div className="mesh-bg absolute inset-0 opacity-90" />
      <div className="grid-bg absolute inset-0 opacity-[0.08]" />
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-secondary/10 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-7 px-6 py-10">
        {/* ── TOP HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Panel glow>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                {/* Logo mark */}
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  }}
                >
                  <Boxes className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">
                      Admin Workspace
                    </span>
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                      style={{
                        background: "rgba(16,185,129,0.12)",
                        color: "#34d399",
                        border: "1px solid rgba(52,211,153,0.2)",
                      }}
                    >
                      <motion.span
                        className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      Live
                    </span>
                  </div>
                  <h1 className="mt-1 font-display text-2xl font-extrabold text-foreground">
                    Nebula Billing Control Center
                  </h1>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    Signed in as{" "}
                    <span className="font-semibold text-foreground">
                      {auth?.email}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 lg:self-start">
                {/* Quick stats */}
                <div className="hidden items-center gap-3 sm:flex">
                  {[
                    {
                      label: "Users",
                      value: usersLoading ? "—" : users.length,
                      icon: <Users className="h-3.5 w-3.5" />,
                    },
                    {
                      label: "Session",
                      value: "Active",
                      icon: <ShieldCheck className="h-3.5 w-3.5" />,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center gap-2 rounded-xl px-3 py-2"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <span className="text-primary/60">{stat.icon}</span>
                      <div>
                        <p className="text-[10px] text-slate-500">
                          {stat.label}
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-xl border-white/10 text-sm hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </Panel>
        </motion.div>

        {/* ── MAIN GRID ── */}
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          {/* ── Token Generator ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <Panel>
              <div className="mb-6">
                <SectionHeading
                  icon={<KeyRound className="h-5 w-5" />}
                  title="Generate Invite Token"
                  subtitle="Tokens are one-time use and backed by MongoDB"
                />
              </div>

              <div className="space-y-4">
                <Field
                  id="token-expiry"
                  label="Expiry (days)"
                  type="number"
                  value={tokenExpiryDays}
                  onChange={setTokenExpiryDays}
                  placeholder="30"
                />

                <Button
                  className="h-11 w-full gap-2 rounded-xl text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                  }}
                  onClick={handleGenerateToken}
                  disabled={tokenLoading}
                >
                  {tokenLoading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Generate Token
                    </>
                  )}
                </Button>

                <TokenDisplay
                  token={latestToken}
                  expiry={latestTokenExpiry}
                  onCopy={async () => {
                    await navigator.clipboard.writeText(latestToken);
                    toast.success("Token copied to clipboard");
                  }}
                />
              </div>
            </Panel>
          </motion.div>

          {/* ── Register User ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <Panel>
              <div className="mb-6">
                <SectionHeading
                  icon={<UserPlus className="h-5 w-5" />}
                  title="Register User"
                  subtitle="Token is consumed on successful registration"
                />
              </div>

              <form className="space-y-4" onSubmit={handleRegisterUser}>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    id="user-name"
                    label="Full Name"
                    value={form.name}
                    onChange={setFormField("name")}
                    placeholder="Rajesh Kumar"
                    required
                  />
                  <Field
                    id="user-phone"
                    label="Phone Number"
                    value={form.phoneNumber}
                    onChange={setFormField("phoneNumber")}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                <Field
                  id="user-email"
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={setFormField("email")}
                  placeholder="user@company.com"
                  required
                />
                <Field
                  id="user-token"
                  label="Invite Token"
                  value={form.token}
                  onChange={setFormField("token")}
                  placeholder="Paste generated token here"
                  required
                />

                <Button
                  type="submit"
                  disabled={registerLoading}
                  className="mt-2 h-11 w-full gap-2 rounded-xl text-sm font-bold"
                  style={{
                    background: registerLoading
                      ? undefined
                      : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    boxShadow: registerLoading
                      ? undefined
                      : "0 4px 20px rgba(99,102,241,0.3)",
                  }}
                >
                  {registerLoading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      />
                      Registering…
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Register User
                    </>
                  )}
                </Button>
              </form>
            </Panel>
          </motion.div>
        </div>

        {/* ── Users Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <Panel>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeading
                icon={<Users className="h-5 w-5" />}
                title="Registered Users"
                subtitle={
                  usersLoading
                    ? "Loading…"
                    : `${users.length} user${users.length !== 1 ? "s" : ""} on record`
                }
              />
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl border-white/10 text-xs hover:bg-primary/10 hover:border-primary/30"
                onClick={() => void loadUsers()}
                disabled={usersLoading}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${usersLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            <div
              className="overflow-hidden rounded-2xl"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <table className="w-full text-left">
                <thead>
                  <tr
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {["Name", "Email", "Phone", "Registered By", "Created"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 first:pl-4 last:pr-4"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {users.length > 0 ? (
                      users.map((user, i) => (
                        <UserRow key={user.id} user={user} index={i} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          {usersLoading ? (
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                              <motion.span
                                animate={{ rotate: 360 }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                className="inline-block h-4 w-4 rounded-full border-2 border-slate-700 border-t-slate-400"
                              />
                              Loading users…
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Users className="h-8 w-8 text-slate-700" />
                              <p className="text-sm text-slate-500">
                                No users registered yet.
                              </p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </Panel>
        </motion.div>
      </div>
    </main>
  );
};

export default AdminPage;
