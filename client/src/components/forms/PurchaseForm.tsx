import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  Plus,
  Trash2,
  Percent,
  Search,
  Package,
  Hash,
  FileText,
  Building,
  ChevronsUpDown,
  Check,
  IndianRupee,
  Layers,
  Calendar,
  CreditCard,
  DollarSign,
  Gift,
  Shield,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PurchaseFormData } from "@/types/purchase";
import BatchSelectionModal from "./BatchSelection";
import { useActiveLists } from "@/hooks/useActiveLists";

// Extend Product type to include cartonPack and conversionFactor
// Make sure your actual Product type has these fields, or adapt as needed.
interface ProductWithFactors {
  id: number;
  productCode: string;
  description: string;
  pricePerPcs?: number;
  gstRate?: number;
  cartonPack: number;
  conversionFactor: number;
  productBrand: string;
}

// Define the schema for form validation
const purchaseSchema = z.object({
  // Header Information
  invoiceDate: z.string().min(1, "Invoice date is required"),
  supplierId: z.coerce.number().min(1, "Supplier is required"),
  invoiceNo: z.string().min(1, "Invoice number is required"),
  gstDetails: z.string().optional(),

  // Product Items
  items: z
    .array(
      z.object({
        productId: z.coerce.number().min(1, "Product is required"),
        productCode: z.string().optional(),
        description: z.string().optional(),
        rate: z.coerce.number().min(0, "Rate must be positive"),
        aQty: z.coerce.number().min(0, "A. Qty must be positive").default(0),
        mQty: z.coerce.number().min(0, "M. Qty must be positive").default(0),
        totalAmount: z.coerce.number().min(0, "Total amount must be positive"),
        taxRate: z.coerce
          .number()
          .min(0)
          .max(100, "Tax rate cannot exceed 100%"),
        taxAmount: z.coerce.number().min(0, "Tax amount must be positive"),
        sch1Percent: z.coerce.number().min(0).max(100).default(0),
        sch1Amount: z.coerce.number().min(0).default(0),
        sch2Percent: z.coerce.number().min(0).max(100).default(0),
        sch2Amount: z.coerce.number().min(0).default(0),
        // Store product factors to use for recalculation even if product not in list?
        cartonPack: z.coerce.number().optional(),
        conversionFactor: z.coerce.number().optional(),
      }),
    )
    .min(1, "At least one product item is required"),

  // Summary Information
  remarks: z.string().optional(),
  grossAmount: z.coerce.number().min(0, "Gross amount must be positive"),
  boxUnit: z.coerce.number().min(0).default(0),
  cessInsurance: z.coerce.number().min(0).default(0),
  scheme1: z.coerce.number().min(0).default(0),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  tax: z.coerce.number().min(0).default(0),
  amountAdd: z.coerce.number().min(0).default(0),
  creditAmount: z.coerce.number().min(0).default(0),
  finalAmount: z.coerce.number().positive("Final amount must be positive"),
});

interface PurchaseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPurchase?: any | null;
  onSave: (data: PurchaseFormData, id?: number) => Promise<void>;
  isSubmitting?: boolean;
}

// Initial form values
const defaultValues: PurchaseFormData = {
  invoiceDate: new Date().toISOString().split("T")[0],
  supplierId: 0,
  invoiceNo: "",
  gstDetails: "Against GST",
  items: [],
  remarks: "",
  grossAmount: 0,
  boxUnit: 0,
  cessInsurance: 0,
  scheme1: 0,
  discountPercent: 0,
  tax: 0,
  amountAdd: 0,
  creditAmount: 0,
  finalAmount: 0,
};

