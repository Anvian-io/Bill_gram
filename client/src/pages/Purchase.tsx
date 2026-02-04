import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Search,
  X,
  Calendar,
  Plus,
  FileText,
  Building,
  Percent,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { CustomPagination } from "@/components/custom_ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  headerVariants,
  buttonVariants,
  badgeVariants,
} from "../components/FramerVariants";
import { toast } from "sonner";
import { CustomAlert } from "@/components/custom_ui";
import { CustomDateInput } from "@/components/custom_ui/CustomDateInput";
import { useDebounce } from "@/utils/debounce";
import { Textarea } from "@/components/ui/textarea";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Date utility functions
const parseDateFromString = (dateString: string): Date | undefined => {
  if (!dateString) return undefined;

  const formats = [
    "dd/MM/yyyy",
    "dd-MM-yyyy",
    "dd.MM.yyyy",
    "dd/MM/yy",
    "yyyy-MM-dd",
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(dateString, fmt, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (error) {
      // Continue to next format
    }
  }

  return undefined;
};

const formatDateToDisplay = (date: Date | undefined): string => {
  if (!date) return "";
  return format(date, "dd/MM/yyyy");
};

const formatDateForAPI = (date: Date | undefined): string | undefined => {
  if (!date) return undefined;
  return format(date, "yyyy-MM-dd");
};

// Define Purchase type
interface Purchase {
  id: number;
  invoiceId: string;
  supplier: {
    id: number;
    name: string;
    contactPerson?: string;
    phone?: string;
  };
  amount: number;
  gstAmount: number;
  finalAmount: number;
  discountPercent: number;
  remarks: string;
  invoiceDate: string;
  createdAt: string;
  updatedAt: string;
  status: "Pending" | "Paid" | "Partially Paid" | "Cancelled";
  items: PurchaseItem[];
}

interface PurchaseItem {
  id: number;
  product: {
    id: number;
    productCode: string;
    productBrand: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  batchNumber?: string;
}

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
}

// Define the schema for form validation
const purchaseSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  supplierId: z.coerce.number().min(1, "Supplier is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().min(1, "Product is required"),
        quantity: z.coerce.number().positive("Quantity must be positive"),
        unitPrice: z.coerce.number().positive("Unit price must be positive"),
        batchNumber: z.string().optional(),
      })
    )
    .min(1, "At least one item is required"),
  discountPercent: z.coerce.number().min(0).max(100, "Discount cannot exceed 100%"),
  gstAmount: z.coerce.number().min(0, "GST amount must be positive"),
  remarks: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

// Initial form values
const defaultValues: PurchaseFormData = {
  invoiceId: "",
  supplierId: 0,
  invoiceDate: new Date().toISOString().split("T")[0],
  items: [
    {
      productId: 0,
      quantity: 1,
      unitPrice: 0,
      batchNumber: "",
    },
  ],
  discountPercent: 0,
  gstAmount: 0,
  remarks: "",
};

// Sample data for testing
const samplePurchaseData: PurchaseFormData = {
  invoiceId: "INV-2024-00123",
  supplierId: 1,
  invoiceDate: new Date().toISOString().split("T")[0],
  items: [
    {
      productId: 1,
      quantity: 10,
      unitPrice: 150.5,
      batchNumber: "BATCH001",
    },
    {
      productId: 2,
      quantity: 5,
      unitPrice: 299.99,
      batchNumber: "BATCH002",
    },
  ],
  discountPercent: 5,
  gstAmount: 225.75,
  remarks: "Sample purchase order",
};

