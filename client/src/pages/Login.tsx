import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Player } from "@lottiefiles/react-lottie-player";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
// import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

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
      toast.success("Login Successful");
      navigate("/");
    } else {
      toast.error("Login Failed");
      console.error(result.error);
    }

    setLoading(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const cardVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.2,
      },
    },
  };

  const lottieVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 60,
        damping: 20,
        delay: 0.3,
      },
    },
  };

  const inputFocusVariants = {
    focus: {
      scale: 1.02,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen flex bg-background overflow-hidden"
    >
      {/* Left Side - Lottie Animation */}
      <motion.div
        variants={lottieVariants}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-background to-secondary/20"
      >
        <div className="w-full h-full flex items-center justify-center p-12">
          <div className="max-w-lg">
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Welcome to <span className="text-primary">BillGram</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Streamline your billing process with our intuitive dashboard.
                Manage invoices, track payments, and grow your business.
              </p>
            </motion.div>
            <div className="relative h-[400px]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.5,
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100,
                }}
              >
                <Player
                  autoplay
                  loop
                  src={loginLottie}
                  className="absolute inset-0"
                  speed={1}
                />
              </motion.div>
            </div>
            <motion.div variants={itemVariants} className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Trusted by 500+ businesses worldwide
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-gradient-to-tr from-secondary/20 via-background to-primary/10"
      >
        <motion.div
          variants={cardVariants}
          className="w-full max-w-md"
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="border-border/40 p-4 shadow-xl backdrop-blur-sm bg-card/50">
            <CardHeader className="space-y-1 pb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.3,
                }}
                className="flex items-center justify-center mb-2"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardTitle className="text-2xl text-center font-bold">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-center">
                  Enter your credentials to access your dashboard
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants} className="space-y-3">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <motion.div
                      className="relative mt-1"
                      whileFocus="focus"
                      variants={inputFocusVariants}
                    >
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
                    </motion.div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <motion.div
                      className="relative mt-1"
                      whileFocus="focus"
                      variants={inputFocusVariants}
                    >
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
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center">
                    <motion.input
                      type="checkbox"
                      id="remember"
                      className="rounded border-border text-primary focus:ring-primary"
                      whileTap={{ scale: 0.9 }}
                    />
                    <label
                      htmlFor="remember"
                      className="ml-2 text-muted-foreground"
                    >
                      Remember me
                    </label>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link
                      to="/forgot-password"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </motion.div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <motion.button
                    type="submit"
                    className="w-full h-11 rounded-sm  bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 relative overflow-hidden"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                        />
                        Signing in...
                      </>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        Sign In
                      </motion.span>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-border/40 pt-6">
              <motion.p
                variants={itemVariants}
                className="text-sm text-muted-foreground"
              >
                Don't have an account?{" "}
                <motion.span whileHover={{ scale: 1.05 }}>
                  <Link
                    to="/register"
                    className="text-primary font-semibold hover:text-primary/80 transition-colors"
                  >
                    Create account
                  </Link>
                </motion.span>
              </motion.p>
            </CardFooter>
          </Card>
        </motion.div>

        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
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
        </motion.div> */}
      </motion.div>
    </motion.div>
  );
}