export default function PurchaseForm({
  open,
  onOpenChange,
  editingPurchase,
  onSave,
  isSubmitting = false,
}: PurchaseFormModalProps) {
  // State for dropdown open/close
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(
    null,
  );

  // State for batch selection modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [pendingBatchSelection, setPendingBatchSelection] = useState<{
    index: number;
    productId: number;
    productCode: string;
    description: string;
    cartonPack: number;
    conversionFactor: number;
  } | null>(null);

  // Get data from Redux store – ensure products include cartonPack & conversionFactor
  const { suppliers, products } = useActiveLists();

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema) as any,
    defaultValues,
  });

  // Watch items for UI updates
  const items = form.watch("items");

  // Calculate totals whenever items change
  useEffect(() => {
    const calculateTotals = () => {
      const grossAmount = items.reduce(
        (sum, item) => sum + item.totalAmount,
        0,
      );
      const tax = items.reduce((sum, item) => sum + item.taxAmount, 0);

      const boxUnit = form.getValues("boxUnit") || 0;
      const cessInsurance = form.getValues("cessInsurance") || 0;
      const scheme1 = form.getValues("scheme1") || 0;
      const discountPercent = form.getValues("discountPercent") || 0;
      const amountAdd = form.getValues("amountAdd") || 0;
      const creditAmount = form.getValues("creditAmount") || 0;

      const discountAmount = grossAmount * (discountPercent / 100);
      const finalAmount =
        grossAmount +
        tax +
        boxUnit +
        cessInsurance +
        amountAdd -
        scheme1 -
        discountAmount -
        creditAmount;

      form.setValue("grossAmount", parseFloat(grossAmount.toFixed(2)));
      form.setValue("tax", parseFloat(tax.toFixed(2)));
      form.setValue(
        "finalAmount",
        Math.max(0, parseFloat(finalAmount.toFixed(2))),
      );
    };

    calculateTotals();
  }, [items, form]);

  // Reset form when editingPurchase changes
  useEffect(() => {
    if (editingPurchase) {
      form.reset(editingPurchase);
    } else {
      form.reset(defaultValues);
    }
  }, [editingPurchase, form]);

  // Helper functions using Redux data
  const findSupplierName = (supplierId: number) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier ? supplier.name : "Select supplier";
  };

  const findProduct = (productId: number) => {
    return products.find((p) => p.id === productId) as
      | ProductWithFactors
      | undefined;
  };

  const findProductName = (productId: number) => {
    const product = findProduct(productId);
    return product
      ? `${product.productCode}, ${product.productBrand}`
      : "Select product";
  };

  // Calculate M Qty based on A Qty and product factors
  const calculateMQty = (
    aQty: number,
    product?: ProductWithFactors,
  ): number => {
    if (!product) return 0;
    return aQty * (product.cartonPack || 0) * (product.conversionFactor || 0);
  };

  // Handle item changes
  const handleItemChange = (
    index: number,
    field: keyof PurchaseFormData["items"][0],
    value: any,
  ) => {
    const updatedItems = [...items];
    const item = updatedItems[index];

    // Update the field
    updatedItems[index] = { ...item, [field]: value };

    // If rate or aQty changes, recalculate total amount and tax
    if (field === "rate" || field === "aQty") {
      const rate = field === "rate" ? value : item.rate;
      const aQty = field === "aQty" ? value : item.aQty;
      const taxRate = item.taxRate;

      const totalAmount = rate * aQty;
      const taxAmount = totalAmount * (taxRate / 100);

      updatedItems[index].totalAmount = parseFloat(totalAmount.toFixed(2));
      updatedItems[index].taxAmount = parseFloat(taxAmount.toFixed(2));
    }

    // If tax rate changes, recalculate tax
    if (field === "taxRate") {
      const taxAmount = item.totalAmount * (value / 100);
      updatedItems[index].taxAmount = parseFloat(taxAmount.toFixed(2));
    }

    // If total amount changes, recalculate tax
    if (field === "totalAmount") {
      const taxAmount = value * (item.taxRate / 100);
      updatedItems[index].taxAmount = parseFloat(taxAmount.toFixed(2));
    }

    // Special handling for aQty: recalculate mQty using product factors
    if (field === "aQty") {
      const product = findProduct(item.productId);
      if (product) {
        updatedItems[index].mQty = calculateMQty(value, product);
        // Also store the factors for future reference (e.g., after batch selection)
        updatedItems[index].cartonPack = product.cartonPack;
        updatedItems[index].conversionFactor = product.conversionFactor;
      }
    }

    form.setValue("items", updatedItems);
  };

  // Handle batch selection from modal
  const handleBatchSelect = (batch: any, aQty: number, mQty: number) => {
    if (pendingBatchSelection) {
      const { index, cartonPack, conversionFactor } = pendingBatchSelection;
      const updatedItems = [...items];
      const item = updatedItems[index];

      // Recalculate mQty using the product's own factors (to be safe)
      const product = findProduct(item.productId);
      const calculatedMQty = product
        ? calculateMQty(aQty, product)
        : aQty * cartonPack * conversionFactor;

      // Update item with batch information
      updatedItems[index] = {
        ...item,
        rate: batch.purchaseRate,
        aQty: aQty,
        mQty: calculatedMQty,
        totalAmount: batch.purchaseRate * aQty,
        taxAmount: batch.purchaseRate * aQty * (item.taxRate / 100),
      };

      form.setValue("items", updatedItems);

      toast.success(`Batch applied to ${item.productCode}`, {
        description: `Rate: ₹${batch.purchaseRate.toFixed(2)} | A Qty: ${aQty} | M Qty: ${calculatedMQty}`,
      });

      // Clear pending selection
      setPendingBatchSelection(null);
    }
  };

  // Handle batch modal close
  const handleBatchModalClose = () => {
    setBatchModalOpen(false);
    setTimeout(() => {
      setPendingBatchSelection(null);
    }, 300);
  };

  // Open batch selection modal
  const openBatchModal = (index: number) => {
    if (!items[index].productId) {
      toast.error("Please select a product first");
      return;
    }

    const item = items[index];
    const product = findProduct(item.productId);
    if (!product) {
      toast.error("Product details not found");
      return;
    }

    setPendingBatchSelection({
      index,
      productId: item.productId,
      productCode: item.productCode || "",
      description: item.description || "",
      cartonPack: product.cartonPack,
      conversionFactor: product.conversionFactor,
    });
    setBatchModalOpen(true);
  };

  // Add new product row
  const addProductRow = () => {
    const newItem: PurchaseFormData["items"][0] = {
      productId: 0,
      productCode: "",
      description: "",
      rate: 0,
      aQty: 0,
      mQty: 0,
      totalAmount: 0,
      taxRate: 5,
      taxAmount: 0,
      sch1Percent: 0,
      sch1Amount: 0,
      sch2Percent: 0,
      sch2Amount: 0,
      cartonPack: 0,
      conversionFactor: 0,
      productBrand: "",
    };
    form.setValue("items", [...items, newItem]);
  };

  // Remove product row
  const removeProductRow = (index: number) => {
    if (items.length > 0) {
      const updatedItems = items.filter((_, i) => i !== index);
      form.setValue("items", updatedItems);
    }
  };

  // Handle product selection – opens batch modal automatically
  const handleProductSelect = (index: number, productId: number) => {
    const product = findProduct(productId);
    if (product) {
      const updatedItems = [...items];
      const aQty = 1; // default A Qty
      const mQty = calculateMQty(aQty, product);

      updatedItems[index] = {
        ...updatedItems[index],
        productId: product.id,
        productCode: product.productCode,
        description: product.description,
        productBrand: product.productBrand, // <-- add this

        rate: product.pricePerPcs || 0,
        taxRate: product.gstRate || 5,
        aQty,
        mQty,
        totalAmount: (product.pricePerPcs || 0) * aQty,
        taxAmount:
          (product.pricePerPcs || 0) * aQty * ((product.gstRate || 5) / 100),
        cartonPack: product.cartonPack,
        conversionFactor: product.conversionFactor,
      };
      form.setValue("items", updatedItems);

      // Close the product dropdown
      setProductOpen(false);
      setActiveProductIndex(null);

      // Open batch modal immediately
      setPendingBatchSelection({
        index,
        productId: product.id,
        productCode: product.productCode,
        description: product.description,
        cartonPack: product.cartonPack,
        conversionFactor: product.conversionFactor,
      });
      setBatchModalOpen(true);
    }
  };

  // Handle scheme percentage changes
  const handleSchemeChange = (
    index: number,
    schemeType: "sch1Percent" | "sch2Percent",
    value: number,
  ) => {
    const updatedItems = [...items];
    const item = updatedItems[index];

    updatedItems[index] = {
      ...item,
      [schemeType]: value,
      [schemeType === "sch1Percent" ? "sch1Amount" : "sch2Amount"]:
        item.totalAmount * (value / 100),
    };

    form.setValue("items", updatedItems);
  };

  const onSubmit = async (data: PurchaseFormData) => {
    console.log("Form submitted with data:", data);
    try {
      await onSave(data, editingPurchase?.id);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Failed to save purchase. Please try again.");
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast.error("Please fix all validation errors before submitting.");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[99vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {editingPurchase
                  ? "Edit Purchase Invoice"
                  : "Add New Purchase Invoice"}
              </DialogTitle>
            </div>

            <DialogDescription>
              {editingPurchase
                ? "Update purchase invoice details"
                : "Create a new purchase invoice"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onError)}
              className="space-y-6"
            >
              {/* Header Section - Full Row */}
              <div className="rounded-lg border p-4 bg-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Invoice Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Invoice Date */}
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          Invoice Date *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="date"
                              value={field.value}
                              onChange={field.onChange}
                              className="pl-10"
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Supplier Dropdown - Command Component */}
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm">
                          Supplier Name *
                        </FormLabel>
                        <Popover
                          open={supplierOpen}
                          onOpenChange={setSupplierOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={supplierOpen}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground",
                                )}
                                disabled={isSubmitting}
                              >
                                {field.value
                                  ? findSupplierName(field.value)
                                  : "Select supplier"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search suppliers..." />
                              <CommandList>
                                <CommandEmpty>No supplier found.</CommandEmpty>
                                <CommandGroup>
                                  {suppliers.map((supplier) => (
                                    <CommandItem
                                      key={supplier.id}
                                      value={`${supplier.id} ${supplier.name} ${supplier.phoneNo || ""}`}
                                      onSelect={() => {
                                        field.onChange(supplier.id);
                                        setSupplierOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {supplier.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {supplier.phoneNo &&
                                            `${supplier.phoneNo} • `}
                                          {supplier.email &&
                                            `${supplier.email} • `}
                                          {supplier.address}
                                        </span>
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          supplier.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Invoice No */}
                  <FormField
                    control={form.control}
                    name="invoiceNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Invoice No. *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="e.g., 501622"
                              className="pl-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* GST Details */}
                  <FormField
                    control={form.control}
                    name="gstDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">GST Details</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Against GST"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Products Table Section */}
              <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Products</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add products to the purchase invoice
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProductRow}
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="font-semibold w-12">Sr</TableHead>
                        <TableHead className="font-semibold">
                          Prod Code & Description
                        </TableHead>
                        <TableHead className="font-semibold">Rate</TableHead>
                        <TableHead className="font-semibold">A. Qty</TableHead>
                        <TableHead className="font-semibold">
                          M. Qty *
                        </TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Sch1%</TableHead>
                        <TableHead className="font-semibold">
                          Sch1 amt
                        </TableHead>
                        <TableHead className="font-semibold">Sch2%</TableHead>
                        <TableHead className="font-semibold">
                          Sch2 amt
                        </TableHead>
                        <TableHead className="font-semibold">Tax (%)</TableHead>
                        <TableHead className="font-semibold">Tax Amt</TableHead>
                        <TableHead className="font-semibold w-20">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {items.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={13}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No products added. Click "Add Product" to get
                              started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((item, index) => (
                            <motion.tr
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="hover:bg-secondary/30"
                            >
                              <TableCell>{index + 1}</TableCell>

                              {/* Product Selection */}
                              <TableCell>
                                <Popover
                                  open={
                                    productOpen && activeProductIndex === index
                                  }
                                  onOpenChange={(open) => {
                                    if (open) {
                                      setActiveProductIndex(index);
                                    } else {
                                      setActiveProductIndex(null);
                                    }
                                    setProductOpen(open);
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className="w-full justify-between"
                                      disabled={isSubmitting}
                                    >
                                      {item.productId
                                        ? findProductName(item.productId)
                                        : "Select product"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0">
                                    <Command>
                                      <CommandInput placeholder="Search products..." />
                                      <CommandList>
                                        <CommandEmpty>
                                          No product found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {products.map((product) => (
                                            <CommandItem
                                              key={product.id}
                                              value={`${product.id} ${product.productCode} ${product.productBrand}`}
                                              onSelect={() => {
                                                handleProductSelect(
                                                  index,
                                                  product.id,
                                                );
                                              }}
                                            >
                                              <div className="flex flex-col">
                                                <span className="font-medium">
                                                  {product.productCode}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                  {product.productBrand}
                                                </span>
                                              </div>
                                              <Check
                                                className={cn(
                                                  "ml-auto h-4 w-4",
                                                  product.id === item.productId
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                                )}
                                              />
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </TableCell>

                              {/* Rate */}
                              <TableCell>
                                <div className="relative">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.rate}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "rate",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-24 pl-7"
                                    disabled={isSubmitting}
                                  />
                                </div>
                              </TableCell>

                              {/* A. Qty */}
                              <TableCell>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="1"
                                    value={item.aQty}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "aQty",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-20"
                                    disabled={isSubmitting}
                                  />
                                </div>
                              </TableCell>

                              {/* M. Qty - DISABLED & AUTO-CALCULATED */}
                              <TableCell>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="1"
                                    value={item.mQty}
                                    readOnly
                                    disabled
                                    className="w-20 bg-muted cursor-not-allowed"
                                  />
                                </div>
                              </TableCell>

                              {/* Amount */}
                              <TableCell>
                                <div className="relative">
                                  <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.totalAmount}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "totalAmount",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-24 pl-7"
                                    disabled={isSubmitting}
                                  />
                                </div>
                              </TableCell>

                              {/* Sch1% */}
                              <TableCell>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.sch1Percent}
                                    onChange={(e) =>
                                      handleSchemeChange(
                                        index,
                                        "sch1Percent",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-20 pl-6"
                                    disabled={isSubmitting}
                                  />
                                  <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                </div>
                              </TableCell>

                              {/* Sch1 Amount */}
                              <TableCell>
                                <div className="font-medium text-sm">
                                  ₹{item.sch1Amount.toFixed(2)}
                                </div>
                              </TableCell>

                              {/* Sch2% */}
                              <TableCell>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.sch2Percent}
                                    onChange={(e) =>
                                      handleSchemeChange(
                                        index,
                                        "sch2Percent",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-20 pl-6"
                                    disabled={isSubmitting}
                                  />
                                  <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                </div>
                              </TableCell>

                              {/* Sch2 Amount */}
                              <TableCell>
                                <div className="font-medium text-sm">
                                  ₹{item.sch2Amount.toFixed(2)}
                                </div>
                              </TableCell>

                              {/* Tax Rate */}
                              <TableCell>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={item.taxRate}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "taxRate",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-20 pl-6"
                                    disabled={isSubmitting}
                                  />
                                  <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                </div>
                              </TableCell>

                              {/* Tax Amount */}
                              <TableCell>
                                <div className="font-medium text-sm">
                                  ₹{item.taxAmount.toFixed(2)}
                                </div>
                              </TableCell>

                              {/* Actions */}
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openBatchModal(index)}
                                    disabled={!item.productId || isSubmitting}
                                    className="h-7 w-7 p-0"
                                    title="Select Batch"
                                  >
                                    <Layers className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeProductRow(index)}
                                    disabled={isSubmitting}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                  <div className="p-2 text-xs text-muted-foreground border-t">
                    * M Qty is automatically calculated as A Qty × Carton Pack ×
                    Conversion Factor and cannot be edited.
                  </div>
                </div>
              </div>

              {/* Summary Section - Colorful and Formal */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Remarks - Left Side */}
                  <div className="lg:col-span-1">
                    <div className="bg-[var(--remarks-bg)] rounded-lg p-4 border border-[var(--remarks-border)]">
                      <h4 className="font-semibold mb-3 text-[var(--remarks-text)] flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Remarks & Notes
                      </h4>
                      <FormField
                        control={form.control}
                        name="remarks"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Enter any additional remarks, notes, or special instructions..."
                                className="min-h-[120px] bg-white dark:bg-gray-900 border-[var(--remarks-border)] focus:border-[var(--primary)]"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-xs text-[var(--remarks-text)] mt-2">
                        Add any special instructions or notes for this invoice.
                      </p>
                    </div>
                  </div>

                  {/* Summary - Right Side - Colorful Grid */}
                  <div className="lg:col-span-3">
                    <div className="bg-[var(--summary-container-bg)] rounded-xl p-5 border border-[var(--summary-container-border)] shadow-sm">
                      <h4 className="font-semibold mb-4 text-[var(--summary-container-text)] flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Invoice Summary
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Gross Amount */}
                        <div className="bg-[var(--summary-bg-1)] rounded-lg p-3 border border-[var(--summary-border-1)]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[var(--summary-text-1)]">
                              Gross Amount
                            </span>
                            <Tag className="h-3 w-3 text-[var(--summary-icon-1)]" />
                          </div>
                          <FormField
                            control={form.control}
                            name="grossAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[var(--summary-text-1)]" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-[var(--summary-border-1)] text-[var(--summary-text-1)] font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Box/Unit */}
                        <div className="bg-[var(--summary-bg-2)] rounded-lg p-3 border border-[var(--summary-border-2)]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[var(--summary-text-2)]">
                              Box/Unit
                            </span>
                            <Package className="h-3 w-3 text-[var(--summary-icon-2)]" />
                          </div>
                          <FormField
                            control={form.control}
                            name="boxUnit"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[var(--summary-text-2)]" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-[var(--summary-border-2)] text-[var(--summary-text-2)] font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* CESS/INS */}
                        <div className="bg-[var(--summary-bg-3)] rounded-lg p-3 border border-[var(--summary-border-3)]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[var(--summary-text-3)]">
                              CESS/INS
                            </span>
                            <Shield className="h-3 w-3 text-[var(--summary-icon-3)]" />
                          </div>
                          <FormField
                            control={form.control}
                            name="cessInsurance"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[var(--summary-text-3)]" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-[var(--summary-border-3)] text-[var(--summary-text-3)] font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Scheme 1 */}
                        <div className="bg-[var(--summary-bg-4)] rounded-lg p-3 border border-[var(--summary-border-4)]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[var(--summary-text-4)]">
                              Scheme 1
                            </span>
                            <Gift className="h-3 w-3 text-[var(--summary-icon-4)]" />
                          </div>
                          <FormField
                            control={form.control}
                            name="scheme1"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[var(--summary-text-4)]" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-[var(--summary-border-4)] text-[var(--summary-text-4)] font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Discount % */}
                        <div className="bg-[var(--summary-bg-5)] rounded-lg p-3 border border-[var(--summary-border-5)]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[var(--summary-text-5)]">
                              Discount %
                            </span>
                            <Percent className="h-3 w-3 text-[var(--summary-icon-5)]" />
                          </div>
                          <FormField
                            control={form.control}
                            name="discountPercent"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="h-8 bg-white dark:bg-gray-900/80 border-[var(--summary-border-5)] text-[var(--summary-text-5)] font-medium text-center"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Tax */}
                        <div className="bg-[var(--summary-bg-6)] rounded-lg p-3 border border-[var(--summary-border-6)]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[var(--summary-text-6)]">
                              Tax Amount
                            </span>
                            <FileText className="h-3 w-3 text-[var(--summary-icon-6)]" />
                          </div>
                          <FormField
                            control={form.control}
                            name="tax"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[var(--summary-text-6)]" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-[var(--summary-border-6)] text-[var(--summary-text-6)] font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Add Amount */}
                        <div className="bg-[var(--summary-bg-7)] rounded-lg p-3 border border-[var(--summary-border-7)]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[var(--summary-text-7)]">
                              Add Amount
                            </span>
                            <Plus className="h-3 w-3 text-[var(--summary-icon-7)]" />
                          </div>
                          <FormField
                            control={form.control}
                            name="amountAdd"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[var(--summary-text-7)]" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-[var(--summary-border-7)] text-[var(--summary-text-7)] font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Credit Amount */}
                        <div className="bg-[var(--summary-bg-8)] rounded-lg p-3 border border-[var(--summary-border-8)]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-[var(--summary-text-8)]">
                              Credit Amount
                            </span>
                            <CreditCard className="h-3 w-3 text-[var(--summary-icon-8)]" />
                          </div>
                          <FormField
                            control={form.control}
                            name="creditAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[var(--summary-text-8)]" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-[var(--summary-border-8)] text-[var(--summary-text-8)] font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Final Amount - Full Width */}
                        <div className="col-span-2 md:col-span-4 mt-4">
                          <div className="bg-[var(--summary-bg-final)] rounded-xl p-5 border border-[var(--summary-border-final)] shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-[var(--summary-text-final)]" />
                                <span className="text-lg font-bold text-[var(--summary-text-final)]">
                                  Final Amount
                                </span>
                              </div>
                              <Badge className="bg-white/20 text-[var(--summary-text-final)] hover:bg-white/30 border-0">
                                PAYABLE
                              </Badge>
                            </div>
                            <FormField
                              control={form.control}
                              name="finalAmount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative">
                                      <IndianRupee className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[var(--summary-text-final)]" />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        className="pl-12 h-14 text-2xl font-bold bg-white/10 text-[var(--summary-text-final)] border-white/30 placeholder:text-white/60"
                                        readOnly
                                        disabled
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <p className="text-xs text-[var(--summary-text-final)]/80 mt-3 flex items-center gap-1">
                              <span className="font-medium">Note:</span> This is
                              the total payable amount including all taxes and
                              adjustments.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : editingPurchase
                      ? "Update Purchase"
                      : "Create Purchase"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Batch Selection Modal - Opens automatically when product is selected */}
      {pendingBatchSelection && (
        <BatchSelectionModal
          open={batchModalOpen}
          onOpenChange={handleBatchModalClose}
          productId={pendingBatchSelection.productId}
          productCode={pendingBatchSelection.productCode}
          description={pendingBatchSelection.description}
          cartonPack={pendingBatchSelection.cartonPack}
          conversionFactor={pendingBatchSelection.conversionFactor}
          onBatchSelect={handleBatchSelect}
        />
      )}
    </>
  );
}
