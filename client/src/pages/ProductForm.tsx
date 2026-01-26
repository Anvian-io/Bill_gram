// src/pages/ProductForm.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  // Upload,
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Percent,
  Package,
  Shield,
} from "lucide-react";

// Define the schema for form validation
const productSchema = z.object({
  // Basic Info
  productCode: z.string().min(1, "Product code is required"),
  productBrand: z.string().min(1, "Product brand is required"),
  description: z.string().min(1, "Description is required"),
  hsnSacCode: z.string().min(1, "HSN/SAC code is required"),
  goodsOrServices: z.enum(["Goods", "Services"], {
    message: "Please select Goods or Services",
  }),
  weight: z.coerce.number().positive("Weight must be positive"),
  unit: z.string().min(1, "Unit is required"),
  productGroup: z.string().min(1, "Product group is required"),

  // Additional Info
  productShortName: z.string().min(1, "Short name is required"),
  purchaseUnit: z.string().min(1, "Purchase unit is required"),
  conversionFactor: z.coerce
    .number()
    .positive("Conversion factor must be positive"),
  pricePerPCS: z.coerce.number().positive("Price must be positive"),
  productCompany: z.string().min(1, "Product company is required"),
  saleUnit: z.string().min(1, "Sale unit is required"),
  cartonPack: z.coerce.number().positive("Carton pack must be positive"),
  innerPack: z.string().optional(),

  // Packaging
  packagingBasic: z.boolean().default(false),
  packagingMRP: z.boolean().default(false),

  // Insurance Tax
  insuranceTaxBasic: z.boolean().default(false),
  insuranceTaxMRP: z.boolean().default(false),

  // GST Details
  gstRate: z.coerce.number().min(0).max(100, "GST rate cannot exceed 100%"),
  gstInclusive: z.boolean().default(true),
  cessRate: z.coerce.number().min(0).max(100, "Cess rate cannot exceed 100%"),
  hsnChapter: z.string().optional(),
  gstApplicability: z
    .enum(["Regular", "Composition", "Exempt"])
    .default("Regular"),

  // Batch Details
  batches: z
    .array(
      z.object({
        bNo: z.string().min(1, "Batch number is required"),
        mfgDate: z.string().optional().nullable(),
        expDate: z.string().optional().nullable(),
        barcode: z.string().min(1, "Barcode is required"),
        basicPrice: z.coerce.number().positive("Basic price must be positive"),
        openingStock: z.coerce.number().min(0, "Stock cannot be negative"),
        mrp: z.coerce.number().positive("MRP must be positive"),
        pRate: z.coerce.number().positive("Purchase rate must be positive"),
        sRate: z.coerce.number().positive("Sale rate must be positive"),
        margin: z.coerce.number(),
        gstAmount: z.coerce.number().min(0).optional(),
      })
    )
    .default([]),
});

type ProductFormValues = z.infer<typeof productSchema>;

// Initial form values
const defaultValues: ProductFormValues = {
  productCode: "",
  productBrand: "",
  description: "",
  hsnSacCode: "",
  goodsOrServices: "Goods",
  weight: 1,
  unit: "GM",
  productGroup: "",
  productShortName: "",
  purchaseUnit: "PCS",
  conversionFactor: 1,
  pricePerPCS: 0,
  productCompany: "",
  saleUnit: "PCS",
  cartonPack: 24,
  innerPack: "",
  packagingBasic: true,
  packagingMRP: false,
  insuranceTaxBasic: true,
  insuranceTaxMRP: false,
  gstRate: 18,
  gstInclusive: true,
  cessRate: 0,
  hsnChapter: "",
  gstApplicability: "Regular",
  batches: [
    {
      bNo: "",
      mfgDate: null,
      expDate: null,
      barcode: "",
      basicPrice: 0,
      openingStock: 0,
      mrp: 0,
      pRate: 0,
      sRate: 0,
      margin: 0,
      gstAmount: 0,
    },
  ],
};

