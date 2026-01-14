// src/pages/ProductForm.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Upload,
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
} from "lucide-react";

// Define the schema for form validation
const productSchema = z.object({
  // Basic Info
  productCode: z.string().min(1, "Product code is required"),
  productBrand: z.string().min(1, "Product brand is required"),
  description: z.string().min(1, "Description is required"),
  hsnSacCode: z.string().min(1, "HSN/SAC code is required"),
  goodsOrServices: z.enum(["Goods", "Services"], {
    error: "Please select Goods or Services",
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
    },
  ],
};

// Sample existing product for edit mode
const sampleProduct: ProductFormValues = {
  productCode: "10079",
  productBrand: "MILKY BAR 5 RS",
  description: "MILKY BAR 5 RS",
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

  // Initialize form with proper typing
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: isEditMode ? sampleProduct : defaultValues,
  });

  // Watch batches for UI updates
  const batches = form.watch("batches");

  // Calculate margin for a batch
  const calculateMargin = (pRate: number, sRate: number) => {
    return sRate - pRate;
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

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/product-inventory")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-heading">
                {isEditMode ? "Edit Product" : "Add New Product"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditMode
                  ? "Update product details and inventory information"
                  : "Add a new product to your inventory"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/product-inventory")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </div>

        {/* Single Form Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1: Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        Basic Information
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="productCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Product Code *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., 10079"
                                  {...field}
                                  className="h-8 text-sm"
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
                              <FormLabel className="text-xs">
                                Product Brand *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., MILKY BAR 5 RS"
                                  {...field}
                                  className="h-8 text-sm"
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
                              <FormLabel className="text-xs">
                                Description *
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter product description"
                                  className="min-h-[60px] text-sm"
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
                              <FormLabel className="text-xs">
                                HSN/SAC Code *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., 18069010"
                                  {...field}
                                  className="h-8 text-sm"
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
                              <FormLabel className="text-xs">
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
                                        className="h-4 w-4"
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-xs">
                                      Goods
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem
                                        value="Services"
                                        className="h-4 w-4"
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-xs">
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
                                <FormLabel className="text-xs">
                                  Weight *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    className="h-8 text-sm"
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
                                <FormLabel className="text-xs">
                                  Unit *
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-sm">
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
                              <FormLabel className="text-xs">
                                Product Group *
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-8 text-sm">
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
                    </div>

                    {/* Images Section */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        Product Images
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-xs text-muted-foreground">
                              Main Image:
                            </div>
                            {mainImage ? (
                              <div className="relative">
                                <img
                                  src={URL.createObjectURL(mainImage)}
                                  alt="Main product"
                                  className="h-12 w-12 object-cover rounded"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
                                  onClick={removeMainImage}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="border border-dashed rounded p-1">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleMainImageUpload}
                                  className="hidden"
                                  id="main-image-upload"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    document
                                      .getElementById("main-image-upload")
                                      ?.click()
                                  }
                                  className="h-6 text-xs gap-1"
                                >
                                  <Upload className="h-3 w-3" />
                                  Upload
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-muted-foreground">
                              Related Images:
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
                                className="h-6 text-xs gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {relatedImages.map((image, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={URL.createObjectURL(image)}
                                  alt={`Related ${index + 1}`}
                                  className="h-12 w-full object-cover rounded"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
                                  onClick={() => removeRelatedImage(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Additional Information */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        Additional Information
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="productShortName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Product Short Name *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., MILKY BAR 5 RS"
                                  {...field}
                                  className="h-8 text-sm"
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
                              <FormLabel className="text-xs">
                                Product Company *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Parle Agro Private Limited"
                                  {...field}
                                  className="h-8 text-sm"
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
                                <FormLabel className="text-xs">
                                  Purchase Unit *
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-sm">
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
                                <FormLabel className="text-xs">
                                  Conversion Factor *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    className="h-8 text-sm"
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
                              <FormLabel className="text-xs">
                                Price per PCS *
                              </FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  <span className="mr-2 text-muted-foreground text-xs">
                                    ₹
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    className="h-8 text-sm"
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
                              <FormLabel className="text-xs">
                                Sale Unit *
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-8 text-sm">
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
                                <FormLabel className="text-xs">
                                  Carton Pack *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-8 text-sm"
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
                                <FormLabel className="text-xs">
                                  Inner Pack
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    className="h-8 text-sm"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Packaging & Insurance Tax */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                        Settings
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-xs font-medium mb-1">
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
                                    className="h-4 w-4"
                                  />
                                </FormControl>
                                <FormLabel className="text-xs font-normal">
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
                                    className="h-4 w-4"
                                  />
                                </FormControl>
                                <FormLabel className="text-xs font-normal">
                                  MRP
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-medium mb-1">
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
                                    className="h-4 w-4"
                                  />
                                </FormControl>
                                <FormLabel className="text-xs font-normal">
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
                                    className="h-4 w-4"
                                  />
                                </FormControl>
                                <FormLabel className="text-xs font-normal">
                                  MRP
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Batch Details */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Batch Details
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addBatchRow}
                        className="h-7 text-xs gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Batch
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {batches.map((batch, index) => (
                        <div
                          key={index}
                          className="border rounded p-3 space-y-2"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Batch No.
                              </div>
                              <Input
                                value={batch.bNo}
                                onChange={(e) =>
                                  handleBatchChange(
                                    index,
                                    "bNo",
                                    e.target.value
                                  )
                                }
                                placeholder="Batch number"
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Barcode
                              </div>
                              <Input
                                value={batch.barcode}
                                onChange={(e) =>
                                  handleBatchChange(
                                    index,
                                    "barcode",
                                    e.target.value
                                  )
                                }
                                placeholder="Barcode"
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                MFG Date
                              </div>
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
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                EXP Date
                              </div>
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
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Basic Price
                              </div>
                              <Input
                                type="number"
                                step="0.01"
                                value={batch.basicPrice}
                                onChange={(e) =>
                                  handleBatchChange(
                                    index,
                                    "basicPrice",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Opening Stock
                              </div>
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
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                MRP
                              </div>
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
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Purchase Rate
                              </div>
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
                                className="h-7 text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Sale Rate
                              </div>
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
                                className="h-7 text-xs"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Margin
                              </div>
                              <div className="flex items-center h-7">
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 text-xs w-full justify-center"
                                >
                                  ₹{batch.margin.toFixed(2)}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBatchRow(index)}
                              disabled={batches.length === 1}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/product-inventory")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting
                      ? isEditMode
                        ? "Updating..."
                        : "Creating..."
                      : isEditMode
                      ? "Update Product"
                      : "Create Product"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductForm;