// Mock data for demonstration
const mockPurchases: Purchase[] = [
  {
    id: 1,
    invoiceId: "INV-2024-00123",
    supplier: {
      id: 1,
      name: "ABC Suppliers Pvt. Ltd.",
      contactPerson: "John Doe",
      phone: "+91 9876543210",
    },
    amount: 2754.95,
    gstAmount: 225.75,
    finalAmount: 2980.7,
    discountPercent: 5,
    remarks: "Monthly stock purchase",
    invoiceDate: "2024-01-15",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    status: "Paid",
    items: [
      {
        id: 1,
        product: {
          id: 1,
          productCode: "PROD001",
          productBrand: "Sample Product 1",
        },
        quantity: 10,
        unitPrice: 150.5,
        totalPrice: 1505,
        batchNumber: "BATCH001",
      },
      {
        id: 2,
        product: {
          id: 2,
          productCode: "PROD002",
          productBrand: "Sample Product 2",
        },
        quantity: 5,
        unitPrice: 299.99,
        totalPrice: 1499.95,
        batchNumber: "BATCH002",
      },
    ],
  },
  {
    id: 2,
    invoiceId: "INV-2024-00124",
    supplier: {
      id: 2,
      name: "XYZ Traders",
      contactPerson: "Jane Smith",
      phone: "+91 9876543211",
    },
    amount: 5000,
    gstAmount: 900,
    finalAmount: 5900,
    discountPercent: 0,
    remarks: "Urgent order",
    invoiceDate: "2024-01-16",
    createdAt: "2024-01-16T14:45:00Z",
    updatedAt: "2024-01-16T14:45:00Z",
    status: "Pending",
    items: [
      {
        id: 3,
        product: {
          id: 3,
          productCode: "PROD003",
          productBrand: "Sample Product 3",
        },
        quantity: 20,
        unitPrice: 250,
        totalPrice: 5000,
        batchNumber: "BATCH003",
      },
    ],
  },
];

const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: "ABC Suppliers Pvt. Ltd.",
    contactPerson: "John Doe",
    phone: "+91 9876543210",
    email: "john@abcsuppliers.com",
    gstin: "27ABCDE1234F1Z5",
  },
  {
    id: 2,
    name: "XYZ Traders",
    contactPerson: "Jane Smith",
    phone: "+91 9876543211",
    email: "jane@xyztraders.com",
    gstin: "27XYZAB1234F1Z6",
  },
  {
    id: 3,
    name: "Global Distributors",
    contactPerson: "Robert Johnson",
    phone: "+91 9876543212",
    email: "robert@globaldist.com",
    gstin: "27GLBAL1234F1Z7",
  },
];

const mockProducts = [
  { id: 1, productCode: "PROD001", productBrand: "Sample Product 1", price: 150.5 },
  { id: 2, productCode: "PROD002", productBrand: "Sample Product 2", price: 299.99 },
  { id: 3, productCode: "PROD003", productBrand: "Sample Product 3", price: 250 },
];

// Purchase Form Modal Component
interface PurchaseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPurchase?: Purchase | null;
  onSave: (data: PurchaseFormData, id?: number) => Promise<void>;
  isSubmitting?: boolean;
}

