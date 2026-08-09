import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const fieldLabelClass = "text-xs font-normal text-muted-foreground";
import { Input } from "@/components/ui/input";
import { bindNumberField } from "@/lib/numberInput";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  X as XIcon,
  Image as ImageIcon,
  Plus,
  Trash2,
  Percent,
  Package,
  Shield,
  Hash,
  Tag,
  FileText,
  Box,
  ChevronsUpDown,
  Check,
  ArrowLeft,
  Save,
  FilePlus,
  Loader2,
  Pin,
  PinOff,
} from "lucide-react";
import { useActiveLists } from "@/hooks/useActiveLists";
import { toast } from "sonner";
import { refreshActiveLists } from "@/utils/refreshActiveLists";
import { imageService } from "@/services/imageService";
import { productService } from "@/services/productService";
import { type ProductFormData, type Product } from "@/types/product";
import { getFullImageUrl, extractFilename } from "@/utils/imageUtils";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { cn } from "@/lib/utils";
import { CustomDateInput } from "@/components/custom_ui/CustomDateInput";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIsExpanded } from "@/utils/commonHelper";

// Define the schema for form validation
const productSchema = z.object({
  // Basic Info
  productCode: z.string().min(1, "Product code is required"),
  productBrand: z.string().min(1, "Product brand is required"),
  description: z.string().min(1, "Description is required"),
  hsnSacCode: z.string().min(1, "HSN/SAC code is required"),
  goodsServices: z.enum(["Goods", "Services"], {
    message: "Please select Goods or Services",
  }),
  weight: z.coerce.number().positive("Weight must be positive"),
  unitId: z.coerce.number().min(1, "Unit is required"),
  productGroupId: z.coerce.number().min(1, "Product group is required"),

  // Additional Info
  productShortName: z.string().min(1, "Short name is required"),
  purchaseUnit: z.string().min(1, "Purchase unit is required"),
  conversionFactor: z.coerce
    .number()
    .positive("Conversion factor must be positive"),
  pricePerPcs: z.coerce.number().positive("Price must be positive"),
  productCompanyId: z.coerce.number().min(1, "Product company is required"),
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

  // Status
  status: z.boolean().default(true),

  // Images
  mainImage: z.string().optional(),
  relatedImages: z.array(z.string()).default([]),

  // Batch Details
  batches: z
    .array(
      z.object({
        id: z.coerce.number().optional(),
        bNo: z.string().min(1, "Batch number is required"),
        mfgDate: z.string().optional().nullable(),
        expDate: z.string().optional().nullable(),
        barcode: z.string().min(1, "Barcode is required"),
        basicPrice: z.coerce.number("Basic price must be positive"),
        openingStock: z.coerce.number().min(0, "Stock cannot be negative"),
        mrp: z.coerce.number().positive("MRP must be positive"),
        pRate: z.coerce.number().positive("Purchase rate must be positive"),
        sRate: z.coerce.number().positive("Sale rate must be positive"),
        margin: z.coerce.number(),
        gstAmount: z.coerce.number().min(0).optional(),
        isPinned: z.boolean().default(false),
      }),
    )
    .default([]),
});

// Use the inferred type from schema
type FormData = z.infer<typeof productSchema>;

// Initial form values
const defaultValues: FormData = {
  productCode: "",
  productBrand: "",
  description: "",
  hsnSacCode: "",
  goodsServices: "Goods",
  weight: 0,
  unitId: 0,
  productGroupId: 0,
  productShortName: "",
  purchaseUnit: "",
  conversionFactor: 0,
  pricePerPcs: 0,
  productCompanyId: 0,
  saleUnit: "",
  cartonPack: 0,
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
  status: true,
  mainImage: "",
  relatedImages: [],
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
      isPinned: false,
    },
  ],
};

// GST options
const gstApplicabilityOptions = [
  { value: "Regular", label: "Regular" },
  { value: "Composition", label: "Composition" },
  { value: "Exempt", label: "Exempt" },
];

