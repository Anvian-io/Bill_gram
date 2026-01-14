import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Player } from "@lottiefiles/react-lottie-player";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

// Import Lottie JSON files
import loginLottie from "@/assets/Login_lottie.json";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate("/");
    } else {
      // Handle error (you can add toast here)
      console.error(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Lottie Animation */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="w-full h-full flex items-center justify-center p-12">
          <div className="max-w-lg">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Welcome to <span className="text-primary">BillGram</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Streamline your billing process with our intuitive dashboard.
                Manage invoices, track payments, and grow your business.
              </p>
            </div>
            <div className="relative h-[400px]">
              <Player
                autoplay
                loop
                src={loginLottie}
                className="absolute inset-0"
                speed={1}
              />
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Trusted by 500+ businesses worldwide
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-gradient-to-tr from-secondary/20 via-background to-primary/10
"
      >
        <div className="w-full max-w-md">
          <Card className="border-border/40 shadow-xl backdrop-blur-sm bg-card/50">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center font-bold">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor="remember"
                      className="ml-2 text-muted-foreground"
                    >
                      Remember me
                    </label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div> */}

              {/* <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-10 border-border/50 hover:bg-secondary"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="h-10 border-border/50 hover:bg-secondary"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div> */}
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border/40 pt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary font-semibold hover:text-primary/80 transition-colors"
                >
                  Create account
                </Link>
              </p>
            </CardFooter>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
