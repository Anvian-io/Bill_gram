import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Boxes, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { requestOtp, verifyOtp } from "@/lib/api";
import { getStoredAdminAuth, setStoredAdminAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";

const OTP_LENGTH = 6;

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [requestedEmail, setRequestedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [developmentOtp, setDevelopmentOtp] = useState("");

  useEffect(() => {
    if (getStoredAdminAuth()) {
      navigate("/AdminPage", { replace: true });
    }
  }, [navigate]);

  const emailStepReady = useMemo(() => requestedEmail.length > 0, [requestedEmail]);

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestingOtp(true);

    try {
      const response = await requestOtp(email.trim());
      setRequestedEmail(email.trim().toLowerCase());
      setDevelopmentOtp(response.otp ?? "");
      setOtp("");
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to request OTP");
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
      toast.success(response.message);
      navigate("/AdminPage", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-6 py-10">
      <div className="mesh-bg absolute inset-0 opacity-90" />
      <div className="grid-bg absolute inset-0 opacity-[0.14]" />
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-secondary/15 blur-[140px]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_480px]">
          <section className="hidden flex-col justify-center lg:flex">
            <div className="section-kicker">Admin access</div>
            <h1 className="mt-6 max-w-2xl font-display text-5xl font-extrabold leading-tight text-foreground">
              Email-gated OTP login for the Nebula Billing admin desk.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
              Only emails listed in the backend env are allowed into the OTP flow. After a
              successful verification, the admin session can generate invite tokens and register users.
            </p>

            <div className="mt-10 grid max-w-xl gap-4">
              {[
                "Email is validated against USER_EMAIL before OTP generation.",
                "OTP verification creates an admin session backed by the backend.",
                "Admin page can generate invite tokens and register users with token checks.",
              ].map((point) => (
                <div key={point} className="glass-card flex items-start gap-3 rounded-2xl p-4">
                  <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
                  <p className="text-sm leading-7 text-muted-foreground">{point}</p>
                </div>
              ))}
            </div>
          </section>

          <Card className="surface-panel border-glass-border bg-card/85 shadow-[0_24px_90px_-48px_rgba(15,23,42,0.95)]">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="font-display text-2xl">Nebula Billing Admin</CardTitle>
                  <CardDescription>Secure login with email approval and OTP verification.</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {!emailStepReady ? (
                <form className="space-y-5" onSubmit={handleEmailSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Admin email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@company.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-12 pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={requestingOtp}>
                    <KeyRound className="h-4 w-4" />
                    {requestingOtp ? "Checking email..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form className="space-y-6" onSubmit={handleOtpSubmit}>
                  <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="text-sm text-muted-foreground">OTP sent to</p>
                    <p className="mt-1 font-semibold text-foreground">{requestedEmail}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setRequestedEmail("");
                        setDevelopmentOtp("");
                        setOtp("");
                      }}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Change email
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <InputOTP id="otp" value={otp} onChange={setOtp} maxLength={OTP_LENGTH}>
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

                  {developmentOtp ? (
                    <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                        Development OTP
                      </p>
                      <p className="mt-2 font-mono text-2xl font-bold text-foreground">{developmentOtp}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        This is shown only when the backend is configured to expose OTPs for development.
                      </p>
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="h-12 w-full text-base font-semibold"
                    disabled={verifyingOtp || otp.length !== OTP_LENGTH}
                  >
                    {verifyingOtp ? "Verifying OTP..." : "Verify OTP and continue"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