// Sample existing product for edit mode
const sampleProduct: ProductFormValues = {
  productCode: "10079",
  productBrand: "MILKY BAR 5 RS",
  description:
    "MILKY BAR 5 RS - Premium chocolate bar with rich creamy texture. Perfect for all age groups.",
  hsnSacCode: "18069010",
  goodsOrServices: "Goods",
  weight: 1,
  unit: "GM",
  productGroup: "ELITE",
  productShortName: "MILKY BAR 5 RS",
  purchaseUnit: "PCS",
  conversionFactor: 1,
  pricePerPCS: 24,
  productCompany: "Parle Agro Private Limited",
  saleUnit: "PCS",
  cartonPack: 24,
  innerPack: "",
  packagingBasic: true,
  packagingMRP: false,
  insuranceTaxBasic: true,
  insuranceTaxMRP: false,
  gstRate: 18,
  gstInclusive: true,
  cessRate: 0,
  hsnChapter: "18",
  gstApplicability: "Regular",
  batches: [
    {
      bNo: "1602770024177",
      mfgDate: "2025-01-15",
      expDate: "2026-01-15",
      barcode: "10079",
      basicPrice: 95.0,
      openingStock: 7,
      mrp: 150.0,
      pRate: 95.0,
      sRate: 107.14,
      margin: 12.14,
      gstAmount: 17.1,
    },
  ],
};

