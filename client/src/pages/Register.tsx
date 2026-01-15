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
import { Mail, Lock, User, Store, Phone, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
// Import Lottie JSON files
import registerLottie from "@/assets/Register_lottie.json";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    shop_name: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      console.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      shop_name: formData.shop_name,
      phone: formData.phone,
    };

    const result = await register(userData);

    if (result.success) {
      toast.success("Registered Successfully!")
      navigate("/login");
    } else {
      toast.error("Registeration Failed!");
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
        staggerChildren: 0.05,
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
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        delay: 0.2,
      },
    },
  };

  const lottieVariants = {
    // hidden: { x: -50, opacity: 0 },
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
                Join <span className="text-primary">BillGram</span> Today
              </h1>
              <p className="text-lg text-muted-foreground">
                Start managing your business efficiently. Create an account to
                access powerful billing tools and analytics.
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
                  src={registerLottie}
                  className="absolute inset-0"
                  speed={1}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Register Form */}
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
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.3,
                }}
              >
                <CardTitle className="text-2xl text-center font-bold">
                  Create Account
                </CardTitle>
                <CardDescription className="text-center">
                  Register your shop and start managing with ease
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <motion.div variants={itemVariants}>
                      <div>
                        <Label
                          htmlFor="shop_name"
                          className="text-sm font-medium"
                        >
                          Shop Name
                        </Label>
                        <motion.div
                          className="relative mt-1"
                          whileFocus="focus"
                          variants={inputFocusVariants}
                        >
                          <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="shop_name"
                            placeholder="Enter shop name"
                            value={formData.shop_name}
                            onChange={handleChange}
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                            required
                          />
                        </motion.div>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <div>
                        <Label
                          htmlFor="username"
                          className="text-sm font-medium"
                        >
                          Username
                        </Label>
                        <motion.div
                          className="relative mt-1"
                          whileFocus="focus"
                          variants={inputFocusVariants}
                        >
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="username"
                            placeholder="Choose username"
                            value={formData.username}
                            onChange={handleChange}
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                            required
                          />
                        </motion.div>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone Number
                        </Label>
                        <motion.div
                          className="relative mt-1"
                          whileFocus="focus"
                          variants={inputFocusVariants}
                        >
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+91 9876543210"
                            value={formData.phone}
                            onChange={handleChange}
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-3">
                    <motion.div variants={itemVariants}>
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
                            value={formData.email}
                            onChange={handleChange}
                            className="pl-10 bg-background/50 border-border/50 focus:border-primary"
                            required
                          />
                        </motion.div>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <div>
                        <Label
                          htmlFor="password"
                          className="text-sm font-medium"
                        >
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
                            value={formData.password}
                            onChange={handleChange}
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

                    <motion.div variants={itemVariants}>
                      <div>
                        <Label
                          htmlFor="confirmPassword"
                          className="text-sm font-medium"
                        >
                          Confirm Password
                        </Label>
                        <motion.div
                          className="relative mt-1"
                          whileFocus="focus"
                          variants={inputFocusVariants}
                        >
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary"
                            required
                          />
                          <motion.button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.1 }}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            ) : (
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            )}
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <motion.div
                  variants={itemVariants}
                  className="flex items-center text-sm"
                >
                  <motion.input
                    type="checkbox"
                    id="terms"
                    className="rounded border-border text-primary focus:ring-primary"
                    required
                    whileTap={{ scale: 0.9 }}
                  />
                  <label htmlFor="terms" className="ml-2 text-muted-foreground">
                    I agree to the{" "}
                    <a href="#" className="text-primary hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <motion.button
                    type="submit"
                    className="w-full h-11 rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 relative overflow-hidden"
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
                        Creating account...
                      </>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        Create Account
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
                Already have an account?{" "}
                <motion.span whileHover={{ scale: 1.05 }}>
                  <Link
                    to="/login"
                    className="text-primary font-semibold hover:text-primary/80 transition-colors"
                  >
                    Sign in
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
            By registering, you confirm that you've read and accepted our{" "}
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