function PurchaseFormModal({
  open,
  onOpenChange,
  editingPurchase,
  onSave,
  isSubmitting = false,
}: PurchaseFormModalProps) {
  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema) as any,
    defaultValues,
  });

  const items = form.watch("items");
  const discountPercent = form.watch("discountPercent");
  const gstAmount = form.watch("gstAmount");

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const discountAmount = subtotal * (discountPercent / 100);
    const amountAfterDiscount = subtotal - discountAmount;
    const finalAmount = amountAfterDiscount + gstAmount;

    return {
      subtotal,
      discountAmount,
      amountAfterDiscount,
      finalAmount,
    };
  };

  const totals = calculateTotals();

  // Load sample data
  const loadSampleData = () => {
    form.reset(samplePurchaseData);
    toast.success("Sample data loaded", {
      description: "Fill in real data before submitting.",
    });
  };

  // Reset form when editingPurchase changes
  useEffect(() => {
    if (editingPurchase) {
      form.reset({
        invoiceId: editingPurchase.invoiceId,
        supplierId: editingPurchase.supplier.id,
        invoiceDate: editingPurchase.invoiceDate,
        items: editingPurchase.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          batchNumber: item.batchNumber || "",
        })),
        discountPercent: editingPurchase.discountPercent,
        gstAmount: editingPurchase.gstAmount,
        remarks: editingPurchase.remarks,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [editingPurchase, form]);

  // Handle item changes
  const handleItemChange = (
    index: number,
    field: keyof PurchaseFormData["items"][0],
    value: any
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    form.setValue("items", updatedItems);
  };

  // Add new item row
  const addItemRow = () => {
    const newItem: PurchaseFormData["items"][0] = {
      productId: 0,
      quantity: 1,
      unitPrice: 0,
      batchNumber: "",
    };
    form.setValue("items", [...items, newItem]);
  };

  // Remove item row
  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      form.setValue("items", updatedItems);
    }
  };

  const onSubmit = async (data: PurchaseFormData) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[90vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              {editingPurchase ? "Edit Purchase" : "Add New Purchase"}
            </DialogTitle>

            {!editingPurchase && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadSampleData}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Load Sample Data
              </Button>
            )}
          </div>

          <DialogDescription>
            {editingPurchase
              ? "Update purchase details and items"
              : "Add a new purchase to your records"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Basic Info */}
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="invoiceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Invoice ID *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., INV-2024-00123"
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
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Supplier *
                          </FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            value={field.value?.toString() || ""}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select supplier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockSuppliers.map((supplier) => (
                                <SelectItem
                                  key={supplier.id}
                                  value={supplier.id.toString()}
                                >
                                  <div className="flex flex-col">
                                    <span>{supplier.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {supplier.contactPerson} • {supplier.phone}
                                    </span>
                                  </div>
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
                      name="invoiceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Invoice Date *
                          </FormLabel>
                          <FormControl>
                            <CustomDateInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="dd/mm/yyyy or select"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Column 2: Financial Details */}
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Details
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="discountPercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Discount (%)
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
                      name="gstAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            GST Amount *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                ₹
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                className="pl-8"
                                disabled={isSubmitting}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Financial Summary */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">
                        Financial Summary
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Discount ({discountPercent}%):</span>
                          <span className="font-semibold text-red-600">
                            -₹{totals.discountAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Amount after Discount:</span>
                          <span className="font-semibold">
                            ₹{totals.amountAfterDiscount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST Amount:</span>
                          <span className="font-semibold text-green-600">
                            +₹{gstAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-bold text-lg">
                          <span>Final Amount:</span>
                          <span className="text-primary">
                            ₹{totals.finalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Remarks */}
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Information
                  </h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Remarks</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter any additional remarks or notes"
                              className="min-h-[120px]"
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
              </div>
            </div>

            {/* Purchase Items Section */}
            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Purchase Items</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add products to this purchase order
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemRow}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 border rounded-lg overflow-hidden"
                  >
                    <div className="bg-muted/50 px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <div className="text-sm font-medium">
                            Item #{index + 1}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemRow(index)}
                            disabled={items.length === 1 || isSubmitting}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Product Selection */}
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Product *
                          </label>
                          <Select
                            value={item.productId.toString()}
                            onValueChange={(value) =>
                              handleItemChange(index, "productId", parseInt(value))
                            }
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockProducts.map((product) => (
                                <SelectItem
                                  key={product.id}
                                  value={product.id.toString()}
                                >
                                  <div className="flex flex-col">
                                    <span>{product.productBrand}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {product.productCode} • ₹{product.price}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Quantity *
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Unit Price */}
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Unit Price *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                              ₹
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="pl-8"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>

                        {/* Batch Number */}
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Batch Number
                          </label>
                          <Input
                            value={item.batchNumber}
                            onChange={(e) =>
                              handleItemChange(index, "batchNumber", e.target.value)
                            }
                            placeholder="Optional"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      {/* Item Summary */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Total for this item:
                          </div>
                          <div className="text-lg font-bold">
                            ₹{(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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
  );
}

// Main Purchase Page Component
export default function Purchase() {
  // State for purchases
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    invoiceId: "",
    supplier: "all" as string | "all",
    minAmount: "",
    maxAmount: "",
    invoiceDate: undefined as Date | undefined,
    status: "all" as "all" | "Pending" | "Paid" | "Partially Paid" | "Cancelled",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(mockPurchases.length);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Local state for immediate input values
  const [searchInput, setSearchInput] = useState<string>("");
  const [invoiceIdInput, setInvoiceIdInput] = useState<string>("");
  const [minAmountInput, setMinAmountInput] = useState<string>("");
  const [maxAmountInput, setMaxAmountInput] = useState<string>("");
  const [invoiceDateInput, setInvoiceDateInput] = useState<string>("");

  // Create debounced filter functions
  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedSetInvoiceId = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, invoiceId: value }));
  }, 300);

  const debouncedSetMinAmount = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, minAmount: value }));
  }, 300);

  const debouncedSetMaxAmount = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, maxAmount: value }));
  }, 300);

  // Handle input changes with debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  const handleInvoiceIdChange = (value: string) => {
    setInvoiceIdInput(value);
    debouncedSetInvoiceId(value);
  };

  const handleMinAmountChange = (value: string) => {
    setMinAmountInput(value);
    debouncedSetMinAmount(value);
  };

  const handleMaxAmountChange = (value: string) => {
    setMaxAmountInput(value);
    debouncedSetMaxAmount(value);
  };

  const handleInvoiceDateInputChange = (value: string) => {
    setInvoiceDateInput(value);
    const parsedDate = parseDateFromString(value);
    if (parsedDate) {
      setFilters((prev) => ({ ...prev, invoiceDate: parsedDate }));
    } else if (value === "") {
      setFilters((prev) => ({ ...prev, invoiceDate: undefined }));
    }
  };

  const handleInvoiceDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, invoiceDate: date }));
    if (date) {
      setInvoiceDateInput(formatDateToDisplay(date));
    } else {
      setInvoiceDateInput("");
    }
  };

  // Handle filter changes
  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      invoiceId: "",
      supplier: "all",
      minAmount: "",
      maxAmount: "",
      invoiceDate: undefined,
      status: "all",
    });
    setSearchInput("");
    setInvoiceIdInput("");
    setMinAmountInput("");
    setMaxAmountInput("");
    setInvoiceDateInput("");
  };

  // Clear specific filter
  const clearFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "supplier" || filterName === "status"
          ? "all"
          : filterName === "invoiceDate"
            ? undefined
            : "",
    }));

    switch (filterName) {
      case "search":
        setSearchInput("");
        break;
      case "invoiceId":
        setInvoiceIdInput("");
        break;
      case "minAmount":
        setMinAmountInput("");
        break;
      case "maxAmount":
        setMaxAmountInput("");
        break;
      case "invoiceDate":
        setInvoiceDateInput("");
        break;
    }
  };

  // Filter purchases based on current filters
  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matches =
          purchase.invoiceId.toLowerCase().includes(searchLower) ||
          purchase.supplier.name.toLowerCase().includes(searchLower) ||
          purchase.remarks.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      // Invoice ID filter
      if (filters.invoiceId && !purchase.invoiceId.includes(filters.invoiceId)) {
        return false;
      }

      // Supplier filter
      if (filters.supplier !== "all" && purchase.supplier.id.toString() !== filters.supplier) {
        return false;
      }

      // Amount range filter
      if (filters.minAmount && purchase.finalAmount < parseFloat(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && purchase.finalAmount > parseFloat(filters.maxAmount)) {
        return false;
      }

      // Invoice date filter
      if (filters.invoiceDate) {
        const purchaseDate = new Date(purchase.invoiceDate);
        const filterDate = new Date(filters.invoiceDate);
        if (
          purchaseDate.getDate() !== filterDate.getDate() ||
          purchaseDate.getMonth() !== filterDate.getMonth() ||
          purchaseDate.getFullYear() !== filterDate.getFullYear()
        ) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== "all" && purchase.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [purchases, filters]);

  // Update pagination based on filtered purchases
  useEffect(() => {
    setTotalItems(filteredPurchases.length);
    setTotalPages(Math.ceil(filteredPurchases.length / itemsPerPage));
  }, [filteredPurchases, itemsPerPage]);

  // Get current page purchases
  const currentPurchases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPurchases.slice(startIndex, endIndex);
  }, [filteredPurchases, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Format date for display
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Handle Add Purchase
  const handleAddPurchase = () => {
    setEditingPurchase(null);
    setIsModalOpen(true);
  };

  // Handle Edit Purchase
  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsModalOpen(true);
  };

  // Handle Delete Purchase
  const confirmDeletePurchase = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setDeleteOpen(true);
  };

  const handleDeletePurchase = async () => {
    if (purchaseToDelete) {
      try {
        // In real implementation, call API to delete
        setPurchases(purchases.filter(p => p.id !== purchaseToDelete.id));
        toast.success("Purchase deleted successfully!");
      } catch (error: any) {
        toast.error("Failed to delete purchase", {
          description: "Please try again",
        });
      } finally {
        setPurchaseToDelete(null);
        setDeleteOpen(false);
      }
    }
  };

  // Handle Save Purchase
  const handleSavePurchase = async (data: PurchaseFormData, id?: number) => {
    setIsSubmitting(true);

    try {
      if (id) {
        // Update existing purchase
        // In real implementation, call API to update
        const updatedPurchase: Purchase = {
          ...mockPurchases[0], // Simplified for demo
          id,
          invoiceId: data.invoiceId,
          supplier: mockSuppliers.find(s => s.id === data.supplierId) || mockSuppliers[0],
          amount: data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
          gstAmount: data.gstAmount,
          finalAmount: data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) +
            data.gstAmount - (data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * data.discountPercent / 100),
          discountPercent: data.discountPercent,
          remarks: data.remarks || "",
          invoiceDate: data.invoiceDate,
          updatedAt: new Date().toISOString(),
        };

        setPurchases(purchases.map(p => p.id === id ? updatedPurchase : p));
        toast.success("Purchase updated successfully!");
      } else {
        // Add new purchase
        const newPurchase: Purchase = {
          id: purchases.length + 1,
          invoiceId: data.invoiceId,
          supplier: mockSuppliers.find(s => s.id === data.supplierId) || mockSuppliers[0],
          amount: data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
          gstAmount: data.gstAmount,
          finalAmount: data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) +
            data.gstAmount - (data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * data.discountPercent / 100),
          discountPercent: data.discountPercent,
          remarks: data.remarks || "",
          invoiceDate: data.invoiceDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "Pending",
          items: data.items.map((item, index) => ({
            id: index + 1,
            product: mockProducts.find(p => p.id === item.productId) || mockProducts[0],
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            batchNumber: item.batchNumber,
          })),
        };

        setPurchases([newPurchase, ...purchases]);
        toast.success("Purchase created successfully!");
      }

      setIsModalOpen(false);
    } catch (error: any) {
      toast.error("Failed to save purchase", {
        description: "Please try again",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.info("Refreshing purchase data...");
    }, 1000);
  };

  // Active filters count
  const activeFiltersCount =
    Object.entries(filters).filter(
      ([key, value]) =>
        key !== "search" &&
        value &&
        value !== "all" &&
        !(value instanceof Date)
    ).length + (filters.invoiceDate ? 1 : 0);

  // Calculate start and end index for display
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <>
      <motion.div
        className="min-h-screen bg-background p-3"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-8xl mx-auto">
          {/* Header */}
          <motion.div
            className="flex flex-col gap-6 mb-6 w-full"
            variants={headerVariants}
          >
            <div className="flex justify-between gap-4">
              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold text-heading">
                  Purchase Management
                </h1>
                <motion.p
                  className="text-muted-foreground mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Manage and track your purchase orders
                </motion.p>
              </div>

              {/* Search Bar */}
              <motion.div
                className="relative w-100"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Search className="absolute left-3 top-6 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by invoice ID, supplier, or remarks..."
                  className="pl-10 py-6 text-base"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => {
                      setSearchInput("");
                      handleFilterChange("search", "");
                    }}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>

              {/* Action Buttons */}
              <motion.div className="flex flex-wrap items-center gap-3">
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </motion.div>

                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={handleAddPurchase}
                    className="gap-2 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                    New Purchase
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Filter Section */}
          <motion.div className="mb-2" variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardContent className="p-1">
                <div className="flex flex-col gap-4 p-1">
                  {/* Filter Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Filters</h3>
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFiltersCount} active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-8 text-muted-foreground"
                          disabled={isLoading}
                        >
                          Clear all
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="h-8"
                        disabled={isLoading}
                      >
                        {showFilters ? "Hide" : "Show"} Filters
                      </Button>
                    </div>
                  </div>

                  {/* Filter Controls */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                          {/* Invoice ID Filter */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="invoiceId"
                              className="text-sm font-medium"
                            >
                              Invoice ID
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="invoiceId"
                                placeholder="Enter invoice ID"
                                value={invoiceIdInput}
                                onChange={(e) =>
                                  handleInvoiceIdChange(e.target.value)
                                }
                                className="flex-1"
                              />
                              {invoiceIdInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => {
                                    setInvoiceIdInput("");
                                    clearFilter("invoiceId");
                                  }}
                                  disabled={isLoading}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Supplier Filter */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="supplier"
                              className="text-sm font-medium"
                            >
                              Supplier
                            </Label>
                            <Select
                              value={filters.supplier}
                              onValueChange={(value) =>
                                handleFilterChange("supplier", value)
                              }
                              disabled={isLoading}
                            >
                              <SelectTrigger id="supplier">
                                <SelectValue placeholder="Select supplier" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Suppliers</SelectItem>
                                {mockSuppliers.map((supplier) => (
                                  <SelectItem
                                    key={supplier.id}
                                    value={supplier.id.toString()}
                                  >
                                    {supplier.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Amount Range Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Amount Range
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Min"
                                type="number"
                                value={minAmountInput}
                                onChange={(e) =>
                                  handleMinAmountChange(e.target.value)
                                }
                                className="flex-1"
                              />
                              <Input
                                placeholder="Max"
                                type="number"
                                value={maxAmountInput}
                                onChange={(e) =>
                                  handleMaxAmountChange(e.target.value)
                                }
                                className="flex-1"
                              />
                            </div>
                          </div>

                          {/* Status Filter */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="status"
                              className="text-sm font-medium"
                            >
                              Status
                            </Label>
                            <Select
                              value={filters.status}
                              onValueChange={(
                                value: "all" | "Pending" | "Paid" | "Partially Paid" | "Cancelled",
                              ) => handleFilterChange("status", value)}
                              disabled={isLoading}
                            >
                              <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Invoice Date */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Invoice Date
                            </Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  value={invoiceDateInput}
                                  onChange={(e) =>
                                    handleInvoiceDateInputChange(e.target.value)
                                  }
                                  placeholder="dd/mm/yyyy or select"
                                  className="pr-10"
                                />
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                                    >
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="end"
                                  >
                                    <CalendarComponent
                                      mode="single"
                                      selected={filters.invoiceDate}
                                      onSelect={handleInvoiceDateSelect}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {invoiceDateInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => {
                                    setInvoiceDateInput("");
                                    clearFilter("invoiceDate");
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Count */}
          <motion.div
            className="flex justify-between items-center mb-4"
            variants={itemVariants}
          >
            <p className="text-sm text-muted-foreground">
              Showing {startIndex} to {endIndex} of {totalItems} purchases
              {activeFiltersCount > 0 && " (filtered)"}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Items per page:
                </div>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Purchase Table */}
          <motion.div variants={itemVariants}>
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="font-semibold">Invoice ID</TableHead>
                        <TableHead className="font-semibold">Supplier</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">GST Amount</TableHead>
                        <TableHead className="font-semibold">Final Amount</TableHead>
                        <TableHead className="font-semibold">Discount %</TableHead>
                        <TableHead className="font-semibold">Remarks</TableHead>
                        <TableHead className="font-semibold">Invoice Date</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Created & Updated</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.tr
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <TableCell
                              colSpan={11}
                              className="text-center py-12"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">
                                  Loading purchases...
                                </p>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ) : currentPurchases.length === 0 ? (
                          <motion.tr
                            key="no-data"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <TableCell
                              colSpan={11}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <motion.div
                                className="flex flex-col items-center justify-center"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                              >
                                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-2" />
                                <p>No purchases found matching your filters.</p>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    variant="link"
                                    onClick={clearFilters}
                                    className="mt-2"
                                  >
                                    Clear all filters
                                  </Button>
                                </motion.div>
                              </motion.div>
                            </TableCell>
                          </motion.tr>
                        ) : (
                          currentPurchases.map((purchase, index) => (
                            <motion.tr
                              key={purchase.id}
                              custom={index}
                              initial="hidden"
                              animate="visible"
                              whileHover="hover"
                              variants={rowVariants}
                              className="group border-1"
                              layout
                              transition={{
                                layout: { duration: 0.3 },
                              }}
                            >
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="font-mono font-medium text-primary">
                                  {purchase.invoiceId}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div>
                                  <p className="font-medium">{purchase.supplier.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {purchase.supplier.contactPerson}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">
                                    ₹{purchase.amount.toFixed(2)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  ₹{purchase.gstAmount.toFixed(2)}
                                </Badge>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="font-bold text-green-700">
                                  ₹{purchase.finalAmount.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                {purchase.discountPercent > 0 ? (
                                  <Badge variant="outline" className="bg-red-50 text-red-700">
                                    {purchase.discountPercent}%
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer max-w-xs">
                                <div className="line-clamp-2 text-sm">
                                  {purchase.remarks || "No remarks"}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                {formatDateTime(purchase.invoiceDate)}
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <motion.div
                                  variants={badgeVariants}
                                  whileHover="hover"
                                >
                                  <Badge
                                    variant={
                                      purchase.status === "Paid"
                                        ? "default"
                                        : purchase.status === "Pending"
                                          ? "secondary"
                                          : purchase.status === "Partially Paid"
                                            ? "outline"
                                            : "destructive"
                                    }
                                    className={
                                      purchase.status === "Paid"
                                        ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                        : purchase.status === "Pending"
                                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400"
                                          : purchase.status === "Partially Paid"
                                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                                            : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                    }
                                  >
                                    {purchase.status}
                                  </Badge>
                                </motion.div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="space-y-1">
                                  <div className="flex items-center">
                                    <span className="text-xs font-medium text-green-400">
                                      Created:
                                    </span>
                                    <p className="text-xs text-muted-foreground ml-1">
                                      {formatDateTime(purchase.createdAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs font-medium text-orange-400">
                                      Updated:
                                    </span>
                                    <p className="text-xs text-muted-foreground ml-1">
                                      {formatDateTime(purchase.updatedAt)}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30">
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditPurchase(purchase)}
                                    className="h-8 w-8 hover:bg-green-100"
                                    disabled={isLoading}
                                  >
                                    <Edit className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => confirmDeletePurchase(purchase)}
                                    className="h-8 w-8 hover:bg-red-100"
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Custom Pagination */}
          {!isLoading && currentPurchases.length > 0 && totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Purchase Form Modal */}
      <PurchaseFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingPurchase={editingPurchase}
        onSave={handleSavePurchase}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <CustomAlert
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        mainText="Delete Purchase"
        subText={
          purchaseToDelete
            ? `Are you sure you want to delete purchase "${purchaseToDelete.invoiceId}"? This action cannot be undone.`
            : "This action cannot be undone."
        }
        nextButtonText="Delete"
        cancelButtonText="Cancel"
        onNext={handleDeletePurchase}
        variant="destructive"
        showCancel={true}
        className="sm:max-w-[425px]"
      />
    </>
  );
}