interface ProductFormProps {
  isEditMode?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ isEditMode = false }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [relatedImages, setRelatedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if we're in edit mode based on productId
  const isEdit = isEditMode || !!productId;

  // Initialize form with proper typing
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: isEditMode ? sampleProduct : defaultValues,
  });

  // Watch batches for UI updates
  const batches = form.watch("batches");
  const gstRate = form.watch("gstRate");

  // Calculate margin for a batch
  const calculateMargin = (pRate: number, sRate: number) => {
    return sRate - pRate;
  };

  // Calculate GST amount
  const calculateGST = (amount: number) => {
    return (amount * gstRate) / 100;
  };

  // Handle batch changes
  const handleBatchChange = (
    index: number,
    field: keyof ProductFormValues["batches"][0],
    value: any
  ) => {
    const updatedBatches = [...batches];
    updatedBatches[index] = { ...updatedBatches[index], [field]: value };

    // Calculate margin if pRate or sRate changes
    if (field === "pRate" || field === "sRate") {
      const pRate = field === "pRate" ? value : updatedBatches[index].pRate;
      const sRate = field === "sRate" ? value : updatedBatches[index].sRate;
      updatedBatches[index].margin = calculateMargin(pRate, sRate);

      // Update GST amount if GST inclusive
      if (form.getValues("gstInclusive")) {
        updatedBatches[index].gstAmount = calculateGST(pRate);
      }
    }

    form.setValue("batches", updatedBatches);
  };

  // Add new batch row
  const addBatchRow = () => {
    const newBatch: ProductFormValues["batches"][0] = {
      bNo: "",
      mfgDate: null,
      expDate: null,
      barcode: "",
      basicPrice: 0,
      openingStock: 0,
      mrp: 0,
      pRate: 0,
      sRate: 0,
      margin: 0,
      gstAmount: calculateGST(0),
    };
    form.setValue("batches", [...batches, newBatch]);
  };

  // Remove batch row
  const removeBatchRow = (index: number) => {
    if (batches.length > 1) {
      const updatedBatches = batches.filter((_, i) => i !== index);
      form.setValue("batches", updatedBatches);
    }
  };

  // Handle image upload
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
    }
  };

  const handleRelatedImagesUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    setRelatedImages([...relatedImages, ...files]);
  };

  const removeMainImage = () => {
    setMainImage(null);
  };

  const removeRelatedImage = (index: number) => {
    setRelatedImages(relatedImages.filter((_, i) => i !== index));
  };

  // Form submission
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      // Create FormData to include images
      const formData = new FormData();

      // Append form data
      Object.entries(data).forEach(([key, value]) => {
        if (key === "batches") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string);
        }
      });

      // Append images
      if (mainImage) {
        formData.append("mainImage", mainImage);
      }

      relatedImages.forEach((image, index) => {
        formData.append(`relatedImages_${index}`, image);
      });

      // Simulate API call
      console.log("Form data:", Object.fromEntries(formData));
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success - navigate back to inventory
      navigate("/product-inventory");
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Units options
  const unitOptions = ["GM", "KG", "PCS", "L", "ML", "M", "CM", "MM"];
  const productGroupOptions = ["ELITE", "PREMIUM", "STANDARD", "BASIC"];
  const purchaseSaleUnitOptions = ["PCS", "BOX", "CARTON", "KG", "GM", "L"];
  const gstApplicabilityOptions = ["Regular", "Composition", "Exempt"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3"
    >
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/product-inventory")}
              className="gap-2 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {isEdit ? "Edit Product" : "Add New Product"}
              </h1>
              {/* <p className="text-sm text-muted-foreground mt-1">
                {isEdit
                  ? "Update product details and inventory information"
                  : "Add a new product to your inventory"}
              </p> */}
            </div>
          </div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <Button
              variant="outline"
              onClick={() => navigate("/product-inventory")}
              disabled={isSubmitting}
              className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Save className="h-4 w-4" />
              {isSubmitting
                ? "Saving..."
                : isEdit
                ? "Update Product"
                : "Create Product"}
            </Button>
          </motion.div>
        </motion.div>

        {/* Single Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border border-gray-200 dark:border-gray-800 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
            <CardHeader className="pb-1 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  {/* Main Grid Layout */}
                  <div className="flex flex-col">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Column 1: Basic Information */}
                      <div className="space-y-6">
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            Basic Information
                          </h3>
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="productCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    Product Code *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., 10079"
                                      {...field}
                                      className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="productBrand"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    Product Brand *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., MILKY BAR 5 RS"
                                      {...field}
                                      className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    Description *
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Enter product description"
                                      className="min-h-[100px] text-sm border-gray-300 dark:border-gray-700 focus:border-primary"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="hsnSacCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    HSN/SAC Code *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., 18069010"
                                      {...field}
                                      className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="goodsOrServices"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    Goods/Services *
                                  </FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      className="flex space-x-4"
                                    >
                                      <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem
                                            value="Goods"
                                            className="h-4 w-4 text-primary"
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal text-xs cursor-pointer">
                                          Goods
                                        </FormLabel>
                                      </FormItem>
                                      <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                          <RadioGroupItem
                                            value="Services"
                                            className="h-4 w-4 text-primary"
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal text-xs cursor-pointer">
                                          Services
                                        </FormLabel>
                                      </FormItem>
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-3">
                              <FormField
                                control={form.control}
                                name="weight"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-medium">
                                      Weight *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-medium">
                                      Unit *
                                    </FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary">
                                          <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {unitOptions.map((unit) => (
                                          <SelectItem
                                            key={unit}
                                            value={unit}
                                            className="text-sm"
                                          >
                                            {unit}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="productGroup"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    Product Group *
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary">
                                        <SelectValue placeholder="Select group" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {productGroupOptions.map((group) => (
                                        <SelectItem
                                          key={group}
                                          value={group}
                                          className="text-sm"
                                        >
                                          {group}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </motion.div>
                      </div>

                      {/* Column 2: Additional Information */}
                      <div className="space-y-6">
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.2 }}
                        >
                          <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            Additional Information
                          </h3>
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="productShortName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    Product Short Name *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., MILKY BAR 5 RS"
                                      {...field}
                                      className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="productCompany"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    Product Company *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Parle Agro Private Limited"
                                      {...field}
                                      className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-3">
                              <FormField
                                control={form.control}
                                name="purchaseUnit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-medium">
                                      Purchase Unit *
                                    </FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary">
                                          <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {purchaseSaleUnitOptions.map((unit) => (
                                          <SelectItem
                                            key={unit}
                                            value={unit}
                                            className="text-sm"
                                          >
                                            {unit}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="conversionFactor"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-medium">
                                      Conversion Factor *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="pricePerPCS"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    Price per PCS *
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                                        ₹
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        className="h-9 text-sm pl-8 border-gray-300 dark:border-gray-700 focus:border-primary"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="saleUnit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    Sale Unit *
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary">
                                        <SelectValue placeholder="Select unit" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {purchaseSaleUnitOptions.map((unit) => (
                                        <SelectItem
                                          key={unit}
                                          value={unit}
                                          className="text-sm"
                                        >
                                          {unit}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-3">
                              <FormField
                                control={form.control}
                                name="cartonPack"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-medium">
                                      Carton Pack *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="innerPack"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-medium">
                                      Inner Pack
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value || ""}
                                        className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </motion.div>

                        {/* Packaging & Insurance Tax */}
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                        >
                          <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            Settings
                          </h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-xs font-medium">
                                <Package className="h-3 w-3" />
                                Packaging
                              </div>
                              <FormField
                                control={form.control}
                                name="packagingBasic"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="h-4 w-4 border-gray-300 data-[state=checked]:bg-primary"
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs font-normal cursor-pointer">
                                      BASIC
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="packagingMRP"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="h-4 w-4 border-gray-300 data-[state=checked]:bg-primary"
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs font-normal cursor-pointer">
                                      MRP
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-xs font-medium">
                                <Shield className="h-3 w-3" />
                                Insurance Tax %
                              </div>
                              <FormField
                                control={form.control}
                                name="insuranceTaxBasic"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="h-4 w-4 border-gray-300 data-[state=checked]:bg-primary"
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs font-normal cursor-pointer">
                                      BASIC
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="insuranceTaxMRP"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        className="h-4 w-4 border-gray-300 data-[state=checked]:bg-primary"
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs font-normal cursor-pointer">
                                      MRP
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Column 3: GST Details */}
                      <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            GST Details
                          </h3>
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="gstApplicability"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    GST Applicability *
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary">
                                        <SelectValue placeholder="Select applicability" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {gstApplicabilityOptions.map((option) => (
                                        <SelectItem
                                          key={option}
                                          value={option}
                                          className="text-sm"
                                        >
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="gstRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    GST Rate (%) *
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                        <Percent className="h-3 w-3" />
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        className="h-9 text-sm pl-9 border-gray-300 dark:border-gray-700 focus:border-primary"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="cessRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    CESS Rate (%)
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                        <Percent className="h-3 w-3" />
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        className="h-9 text-sm pl-9 border-gray-300 dark:border-gray-700 focus:border-primary"
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="hsnChapter"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">
                                    HSN Chapter
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., 18"
                                      {...field}
                                      className="h-9 text-sm border-gray-300 dark:border-gray-700 focus:border-primary"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="gstInclusive"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-xs font-medium">
                                      GST Inclusive
                                    </FormLabel>
                                    <div className="text-xs text-muted-foreground">
                                      GST included in product price
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="h-5 w-5 data-[state=checked]:bg-primary"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            {/* GST Summary */}
                            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
                              <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                                GST Summary
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Current GST Rate:
                                  </span>
                                  <span className="font-semibold text-primary">
                                    {gstRate}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    CESS Rate:
                                  </span>
                                  <span className="font-semibold">
                                    {form.watch("cessRate")}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Applicability:
                                  </span>
                                  <span className="font-semibold">
                                    {form.watch("gstApplicability")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                    {/* Images Section */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        Product Images
                      </h3>
                      <div className="flex justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs font-medium text-muted-foreground">
                              Main Image
                            </div>
                            {mainImage && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeMainImage}
                                className="h-6 text-xs gap-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                                Remove
                              </Button>
                            )}
                          </div>
                          {mainImage ? (
                            <div className="relative group w-20">
                              <img
                                src={URL.createObjectURL(mainImage)}
                                alt="Main product"
                                className="h-20 w-full object-cover rounded-lg border-2 border-primary/20 group-hover:border-primary transition-all duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg" />
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary transition-all duration-300 group">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <ImageIcon className="h-6 w-6 text-gray-400 group-hover:text-primary mb-2 transition-all duration-300" />
                                <p className="text-[10px] text-gray-500 group-hover:text-primary mb-1">
                                  Click to upload main image
                                </p>
                                {/* <p className="text-[10px] text-gray-400">
                                  Recommended: 500x500px
                                </p> */}
                              </div>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleMainImageUpload}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        <div className="w-[80%]">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs font-medium text-muted-foreground">
                              Related Images
                            </div>
                            <div>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleRelatedImagesUpload}
                                className="hidden"
                                id="related-images-upload"
                                multiple
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  document
                                    .getElementById("related-images-upload")
                                    ?.click()
                                }
                                className="h-7 text-xs gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add More
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <AnimatePresence>
                              {relatedImages.map((image, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  className="relative group w-20"
                                >
                                  <img
                                    src={URL.createObjectURL(image)}
                                    alt={`Related ${index + 1}`}
                                    className="h-20 w-full object-cover rounded-lg border border-gray-200 dark:border-gray-800 group-hover:border-destructive transition-all duration-300"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                                    onClick={() => removeRelatedImage(index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  {/* Batch Details Section - Now at the bottom */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="border-t border-gray-200 dark:border-gray-800 pt-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          Batch Details
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Manage batch-specific pricing, stock, and expiration
                          dates
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addBatchRow}
                        className="gap-2 border-primary/30 hover:bg-primary/5 hover:border-primary"
                      >
                        <Plus className="h-4 w-4" />
                        Add Batch
                      </Button>
                    </div>

                    <AnimatePresence>
                      {batches.map((batch, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="mb-4"
                        >
                          <Card className="border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <CardHeader className="py-3 px-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                  <CardTitle className="text-sm font-medium">
                                    Batch #{index + 1}
                                    {batch.bNo && (
                                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        ({batch.bNo})
                                      </span>
                                    )}
                                  </CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeBatchRow(index)}
                                    disabled={batches.length === 1}
                                    className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Batch Information */}
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">
                                      Batch No. *
                                    </label>
                                    <Input
                                      value={batch.bNo}
                                      onChange={(e) =>
                                        handleBatchChange(
                                          index,
                                          "bNo",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Enter batch number"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">
                                      Barcode *
                                    </label>
                                    <Input
                                      value={batch.barcode}
                                      onChange={(e) =>
                                        handleBatchChange(
                                          index,
                                          "barcode",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Enter barcode"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>

                                {/* Dates */}
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">
                                      MFG Date
                                    </label>
                                    <Input
                                      type="date"
                                      value={batch.mfgDate || ""}
                                      onChange={(e) =>
                                        handleBatchChange(
                                          index,
                                          "mfgDate",
                                          e.target.value || null
                                        )
                                      }
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">
                                      EXP Date
                                    </label>
                                    <Input
                                      type="date"
                                      value={batch.expDate || ""}
                                      onChange={(e) =>
                                        handleBatchChange(
                                          index,
                                          "expDate",
                                          e.target.value || null
                                        )
                                      }
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>

                                {/* Pricing */}
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">
                                      Purchase Rate *
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                                        ₹
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={batch.pRate}
                                        onChange={(e) =>
                                          handleBatchChange(
                                            index,
                                            "pRate",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="h-8 text-sm pl-6"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">
                                      Sale Rate *
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                                        ₹
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={batch.sRate}
                                        onChange={(e) =>
                                          handleBatchChange(
                                            index,
                                            "sRate",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="h-8 text-sm pl-6"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Stock & MRP */}
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">
                                      Opening Stock *
                                    </label>
                                    <Input
                                      type="number"
                                      value={batch.openingStock}
                                      onChange={(e) =>
                                        handleBatchChange(
                                          index,
                                          "openingStock",
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">
                                      MRP *
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                                        ₹
                                      </span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={batch.mrp}
                                        onChange={(e) =>
                                          handleBatchChange(
                                            index,
                                            "mrp",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="h-8 text-sm pl-6"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Summary */}
                                <div className="space-y-3">
                                  <div>
                                    <div className="text-xs font-medium mb-1">
                                      Margin
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs w-full justify-center py-1.5"
                                    >
                                      ₹{batch.margin.toFixed(2)}
                                    </Badge>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium mb-1">
                                      GST Amount
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs w-full justify-center py-1.5"
                                    >
                                      ₹{batch.gstAmount?.toFixed(2) || "0.00"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProductForm;
