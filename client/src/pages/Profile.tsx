// src/pages/Profile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User as UserIcon,
  Mail,
  Store,
  Phone,
  Building2,
  MapPin,
  CreditCard,
  Bell,
  Volume2,
  ImageIcon,
  X,
  Save,
  Signature, // added for signature icon
  Palette,
  Type,
  LayoutDashboard,
} from "lucide-react";
import { imageService } from "@/services/imageService";
import { userService } from "@/services/userService";
import type { User } from "@/types/user";
import { getFullImageUrl } from "@/utils/imageUtils";
import SoftwareUpdateSettings from "@/components/SoftwareUpdateSettings";
import { useTheme } from "@/contexts/ThemeProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Validation schema (no change, signature is handled separately)
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  shop_name: z.string().nullable().optional(),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number")
    .nullable()
    .optional(),
  notification: z.boolean().default(true),
  sound: z.boolean().default(true),
  upi_id: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  // company_logo and signature are handled separately
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null); // new
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null); // new
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    primaryColor,
    setPrimaryColor,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    layoutMode,
    setLayoutMode,
    tableSize,
    setTableSize,
  } = useTheme();

  // Get user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Set logo preview
        if (parsedUser.company_logo) {
          setLogoPreview(getFullImageUrl(parsedUser.company_logo));
        }
        // Set signature preview
        if (parsedUser.signature) {
          setSignaturePreview(getFullImageUrl(parsedUser.signature));
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        toast.error("Failed to load user data");
      }
    } else {
      toast.error("Please log in");
      // navigate("/login");
    }
  }, [navigate]);

  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      shop_name: user?.shop_name || "",
      phone: user?.phone || "",
      notification: user?.notification ?? true,
      sound: user?.sound ?? true,
      upi_id: user?.upi_id || "",
      company_name: user?.company_name || "",
      address: user?.address || "",
    },
  });

  // Update form when user loads
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        email: user.email,
        shop_name: user.shop_name || "",
        phone: user.phone || "",
        notification: user.notification ?? true,
        sound: user.sound ?? true,
        upi_id: user.upi_id || "",
        company_name: user.company_name || "",
        address: user.address || "",
      });
      setLogoPreview(
        user.company_logo ? getFullImageUrl(user.company_logo) : null,
      );
      setSignaturePreview(
        user.signature ? getFullImageUrl(user.signature) : null, // new
      );
    }
  }, [user, form]);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  // Handle signature upload (new)
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureFile(file);
      const previewUrl = URL.createObjectURL(file);
      setSignaturePreview(previewUrl);
    }
  };

  const removeSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // 1. Upload logo if changed
      let logoFilename: string | null = null;
      if (logoFile) {
        logoFilename = await imageService.uploadImage(logoFile);
      } else if (logoPreview === null) {
        logoFilename = null; // Logo was removed
      } else {
        logoFilename = user.company_logo; // Keep existing
      }

      // 2. Upload signature if changed (new)
      let signatureFilename: string | null = null;
      if (signatureFile) {
        signatureFilename = await imageService.uploadImage(signatureFile);
      } else if (signaturePreview === null) {
        signatureFilename = null; // Signature was removed
      } else {
        signatureFilename = user.signature; // Keep existing
      }

      // 3. Prepare update data (only changed fields)
      const updateData: Record<string, any> = {};
      const fields = [
        "username",
        "email",
        "shop_name",
        "phone",
        "notification",
        "sound",
        "upi_id",
        "company_name",
        "address",
      ] as const;

      fields.forEach((field) => {
        const newValue = values[field];
        const oldValue = user[field as keyof User];
        if (newValue !== oldValue) {
          updateData[field] = newValue === "" ? null : newValue;
        }
      });

      // Add logo if changed
      if (logoFilename !== user.company_logo) {
        updateData.company_logo = logoFilename;
      }

      // Add signature if changed (new)
      if (signatureFilename !== user.signature) {
        updateData.signature = signatureFilename;
      }

      // Add user ID
      updateData.userId = user.id; // or user._id

      // 4. Send update request (only if there are changes)
      if (Object.keys(updateData).length > 1 || updateData.userId) {
        const updatedUser = await userService.updateProfile(updateData);

        // Update localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        toast.success("Profile updated successfully");
      } else {
        toast.info("No changes detected");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6"
    >
      <div className="max-w-9xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Profile Settings
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your personal information and preferences
              </p>
            </div>
          </div>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border p-4 border-gray-200 dark:border-gray-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your account details and public information
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  {/* Avatar / Logo Section */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800"
                  >
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-lg">
                        {logoPreview ? (
                          <AvatarImage src={logoPreview} alt="Profile" />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                            {user.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={removeLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Company Logo</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById("logo-upload")?.click()
                          }
                          className="gap-2"
                        >
                          <ImageIcon className="h-4 w-4" />
                          {logoPreview ? "Change Logo" : "Upload Logo"}
                        </Button>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Recommended: Square image, at least 200x200px
                      </p>
                    </div>
                  </motion.div>

                  {/* NEW: Signature Upload Section */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800"
                  >
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-lg">
                        {signaturePreview ? (
                          <AvatarImage src={signaturePreview} alt="Signature" />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                            <Signature className="h-8 w-8" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {signaturePreview && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={removeSignature}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Signature</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById("signature-upload")?.click()
                          }
                          className="gap-2"
                        >
                          <Signature className="h-4 w-4" />
                          {signaturePreview
                            ? "Change Signature"
                            : "Upload Signature"}
                        </Button>
                        <input
                          id="signature-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload your signature image (PNG with transparent
                        background recommended)
                      </p>
                    </div>
                  </motion.div>

                  {/* Form Fields Grid (unchanged) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1 */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Username *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Enter username"
                                  className="pl-9"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Email *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="email"
                                  placeholder="Enter email"
                                  className="pl-9"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shop_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Shop Name
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Enter shop name"
                                  className="pl-9"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Phone Number
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Enter phone number"
                                  className="pl-9"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Company Name
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Enter company name"
                                  className="pl-9"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="upi_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              UPI ID
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Enter UPI ID"
                                  className="pl-9"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Address
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Enter address"
                                  className="pl-9"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Preferences (unchanged) */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Preferences
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="notification"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-medium">
                                Enable Notifications
                              </FormLabel>
                              <div className="text-xs text-muted-foreground">
                                Receive updates and alerts
                              </div>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-primary"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sound"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-medium">
                                <Volume2 className="h-4 w-4 inline mr-2" />
                                Play Sounds
                              </FormLabel>
                              <div className="text-xs text-muted-foreground">
                                Sound effects for actions
                              </div>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-primary"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance Settings Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6"
        >
          <Card className="border p-4 border-gray-200 dark:border-gray-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Appearance Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {/* Primary Color */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Primary Color
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { name: 'Blue', value: '#3b82f6' },
                    { name: 'Green', value: '#10b981' },
                    { name: 'Purple', value: '#8b5cf6' },
                    { name: 'Rose', value: '#f43f5e' },
                    { name: 'Amber', value: '#f59e0b' },
                  ].map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setPrimaryColor(color.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${primaryColor === color.value ? 'border-foreground scale-110 shadow-md' : 'border-transparent'}`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                      type="button"
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm text-muted-foreground">Custom:</span>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Typography */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Font Family
                  </h3>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system-ui, Avenir, Helvetica, Arial, sans-serif">System Default</SelectItem>
                      <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                      <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                      <SelectItem value="'Outfit', sans-serif">Outfit</SelectItem>
                      <SelectItem value="monospace">Monospace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Font Size
                  </h3>
                  <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12px">Small</SelectItem>
                      <SelectItem value="14px">Medium</SelectItem>
                      <SelectItem value="16px">Default</SelectItem>
                      <SelectItem value="18px">Large</SelectItem>
                      <SelectItem value="20px">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Layout Mode */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Layout Mode
                </h3>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={layoutMode === "classic" ? "default" : "outline"}
                    onClick={() => setLayoutMode("classic")}
                    className="flex-1 justify-center"
                  >
                    Old Layout (Classic)
                  </Button>
                  <Button
                    type="button"
                    variant={layoutMode === "modern" ? "default" : "outline"}
                    onClick={() => setLayoutMode("modern")}
                    className="flex-1 justify-center"
                  >
                    New Layout (Modern)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Choose between the dense, grid-based Old Layout or the spaced-out, card-based New Layout.
                </p>
              </div>

              <Separator className="my-4" />

              {/* Table Density */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Table Density (Sizing)
                </h3>
                <Select value={tableSize} onValueChange={(v: any) => setTableSize(v)}>
                  <SelectTrigger className="w-full sm:w-1/2">
                    <SelectValue placeholder="Select table density" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact (Dense)</SelectItem>
                    <SelectItem value="standard">Standard (Default)</SelectItem>
                    <SelectItem value="large">Comfortable (Spaced)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Adjust the height and padding of table rows to fit more or less data on your screen.
                </p>
              </div>

            </CardContent>
          </Card>
        </motion.div>

        {/* Check for Updates — last section */}
        <SoftwareUpdateSettings />
      </div>
    </motion.div>
  );
};

export default Profile;
