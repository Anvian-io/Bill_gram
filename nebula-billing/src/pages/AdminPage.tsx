import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, KeyRound, LogOut, RefreshCw, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { generateAdminToken, getAllUsers, registerUser, type RegisteredUser } from "@/lib/api";
import { clearStoredAdminAuth, getStoredAdminAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  const loadUsers = useCallback(async () => {
    if (!auth) return;

    setUsersLoading(true);
    try {
      const response = await getAllUsers(auth);
      setUsers(response.users);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load users";
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
      const expiresInDays = Number(tokenExpiryDays);
      const response = await generateAdminToken(auth, Number.isFinite(expiresInDays) ? expiresInDays : undefined);
      setLatestToken(response.token.token);
      setLatestTokenExpiry(response.token.expiresAt);
      setForm((current) => ({ ...current, token: response.token.token }));
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate token");
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
      setForm({
        email: "",
        name: "",
        phoneNumber: "",
        token: "",
      });
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to register user");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredAdminAuth();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="surface-panel p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="section-kicker">Admin workspace</p>
              <h1 className="mt-5 font-display text-4xl font-extrabold text-foreground">
                Generate tokens, register users, and manage the user list.
              </h1>
              <p className="mt-4 text-base leading-8 text-text-secondary">
                Logged in as <span className="font-semibold text-foreground">{auth?.email}</span>.
                Tokens are created on the backend and saved in MongoDB before they are used for registration.
              </p>
            </div>

            <Button variant="outline" className="h-11 gap-2 self-start" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="surface-panel border-glass-border bg-card/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <KeyRound className="h-5 w-5 text-primary" />
                Generate invite token
              </CardTitle>
              <CardDescription>
                Tokens are issued from the backend and can be consumed only once during registration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="token-expiry">Token expiry in days</Label>
                <Input
                  id="token-expiry"
                  type="number"
                  min="1"
                  value={tokenExpiryDays}
                  onChange={(event) => setTokenExpiryDays(event.target.value)}
                />
              </div>

              <Button className="w-full gap-2" onClick={handleGenerateToken} disabled={tokenLoading}>
                <KeyRound className="h-4 w-4" />
                {tokenLoading ? "Generating token..." : "Generate token"}
              </Button>

              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="text-sm text-muted-foreground">Latest generated token</p>
                <p className="mt-2 break-all font-mono text-lg font-bold text-foreground">
                  {latestToken || "Generate a token to see it here"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {latestTokenExpiry
                    ? `Expires on ${new Date(latestTokenExpiry).toLocaleString()}`
                    : "Token expiry will appear here after generation."}
                </p>
                {latestToken ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={async () => {
                      await navigator.clipboard.writeText(latestToken);
                      toast.success("Token copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy token
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel border-glass-border bg-card/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <UserPlus className="h-5 w-5 text-primary" />
                Register user
              </CardTitle>
              <CardDescription>
                This form checks the token in the backend before the user is stored. Used tokens are marked consumed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5 md:grid-cols-2" onSubmit={handleRegisterUser}>
                <div className="space-y-2">
                  <Label htmlFor="user-email">User email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-name">Name</Label>
                  <Input
                    id="user-name"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-phone">Phone number</Label>
                  <Input
                    id="user-phone"
                    value={form.phoneNumber}
                    onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-token">Token</Label>
                  <Input
                    id="user-token"
                    value={form.token}
                    onChange={(event) => setForm((current) => ({ ...current, token: event.target.value }))}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Button className="w-full gap-2" type="submit" disabled={registerLoading}>
                    <UserPlus className="h-4 w-4" />
                    {registerLoading ? "Registering user..." : "Register user"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="surface-panel border-glass-border bg-card/85">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-display">
                <Users className="h-5 w-5 text-primary" />
                Registered users
              </CardTitle>
              <CardDescription>Fetched from the backend with the get-all-users API.</CardDescription>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => void loadUsers()} disabled={usersLoading}>
              <RefreshCw className={`h-4 w-4 ${usersLoading ? "animate-spin" : ""}`} />
              Refresh list
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Registered By</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phoneNumber}</TableCell>
                      <TableCell>{user.registeredBy}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {usersLoading ? "Loading users..." : "No users registered yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AdminPage;