export default function AddProduct() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get id from query params
  const productId = searchParams.get("id");
  const isNew = productId === "new" || !productId;
  const isEditMode = productId && productId !== "new" ? true : false;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<FormData | null>(null);

  // Image states
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [relatedImageFiles, setRelatedImageFiles] = useState<File[]>([]);
  const [uploadedMainImage, setUploadedMainImage] = useState<string>("");
  const [uploadedRelatedImages, setUploadedRelatedImages] = useState<string[]>([]);

  // State for dropdown open/close
  const [unitIdOpen, setUnitIdOpen] = useState(false);
  const [productGroupIdOpen, setProductGroupIdOpen] = useState(false);
  const [productCompanyIdOpen, setProductCompanyIdOpen] = useState(false);
  const [purchaseUnitOpen, setPurchaseUnitOpen] = useState(false);
  const [saleUnitOpen, setSaleUnitOpen] = useState(false);
  const [gstApplicabilityOpen, setGstApplicabilityOpen] = useState(false);

  const { units, productCompanies, groups } = useActiveLists();

  const form = useForm<FormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues,
  });

  // Watch batches for UI updates
  const batches = form.watch("batches");
  const gstRate = form.watch("gstRate");
  const watchedValues = form.watch();

  useEffect(() => {
    if (batches.length === 1) {
      const onlyBatch = batches[0];
      if (onlyBatch && !onlyBatch.isPinned) {
        form.setValue(
          "batches",
          [{ ...onlyBatch, isPinned: true }],
          { shouldDirty: false },
        );
      }
    }
  }, [batches.length, batches[0]?.isPinned, form]);

  // Initialize URL with ?id=new if no id is present
  useEffect(() => {
    const currentId = searchParams.get("id");
    if (!currentId) {
      setSearchParams({ id: "new" }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Track form changes for edit mode
  useEffect(() => {
    if (isEditMode && originalData) {
      const currentValues = form.getValues();
      const isChanged = JSON.stringify(currentValues) !== JSON.stringify(originalData);
      setHasChanges(isChanged);
    }
  }, [watchedValues, isEditMode, originalData, form]);

  // Load product data if editing
  useEffect(() => {
    const loadProductData = async () => {
      if (isEditMode && productId) {
        setIsLoading(true);
        try {
          const productData = await productService.getProduct(Number(productId));
          console.log(productData,"oiwfheif")
          if (productData) {
            const formData = populateFormWithProductData(productData);
            setOriginalData(formData);
            setHasChanges(false);
          }
        } catch (error) {
          console.error("Error loading product:", error);
          toast.error("Failed to load product data");
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadProductData();
  }, [productId, isEditMode]);

  // Populate form with existing product data
  const populateFormWithProductData = (productData: Product): FormData => {
    const formData: FormData = {
      productCode: productData.productCode,
      productBrand: productData.productBrand,
      description: productData.description,
      hsnSacCode: productData.hsnSacCode,
      goodsServices: productData.goodsServices as "Goods" | "Services",
      weight: productData.weight,
      unitId: productData.unitId || 0,
      productGroupId: productData.productGroupId || 0,
      productShortName: productData.productShortName || "",
      purchaseUnit: productData.purchaseUnit || "",
      conversionFactor: productData.conversionFactor ?? 0,
      pricePerPcs: productData.pricePerPcs || 0,
      productCompanyId: productData.productCompanyId || 0,
      saleUnit: productData.saleUnit || "",
      cartonPack: productData.cartonPack ?? 0,
      innerPack: productData.innerPack || "",
      packagingBasic: productData.packagingBasic,
      packagingMRP: productData.packagingMRP,
      insuranceTaxBasic: productData.insuranceTaxBasic,
      insuranceTaxMRP: productData.insuranceTaxMRP,
      gstRate: productData.gstRate || 18,
      gstInclusive: productData.gstInclusive,
      cessRate: productData.cessRate || 0,
      hsnChapter: productData.hsnChapter || "",
      gstApplicability: productData.gstApplicability as
        | "Regular"
        | "Composition"
        | "Exempt",
      status: productData.status,
      mainImage: extractFilename(productData.mainImage || ""),
      relatedImages:
        productData.relatedImages?.map((img) =>
          extractFilename(img.imageUrl),
        ) || [],
      batches:
        productData.batches?.map((batch) => ({
          id: batch.id,
          bNo: batch.batchNo,
          mfgDate: batch.mfgDate,
          expDate: batch.expDate,
          barcode: batch.barcode,
          basicPrice: batch.basicPrice,
          openingStock: batch.openingStock,
          mrp: batch.mrp,
          pRate: batch.purchaseRate,
          sRate: batch.saleRate,
          margin: batch.margin,
          gstAmount: batch.gstAmount || 0,
          isPinned: batch.isPinned ?? false,
        })) || [],
    };

    form.reset(formData);

    const mainImg = extractFilename(productData.mainImage || "");
    setUploadedMainImage(mainImg);

    const relatedImgs =
      productData.relatedImages?.map((img) =>
        extractFilename(img.imageUrl),
      ) || [];
    setUploadedRelatedImages(relatedImgs);

    return formData;
  };

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (mainImageFile) {
        URL.revokeObjectURL(URL.createObjectURL(mainImageFile));
      }
      relatedImageFiles.forEach((file) => {
        URL.revokeObjectURL(URL.createObjectURL(file));
      });
    };
  }, [mainImageFile, relatedImageFiles]);

  // Helper functions
  const findUnitName = (unitId: number) => {
    const unit = units.find((u) => u.id === unitId);
    return unit ? `${unit.symbol} (${unit.name})` : "Select unit";
  };

  const findGroupName = (groupId: number) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.name : "Select group";
  };

  const findCompanyName = (companyId: number) => {
    const company = productCompanies.find((c) => c.id === companyId);
    return company ? company.name : "Select company";
  };

  const findGstApplicabilityLabel = (value: string) => {
    const option = gstApplicabilityOptions.find((opt) => opt.value === value);
    return option ? option.label : "Select GST applicability";
  };

  const calculateMargin = (pRate: number, sRate: number) => {
    return sRate - pRate;
  };

  const calculateGST = (amount: number) => {
    return (amount * gstRate) / 100;
  };

  // Handle batch changes
  const handleBatchChange = (
    index: number,
    field: keyof FormData["batches"][0],
    value: any,
  ) => {
    const updatedBatches = [...batches];
    updatedBatches[index] = { ...updatedBatches[index], [field]: value };

    if (field === "pRate" || field === "sRate") {
      const pRate = field === "pRate" ? value : updatedBatches[index].pRate;
      const sRate = field === "sRate" ? value : updatedBatches[index].sRate;
      updatedBatches[index].margin = calculateMargin(pRate, sRate);

      if (form.getValues("gstInclusive")) {
        updatedBatches[index].gstAmount = calculateGST(pRate);
      }
    }

    form.setValue("batches", updatedBatches);
  };

  // Add new batch row
  const addBatchRow = () => {
    const newBatch: FormData["batches"][0] = {
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
      isPinned: false,
    };
    form.setValue("batches", [...batches, newBatch]);
  };

  const handlePinBatch = async (index: number) => {
    const batch = batches[index];
    const nextPinned = !batch.isPinned;

    if (isEditMode && batch.id && productId) {
      try {
        await productService.pinProductBatch(
          Number(productId),
          batch.id,
          nextPinned,
        );
        const updatedBatches = batches.map((item, itemIndex) => ({
          ...item,
          isPinned: itemIndex === index ? nextPinned : false,
        }));
        form.setValue("batches", updatedBatches);
        toast.success(
          nextPinned
            ? `Batch ${batch.bNo || `#${index + 1}`} pinned for sales & purchase`
            : `Batch ${batch.bNo || `#${index + 1}`} unpinned`,
        );
      } catch (error: any) {
        toast.error("Failed to update pinned batch", {
          description: error.message || "Please try again",
        });
      }
      return;
    }

    const updatedBatches = batches.map((item, itemIndex) => ({
      ...item,
      isPinned: itemIndex === index ? nextPinned : false,
    }));
    form.setValue("batches", updatedBatches);
    toast.success(
      nextPinned
        ? `Batch ${batch.bNo || `#${index + 1}`} will be pinned after save`
        : `Batch ${batch.bNo || `#${index + 1}`} unpinned`,
    );
  };

  // Remove batch row
  const removeBatchRow = (index: number) => {
    if (batches.length > 1) {
      const updatedBatches = batches.filter((_, i) => i !== index);
      form.setValue("batches", updatedBatches);
    }
  };

  // Handle main image upload
  const handleMainImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setMainImageFile(file);
        const filename = await imageService.uploadImage(file);
        setUploadedMainImage(filename);
        form.setValue("mainImage", filename);
        toast.success("Main image uploaded successfully");
      } catch (error: any) {
        toast.error("Failed to upload main image", {
          description: error.message || "Please try again",
        });
        setMainImageFile(null);
      }
    }
  };

  // Handle related images upload
  const handleRelatedImagesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        const uploadedFilenames: string[] = [];
        for (const file of files) {
          const filename = await imageService.uploadImage(file);
          uploadedFilenames.push(filename);
        }

        const newRelatedImages = [
          ...uploadedRelatedImages,
          ...uploadedFilenames,
        ];
        setUploadedRelatedImages(newRelatedImages);
        setRelatedImageFiles((prev) => [...prev, ...files]);
        form.setValue("relatedImages", newRelatedImages);

        toast.success(`${files.length} image(s) uploaded successfully`);
      } catch (error: any) {
        toast.error("Failed to upload images", {
          description: error.message || "Please try again",
        });
      }
    }
  };

  // Remove main image
  const removeMainImage = () => {
    setMainImageFile(null);
    setUploadedMainImage("");
    form.setValue("mainImage", "");
    toast.info("Main image removed");
  };

  // Remove related image
  const removeRelatedImage = async (index: number) => {
    const imageToRemove = uploadedRelatedImages[index];
    if (imageToRemove) {
      try {
        await imageService.deleteImage(imageToRemove);
        const newImages = uploadedRelatedImages.filter((_, i) => i !== index);
        setUploadedRelatedImages(newImages);
        setRelatedImageFiles((prev) => prev.filter((_, i) => i !== index));
        form.setValue("relatedImages", newImages);

        toast.success("Image removed successfully");
      } catch (error: any) {
        toast.error("Failed to remove image", {
          description: error.message || "Please try again",
        });
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);

    try {
      const formData: ProductFormData = {
        ...data,
        goodsServices: data.goodsServices,
        gstApplicability: data.gstApplicability,
        batches: data.batches.map((batch) => ({
          ...batch,
          mfgDate: batch.mfgDate ?? null,
          expDate: batch.expDate ?? null,
          gstAmount: batch.gstAmount || 0,
          isPinned: batch.isPinned ?? false,
        })),
      };

      console.log("Converted form data:", formData);

      let response: Product;
      
      if (isEditMode) {
        // Update existing product
        response = await productService.updateProduct(Number(productId), formData);
        toast.success("Product updated successfully!");
        setOriginalData(data);
        setHasChanges(false);
      } else {
        // Create new product
        response = await productService.createProduct(formData);
        toast.success("Product created successfully!");
        
        // Update URL with the new product ID without navigation
        if (response?.id) {
          setSearchParams({ id: response.id.toString() }, { replace: true });
        }
      }
      void refreshActiveLists();
    } catch (error: any) {
      console.error("Error in form submission:", error);
      toast.error("Failed to save product. Please try again.", {
        description: error.response?.data?.message || "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast.error("Please fix all validation errors before submitting.");
  };

  // Navigation handlers
  const handleNewProduct = () => {
    // Reset form and navigate to ?id=new
    form.reset(defaultValues);
    setMainImageFile(null);
    setRelatedImageFiles([]);
    setUploadedMainImage("");
    setUploadedRelatedImages([]);
    setOriginalData(null);
    setHasChanges(false);
    setSearchParams({ id: "new" }, { replace: true });
  };

  const handleBackToInventory = () => {
    navigate("/inventory/products");
  };

  // Determine if new product button should be visible
  const canShowNewProduct = isEditMode;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex items-center gap-3 rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading product details...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen max-h-full overflow-y-hidden bg-background p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`mx-auto ${
          CheckIsExpanded()
            ? "max-w-5xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-9xl"
            : "max-w-9xl lg:max-w-5xl xl:max-w-8xl 2xl:max-w-10xl"
        }`}
      >
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-heading flex items-center gap-2 mb-4">
                <Package className="h-8 w-8" />
                {isEditMode ? "Edit Product" : "Add New Product"}
              </h1>
            </div>
          </div>

          <div className="flex gap-3">
            {/* New Product Button - Visible in edit mode */}
            {canShowNewProduct && (
              <Button
                variant="outline"
                onClick={handleNewProduct}
                className="gap-2"
              >
                <FilePlus className="h-4 w-4" />
                New Product
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleBackToInventory}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button
              onClick={form.handleSubmit(onSubmit, onError)}
              disabled={isSubmitting || (isEditMode && !hasChanges)}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {!isSubmitting && <Save className="h-4 w-4" />}
              {isSubmitting 
                ? "Saving..." 
                : isEditMode 
                  ? "Update Product" 
                  : "Create Product"}
            </Button>
          </div>
        </motion.div>

        <Form {...form}>
          <form
            data-entry-form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-6"
          >
            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Basic Information */}
              <motion.div
                className="space-y-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Basic Information
                    </h3>

                    <FormField
                      control={form.control}
                      name="productCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClass}>Product Code *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter product code"
                              {...field}
                              disabled={isSubmitting}
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
                          <FormLabel className={fieldLabelClass}>Product Brand *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter product brand"
                              {...field}
                              disabled={isSubmitting}
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
                          <FormLabel className={fieldLabelClass}>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter description"
                              className="min-h-[80px]"
                              {...field}
                              disabled={isSubmitting}
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
                          <FormLabel className={fieldLabelClass}>HSN/SAC Code *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter HSN/SAC code"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="goodsServices"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClass}>Goods / Services *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                              disabled={isSubmitting}
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem
                                    value="Goods"
                                    className="h-4 w-4"
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
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
                                <FormLabel className="font-normal cursor-pointer">
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
                            <FormLabel className={fieldLabelClass}>Weight *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter weight"
                                {...bindNumberField(field)}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Unit Dropdown using Command */}
                      <FormField
                        control={form.control}
                        name="unitId"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className={fieldLabelClass}>Unit *</FormLabel>
                            <FormControl>
                          <InlineSearchField
                            open={unitIdOpen}
                            onOpenChange={setUnitIdOpen}
                            displayValue={field.value
                                      ? findUnitName(field.value)
                                      : ""}
                            placeholder="Select unit"
                            emptyMessage="No unit found."
                            disabled={isSubmitting}
                          >
                            <CommandGroup>
                                      {units.map((unit) => (
                                        <CommandItem
                                          key={unit.id}
                                          value={`${unit.id} ${unit.symbol} ${unit.name}`}
                                          onSelect={() => {
                                            field.onChange(unit.id);
                                            setUnitIdOpen(false);
                                          }}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold">
                                              {unit.symbol}
                                            </span>
                                            <div className="flex flex-col">
                                              <span className="text-[12px] text-muted-foreground">
                                                {unit.name}
                                              </span>
                                            </div>
                                          </div>
                                          <Check
                                            className={cn(
                                              "ml-auto h-4 w-4",
                                              unit.id === field.value
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                          </InlineSearchField>
                        </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Product Group Dropdown using Command */}
                    <FormField
                      control={form.control}
                      name="productGroupId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className={fieldLabelClass}>Product Group *</FormLabel>
                          <FormControl>
                          <InlineSearchField
                            open={productGroupIdOpen}
                            onOpenChange={setProductGroupIdOpen}
                            displayValue={field.value
                                    ? findGroupName(field.value)
                                    : ""}
                            placeholder="Select product group"
                            emptyMessage="No group found."
                            disabled={isSubmitting}
                          >
                            <CommandGroup>
                                    {groups.map((group) => (
                                      <CommandItem
                                        key={group.id}
                                        value={`${group.id} ${group.name}`}
                                        onSelect={() => {
                                          field.onChange(group.id);
                                          setProductGroupIdOpen(false);
                                        }}
                                      >
                                        {group.name}
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            group.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                          </InlineSearchField>
                        </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Packaging & Insurance Tax */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Box className="h-4 w-4" />
                      Settings
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
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
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
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
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                MRP
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
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
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
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
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                MRP
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Column 2: Additional Information */}
              <motion.div
                className="space-y-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Additional Information
                    </h3>

                    <FormField
                      control={form.control}
                      name="productShortName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClass}>Product Short Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter short name"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Product Company Dropdown using Command */}
                    <FormField
                      control={form.control}
                      name="productCompanyId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className={fieldLabelClass}>Product Company *</FormLabel>
                          <FormControl>
                          <InlineSearchField
                            open={productCompanyIdOpen}
                            onOpenChange={setProductCompanyIdOpen}
                            displayValue={field.value
                                    ? findCompanyName(field.value)
                                    : ""}
                            placeholder="Select product company"
                            emptyMessage="No company found."
                            disabled={isSubmitting}
                          >
                            <CommandGroup>
                                    {productCompanies.map((company) => (
                                      <CommandItem
                                        key={company.id}
                                        value={`${company.id} ${company.name}`}
                                        onSelect={() => {
                                          field.onChange(company.id);
                                          setProductCompanyIdOpen(false);
                                        }}
                                      >
                                        {company.name}
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            company.id === field.value
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                          </InlineSearchField>
                        </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      {/* Purchase Unit Dropdown using Command */}
                      <FormField
                        control={form.control}
                        name="purchaseUnit"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className={fieldLabelClass}>Purchase Unit *</FormLabel>
                            <FormControl>
                          <InlineSearchField
                            open={purchaseUnitOpen}
                            onOpenChange={setPurchaseUnitOpen}
                            displayValue={field.value
                                      ? findUnitName(parseInt(field.value))
                                      : ""}
                            placeholder="Select purchase unit"
                            emptyMessage="No unit found."
                            disabled={isSubmitting}
                          >
                            <CommandGroup>
                                      {units.map((unit) => (
                                        <CommandItem
                                          key={unit.id}
                                          value={`${unit.id} ${unit.symbol} ${unit.name}`}
                                          onSelect={() => {
                                            field.onChange(unit.id.toString());
                                            setPurchaseUnitOpen(false);
                                          }}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold">
                                              {unit.symbol}
                                            </span>
                                            <div className="flex flex-col">
                                              <span className="text-[12px] text-muted-foreground">
                                                {unit.name}
                                              </span>
                                            </div>
                                          </div>
                                          <Check
                                            className={cn(
                                              "ml-auto h-4 w-4",
                                              unit.id.toString() === field.value
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                          </InlineSearchField>
                        </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="conversionFactor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={fieldLabelClass}>Conversion Factor *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter conversion factor"
                                {...bindNumberField(field)}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="pricePerPcs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClass}>Price per PCS *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                ₹
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter price per PCS"
                                {...bindNumberField(field)}
                                className="pl-8"
                                disabled={isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Sale Unit Dropdown using Command */}
                    <FormField
                      control={form.control}
                      name="saleUnit"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className={fieldLabelClass}>Sale Unit *</FormLabel>
                          <FormControl>
                          <InlineSearchField
                            open={saleUnitOpen}
                            onOpenChange={setSaleUnitOpen}
                            displayValue={field.value
                                    ? findUnitName(parseInt(field.value))
                                    : ""}
                            placeholder="Select sale unit"
                            emptyMessage="No unit found."
                            disabled={isSubmitting}
                          >
                            <CommandGroup>
                                    {units.map((unit) => (
                                      <CommandItem
                                        key={unit.id}
                                        value={`${unit.id} ${unit.symbol} ${unit.name}`}
                                        onSelect={() => {
                                          field.onChange(unit.id.toString());
                                          setSaleUnitOpen(false);
                                        }}
                                      >
                                        {unit.name}
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            unit.id.toString() === field.value
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                          </InlineSearchField>
                        </FormControl>
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
                            <FormLabel className={fieldLabelClass}>Carton Pack *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter carton pack"
                                {...bindNumberField(field)}
                                disabled={isSubmitting}
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
                            <FormLabel className={fieldLabelClass}>Inner Pack</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter inner pack"
                                {...field}
                                value={field.value || ""}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Images Section */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Product Images
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Main Image */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium">Main Image</div>
                          {(mainImageFile || uploadedMainImage) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeMainImage}
                              disabled={isSubmitting}
                              className="h-6 text-xs gap-1"
                            >
                              <XIcon className="h-3 w-3" />
                              Remove
                            </Button>
                          )}
                        </div>
                        {mainImageFile ? (
                          <div className="relative group">
                            <img
                              src={URL.createObjectURL(mainImageFile)}
                              alt="Main product"
                              className="h-32 w-full object-cover rounded-lg border"
                            />
                          </div>
                        ) : uploadedMainImage ? (
                          <div className="relative group">
                            <img
                              src={getFullImageUrl(uploadedMainImage)}
                              alt="Main product"
                              className="h-32 w-full object-cover rounded-lg border"
                            />
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                            <div className="flex flex-col items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Click to upload
                              </p>
                            </div>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleMainImageUpload}
                              className="hidden"
                              disabled={isSubmitting}
                            />
                          </label>
                        )}
                      </div>

                      {/* Related Images */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium">
                            Related Images ({uploadedRelatedImages.length})
                          </div>
                          <div>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleRelatedImagesUpload}
                              className="hidden"
                              id="related-images-upload"
                              multiple
                              disabled={isSubmitting}
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
                              disabled={isSubmitting}
                              className="h-7 text-xs gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add More
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <AnimatePresence>
                            {relatedImageFiles.map((image, index) => (
                              <motion.div
                                key={`file-${index}`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="relative w-16 h-16"
                              >
                                <img
                                  src={URL.createObjectURL(image)}
                                  alt={`Related ${index + 1}`}
                                  className="h-16 w-16 object-cover rounded-lg border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                                  onClick={() => removeRelatedImage(index)}
                                  disabled={isSubmitting}
                                >
                                  <XIcon className="h-3 w-3" />
                                </Button>
                              </motion.div>
                            ))}

                            {uploadedRelatedImages
                              .filter(
                                (_, index) => index >= relatedImageFiles.length,
                              )
                              .map((filename, index) => (
                                <motion.div
                                  key={`uploaded-${index}`}
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  className="relative w-16 h-16"
                                >
                                  <img
                                    src={getFullImageUrl(filename)}
                                    alt={`Related ${index + 1}`}
                                    className="h-16 w-16 object-cover rounded-lg border"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                                    onClick={() =>
                                      removeRelatedImage(
                                        relatedImageFiles.length + index,
                                      )
                                    }
                                    disabled={isSubmitting}
                                  >
                                    <XIcon className="h-3 w-3" />
                                  </Button>
                                </motion.div>
                              ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Column 3: GST Details */}
              <motion.div
                className="space-y-4"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      GST Details
                    </h3>

                    {/* GST Applicability Dropdown using Command */}
                    <FormField
                      control={form.control}
                      name="gstApplicability"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className={fieldLabelClass}>GST Applicability *</FormLabel>
                          <FormControl>
                          <InlineSearchField
                            open={gstApplicabilityOpen}
                            onOpenChange={setGstApplicabilityOpen}
                            displayValue={field.value
                                    ? findGstApplicabilityLabel(field.value)
                                    : ""}
                            placeholder="Select GST applicability"
                            emptyMessage="No option found."
                            disabled={isSubmitting}
                          >
                            <CommandGroup>
                                    {gstApplicabilityOptions.map((option) => (
                                      <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => {
                                          field.onChange(option.value);
                                          setGstApplicabilityOpen(false);
                                        }}
                                      >
                                        {option.label}
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            option.value === field.value
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                          </InlineSearchField>
                        </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gstRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClass}>GST Rate (%) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                <Percent className="h-3 w-3" />
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter GST rate"
                                {...bindNumberField(field)}
                                className="pl-9"
                                disabled={isSubmitting}
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
                          <FormLabel className={fieldLabelClass}>CESS Rate (%)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                <Percent className="h-3 w-3" />
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter CESS rate"
                                {...bindNumberField(field)}
                                className="pl-9"
                                disabled={isSubmitting}
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
                          <FormLabel className={fieldLabelClass}>HSN Chapter</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter HSN chapter"
                              {...field}
                              disabled={isSubmitting}
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">
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
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* GST Summary */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        GST Summary
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Current GST Rate:</span>
                          <span className="font-semibold">{gstRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CESS Rate:</span>
                          <span className="font-semibold">
                            {form.watch("cessRate")}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Applicability:</span>
                          <span className="font-semibold">
                            {form.watch("gstApplicability")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Batch Details Section */}
            <motion.div
              className="border-t pt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Batch Details</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage batch-specific pricing, stock, and expiration dates.
                    Pin one batch to use it exclusively in sales and purchase.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBatchRow}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
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
                    className="mb-4 border rounded-lg overflow-hidden bg-card"
                  >
                    <div className="bg-muted/50 px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              batch.isPinned ? "bg-amber-500" : "bg-primary",
                            )}
                          />
                          <div className="text-sm font-medium">
                            Batch #{index + 1}
                            {batch.bNo && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({batch.bNo})
                              </span>
                            )}
                          </div>
                          {batch.isPinned && (
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-800 border-amber-200"
                            >
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={batch.isPinned ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePinBatch(index)}
                            disabled={isSubmitting}
                            className={cn(
                              "h-7 gap-1.5",
                              batch.isPinned &&
                                "bg-amber-500 hover:bg-amber-600 text-white",
                            )}
                            title={
                              batch.isPinned
                                ? "Unpin batch"
                                : "Pin batch for sales & purchase"
                            }
                          >
                            {batch.isPinned ? (
                              <PinOff className="h-3.5 w-3.5" />
                            ) : (
                              <Pin className="h-3.5 w-3.5" />
                            )}
                            {batch.isPinned ? "Unpin" : "Pin Batch"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBatchRow(index)}
                            disabled={batches.length === 1 || isSubmitting}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Batch Information */}
                        <div className="space-y-3">
                          <div>
                            <label className={fieldLabelClass}>Batch No. *</label>
                            <Input
                              value={batch.bNo}
                              onChange={(e) =>
                                handleBatchChange(index, "bNo", e.target.value)
                              }
                              placeholder="Enter batch number"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <label className={fieldLabelClass}>Barcode *</label>
                            <Input
                              value={batch.barcode}
                              onChange={(e) =>
                                handleBatchChange(
                                  index,
                                  "barcode",
                                  e.target.value,
                                )
                              }
                              placeholder="Enter barcode"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-3">
                          <div>
                            <label className={fieldLabelClass}>MFG Date</label>
                            <CustomDateInput
                              value={batch.mfgDate}
                              onChange={(value) =>
                                handleBatchChange(index, "mfgDate", value)
                              }
                              placeholder="Select MFG date"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <label className={fieldLabelClass}>EXP Date</label>
                            <CustomDateInput
                              value={batch.expDate}
                              onChange={(value) =>
                                handleBatchChange(index, "expDate", value)
                              }
                              placeholder="Select EXP date"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-3">
                          <div>
                            <label className={fieldLabelClass}>Purchase Rate *</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
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
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                placeholder="Enter purchase rate"
                                className="pl-8"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                          <div>
                            <label className={fieldLabelClass}>Sale Rate *</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
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
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                placeholder="Enter sale rate"
                                className="pl-8"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Stock & MRP */}
                        <div className="space-y-3">
                          <div>
                            <label className={fieldLabelClass}>Opening Stock *</label>
                            <Input
                              type="number"
                              value={batch.openingStock}
                              onChange={(e) =>
                                handleBatchChange(
                                  index,
                                  "openingStock",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              placeholder="Enter opening stock"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <label className={fieldLabelClass}>MRP *</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
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
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                placeholder="Enter MRP"
                                className="pl-8"
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium mb-1">
                              Margin
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm w-full justify-center py-2"
                            >
                              ₹{batch.margin.toFixed(2)}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-1">
                              GST Amount
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-sm w-full justify-center py-2"
                            >
                              ₹{batch.gstAmount?.toFixed(2) || "0.00"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Sticky Footer Actions */}
            <motion.div
              className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t pt-4 pb-2 flex justify-end gap-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {/* New Product Button - Also shown at bottom for convenience */}
              {canShowNewProduct && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNewProduct}
                  className="gap-2"
                >
                  <FilePlus className="h-4 w-4" />
                  New Product
                </Button>
              )}
              
              {/* <Button
                type="button"
                variant="outline"
                onClick={handleBackToInventory}
                disabled={isSubmitting}
              >
                Cancel
              </Button> */}
              
              <Button 
                type="submit" 
                disabled={isSubmitting || (isEditMode && !hasChanges)} 
                className="gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {!isSubmitting && <Save className="h-4 w-4" />}
                {isSubmitting 
                  ? "Saving..." 
                  : isEditMode 
                    ? "Update Product" 
                    : "Create Product"}
              </Button>
            </motion.div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
}
