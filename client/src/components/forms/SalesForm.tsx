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
  User,
  MapPin,
  Truck,
  UserCog,
  ChevronsUpDown,
  Check,
  IndianRupee,
  Layers,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CustomDateInput } from "../custom_ui/CustomDateInput";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SalesFormData } from "@/types/sales";
import BatchSelectionModal from "./BatchSelection";

// Mock data
const mockAreas = [
  { id: 1, name: "Mumbai Central", code: "MUM-C" },
  { id: 2, name: "Andheri East", code: "AND-E" },
  { id: 3, name: "Bandra West", code: "BAN-W" },
  { id: 4, name: "Thane", code: "THN" },
  { id: 5, name: "Pune", code: "PUN" },
];

const mockCustomers = [
  {
    id: 1,
    name: "Reliance Fresh",
    code: "C001",
    address: "Mumbai Central",
    areaId: 1,
  },
  { id: 2, name: "D-Mart", code: "C002", address: "Andheri East", areaId: 2 },
  {
    id: 3,
    name: "More Supermarket",
    code: "C003",
    address: "Bandra West",
    areaId: 3,
  },
  { id: 4, name: "Big Bazaar", code: "C004", address: "Thane", areaId: 4 },
  { id: 5, name: "Star Bazaar", code: "C005", address: "Pune", areaId: 5 },
];

const mockVans = [
  {
    id: 1,
    name: "Delivery Van 1",
    number: "MH01AB1234",
    driverName: "Rajesh Kumar",
  },
  {
    id: 2,
    name: "Delivery Van 2",
    number: "MH01CD5678",
    driverName: "Suresh Patel",
  },
  {
    id: 3,
    name: "Delivery Van 3",
    number: "MH01EF9012",
    driverName: "Mahesh Sharma",
  },
  {
    id: 4,
    name: "Sales Van 1",
    number: "MH02GH3456",
    driverName: "Ramesh Singh",
  },
  {
    id: 5,
    name: "Sales Van 2",
    number: "MH02IJ7890",
    driverName: "Vikram Yadav",
  },
];

const mockSalesmen = [
  { id: 1, name: "Amit Sharma", code: "S001", areaId: 1 },
  { id: 2, name: "Rahul Verma", code: "S002", areaId: 2 },
  { id: 3, name: "Sandeep Patel", code: "S003", areaId: 3 },
  { id: 4, name: "Vikas Singh", code: "S004", areaId: 4 },
  { id: 5, name: "Raj Kumar", code: "S005", areaId: 5 },
];

const mockProducts = [
  {
    id: 1,
    productCode: "G6",
    description: "ECLARIS JAR",
    price: 130.0,
    gstRate: 5,
  },
  {
    id: 2,
    productCode: "10087",
    description: "CRUNCHY MUNCHY S",
    price: 4.0,
    gstRate: 5,
  },
  {
    id: 3,
    productCode: "K1",
    description: "KRACK IT S RS",
    price: 4.2,
    gstRate: 5,
  },
  {
    id: 4,
    productCode: "M50",
    description: "GLUCO-G S RS",
    price: 4.5,
    gstRate: 5,
  },
  {
    id: 5,
    productCode: "G13",
    description: "LOLLYPOP BIG JAR S",
    price: 170.0,
    gstRate: 5,
  },
];

// Define the schema for form validation
const salesSchema = z.object({
  // Header Information
  invoiceDate: z.string().min(1, "Invoice date is required"),
  areaId: z.coerce.number().min(1, "Area is required"),
  customerId: z.coerce.number().min(1, "Customer is required"),
  vanId: z.coerce.number().min(1, "Van is required"),
  salesmanId: z.coerce.number().min(1, "Salesman is required"),
  address: z.string().min(1, "Address is required"),
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

interface SalesFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSales?: any | null;
  onSave: (data: SalesFormData, id?: number) => Promise<void>;
  isSubmitting?: boolean;
}

// Initial form values
const defaultValues: SalesFormData = {
  invoiceDate: new Date().toISOString().split("T")[0],
  areaId: 0,
  customerId: 0,
  vanId: 0,
  salesmanId: 0,
  address: "",
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

// Sample data for testing
const sampleData: SalesFormData = {
  invoiceDate: "2024-01-15",
  areaId: 1,
  customerId: 1,
  vanId: 1,
  salesmanId: 1,
  address: "Mumbai Central",
  invoiceNo: "S501622",
  gstDetails: "Against GST",
  items: [
    {
      productId: 1,
      productCode: "G6",
      description: "ECLARIS JAR",
      rate: 130.0,
      aQty: 10,
      mQty: 10,
      totalAmount: 1300.0,
      taxRate: 5,
      taxAmount: 65.0,
      sch1Percent: 0,
      sch1Amount: 0,
      sch2Percent: 0,
      sch2Amount: 0,
    },
    {
      productId: 2,
      productCode: "10087",
      description: "CRUNCHY MUNCHY S",
      rate: 4.0,
      aQty: 1200,
      mQty: 1200,
      totalAmount: 4800.0,
      taxRate: 5,
      taxAmount: 240.0,
      sch1Percent: 0,
      sch1Amount: 0,
      sch2Percent: 0,
      sch2Amount: 0,
    },
  ],
  remarks: "",
  grossAmount: 6100.0,
  boxUnit: 20.0,
  cessInsurance: 0,
  scheme1: 0,
  discountPercent: 5,
  tax: 305.0,
  amountAdd: 0,
  creditAmount: 0,
  finalAmount: 6405.0,
};

export default function SalesForm({
  open,
  onOpenChange,
  editingSales,
  onSave,
  isSubmitting = false,
}: SalesFormModalProps) {
  // State for dropdown open/close
  const [areaOpen, setAreaOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [vanOpen, setVanOpen] = useState(false);
  const [salesmanOpen, setSalesmanOpen] = useState(false);
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
  } | null>(null);

  const form = useForm<SalesFormData>({
    resolver: zodResolver(salesSchema) as any,
    defaultValues,
  });

  // Watch items for UI updates
  const items = form.watch("items");
  const areaId = form.watch("areaId");
  const customerId = form.watch("customerId");

  // Calculate totals whenever items change
  useEffect(() => {
    const calculateTotals = () => {
      const grossAmount = items.reduce(
        (sum, item) => sum + item.totalAmount,
        0,
      );
      const tax = items.reduce((sum, item) => sum + item.taxAmount, 0);

      // Get other values from form
      const boxUnit = form.getValues("boxUnit") || 0;
      const cessInsurance = form.getValues("cessInsurance") || 0;
      const scheme1 = form.getValues("scheme1") || 0;
      const discountPercent = form.getValues("discountPercent") || 0;
      const amountAdd = form.getValues("amountAdd") || 0;
      const creditAmount = form.getValues("creditAmount") || 0;

      // Calculate final amount
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

      // Update form values
      form.setValue("grossAmount", parseFloat(grossAmount.toFixed(2)));
      form.setValue("tax", parseFloat(tax.toFixed(2)));
      form.setValue(
        "finalAmount",
        Math.max(0, parseFloat(finalAmount.toFixed(2))),
      );
    };

    calculateTotals();
  }, [items, form]);

  // Load sample data into form
  const loadSampleData = () => {
    form.reset(sampleData);
    toast.success("Sample data loaded", {
      description: "Fill in real data before submitting.",
    });
  };

  // Reset form when editingSales changes
  useEffect(() => {
    if (editingSales) {
      form.reset(editingSales);
    } else {
      form.reset(defaultValues);
    }
  }, [editingSales, form]);

  // Helper functions
  const findAreaName = (areaId: number) => {
    const area = mockAreas.find((a) => a.id === areaId);
    return area ? `${area.name} (${area.code})` : "Select area";
  };

  const findCustomerName = (customerId: number) => {
    const customer = mockCustomers.find((c) => c.id === customerId);
    return customer ? `${customer.name} (${customer.code})` : "Select customer";
  };

  const findVanName = (vanId: number) => {
    const van = mockVans.find((v) => v.id === vanId);
    return van ? `${van.name} (${van.number})` : "Select van";
  };

  const findSalesmanName = (salesmanId: number) => {
    const salesman = mockSalesmen.find((s) => s.id === salesmanId);
    return salesman ? `${salesman.name} (${salesman.code})` : "Select salesman";
  };

  const findProductName = (productId: number) => {
    const product = mockProducts.find((p) => p.id === productId);
    return product
      ? `${product.productCode}, ${product.description}`
      : "Select product";
  };

  // Handle area change to filter customers and salesmen
  useEffect(() => {
    if (areaId) {
      // Reset customer and salesman if they don't belong to selected area
      const currentCustomer = mockCustomers.find((c) => c.id === customerId);
      if (currentCustomer && currentCustomer.areaId !== areaId) {
        form.setValue("customerId", 0);
        form.setValue("address", "");
      }

      const currentSalesman = mockSalesmen.find(
        (s) => s.id === form.getValues("salesmanId"),
      );
      if (currentSalesman && currentSalesman.areaId !== areaId) {
        form.setValue("salesmanId", 0);
      }
    }
  }, [areaId, customerId, form]);

  // Handle customer change to update address
  useEffect(() => {
    if (customerId) {
      const customer = mockCustomers.find((c) => c.id === customerId);
      if (customer) {
        form.setValue("address", customer.address);
      }
    }
  }, [customerId, form]);

  // Handle item changes
  const handleItemChange = (
    index: number,
    field: keyof SalesFormData["items"][0],
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

      // Calculate total amount and tax
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

    form.setValue("items", updatedItems);
  };

  // Handle batch selection from modal
  const handleBatchSelect = (batch: any, aQty: number, mQty: number) => {
    if (pendingBatchSelection) {
      const { index } = pendingBatchSelection;
      const updatedItems = [...items];
      const item = updatedItems[index];

      // Update item with batch information
      updatedItems[index] = {
        ...item,
        rate: batch.sRate,
        aQty: aQty,
        mQty: mQty,
        totalAmount: batch.sRate * aQty,
        taxAmount: batch.sRate * aQty * (item.taxRate / 100),
      };

      form.setValue("items", updatedItems);

      toast.success(`Batch applied to ${item.productCode}`, {
        description: `Rate: ₹${batch.sRate.toFixed(2)} | Qty: A=${aQty}, M=${mQty}`,
      });

      // Clear pending selection
      setPendingBatchSelection(null);
    }
  };

  // Handle batch modal close
  const handleBatchModalClose = () => {
    setBatchModalOpen(false);
    // Don't clear pendingBatchSelection immediately to allow animation
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
    setPendingBatchSelection({
      index,
      productId: item.productId,
      productCode: item.productCode || "",
      description: item.description || "",
    });
    setBatchModalOpen(true);
  };

  // Add new product row
  const addProductRow = () => {
    const newItem: SalesFormData["items"][0] = {
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

  // Handle product selection - UPDATED TO OPEN BATCH MODAL IMMEDIATELY
  const handleProductSelect = (index: number, productId: number) => {
    const product = mockProducts.find((p) => p.id === productId);
    if (product) {
      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        productId: product.id,
        productCode: product.productCode,
        description: product.description,
        rate: product.price,
        taxRate: product.gstRate,
        aQty: 1,
        mQty: 1,
        totalAmount: product.price,
        taxAmount: product.price * (product.gstRate / 100),
      };
      form.setValue("items", updatedItems);

      // Close the product dropdown
      setProductOpen(false);
      setActiveProductIndex(null);

      // Set pending batch selection and open batch modal
      setPendingBatchSelection({
        index,
        productId: product.id,
        productCode: product.productCode,
        description: product.description,
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

  const onSubmit = async (data: SalesFormData) => {
    console.log("Form submitted with data:", data);

    try {
      await onSave(data, editingSales?.id);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Failed to save sales. Please try again.");
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
                {editingSales ? "Edit Sales Invoice" : "Add New Sales Invoice"}
              </DialogTitle>

              {!editingSales && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadSampleData}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Load Sample Data
                </Button>
              )}
            </div>

            <DialogDescription>
              {editingSales
                ? "Update sales invoice details"
                : "Create a new sales invoice"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onError)}
              className="space-y-6"
            >
              {/* Header Section - Full Row */}
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Invoice Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

                  {/* Area Dropdown */}
                  <FormField
                    control={form.control}
                    name="areaId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm">Area *</FormLabel>
                        <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={areaOpen}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground",
                                )}
                                disabled={isSubmitting}
                              >
                                {field.value
                                  ? findAreaName(field.value)
                                  : "Select area"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search areas..." />
                              <CommandList>
                                <CommandEmpty>No area found.</CommandEmpty>
                                <CommandGroup>
                                  {mockAreas.map((area) => (
                                    <CommandItem
                                      key={area.id}
                                      value={`${area.id} ${area.name} ${area.code}`}
                                      onSelect={() => {
                                        field.onChange(area.id);
                                        setAreaOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span>{area.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          Code: {area.code}
                                        </span>
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          area.id === field.value
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

                  {/* Customer Dropdown */}
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm">Customer *</FormLabel>
                        <Popover
                          open={customerOpen}
                          onOpenChange={setCustomerOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={customerOpen}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground",
                                )}
                                disabled={isSubmitting || !areaId}
                              >
                                {field.value
                                  ? findCustomerName(field.value)
                                  : areaId
                                    ? "Select customer"
                                    : "Select area first"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search customers..." />
                              <CommandList>
                                <CommandEmpty>No customer found.</CommandEmpty>
                                <CommandGroup>
                                  {mockCustomers
                                    .filter(
                                      (customer) =>
                                        !areaId || customer.areaId === areaId,
                                    )
                                    .map((customer) => (
                                      <CommandItem
                                        key={customer.id}
                                        value={`${customer.id} ${customer.name} ${customer.code}`}
                                        onSelect={() => {
                                          field.onChange(customer.id);
                                          setCustomerOpen(false);
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span>{customer.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            Code: {customer.code} | Area:{" "}
                                            {
                                              mockAreas.find(
                                                (a) => a.id === customer.areaId,
                                              )?.name
                                            }
                                          </span>
                                        </div>
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            customer.id === field.value
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

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Address *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Customer address"
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

                  {/* Van Dropdown */}
                  <FormField
                    control={form.control}
                    name="vanId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm">Van *</FormLabel>
                        <Popover open={vanOpen} onOpenChange={setVanOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={vanOpen}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground",
                                )}
                                disabled={isSubmitting}
                              >
                                {field.value
                                  ? findVanName(field.value)
                                  : "Select van"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search vans..." />
                              <CommandList>
                                <CommandEmpty>No van found.</CommandEmpty>
                                <CommandGroup>
                                  {mockVans.map((van) => (
                                    <CommandItem
                                      key={van.id}
                                      value={`${van.id} ${van.name} ${van.number}`}
                                      onSelect={() => {
                                        field.onChange(van.id);
                                        setVanOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span>{van.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          Number: {van.number} | Driver:{" "}
                                          {van.driverName}
                                        </span>
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          van.id === field.value
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

                  {/* Salesman Dropdown */}
                  <FormField
                    control={form.control}
                    name="salesmanId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm">Salesman *</FormLabel>
                        <Popover
                          open={salesmanOpen}
                          onOpenChange={setSalesmanOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={salesmanOpen}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground",
                                )}
                                disabled={isSubmitting || !areaId}
                              >
                                {field.value
                                  ? findSalesmanName(field.value)
                                  : areaId
                                    ? "Select salesman"
                                    : "Select area first"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search salesmen..." />
                              <CommandList>
                                <CommandEmpty>No salesman found.</CommandEmpty>
                                <CommandGroup>
                                  {mockSalesmen
                                    .filter(
                                      (salesman) =>
                                        !areaId || salesman.areaId === areaId,
                                    )
                                    .map((salesman) => (
                                      <CommandItem
                                        key={salesman.id}
                                        value={`${salesman.id} ${salesman.name} ${salesman.code}`}
                                        onSelect={() => {
                                          field.onChange(salesman.id);
                                          setSalesmanOpen(false);
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span>{salesman.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            Code: {salesman.code} | Area:{" "}
                                            {
                                              mockAreas.find(
                                                (a) => a.id === salesman.areaId,
                                              )?.name
                                            }
                                          </span>
                                        </div>
                                        <Check
                                          className={cn(
                                            "ml-auto h-4 w-4",
                                            salesman.id === field.value
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
                              placeholder="e.g., S501622"
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
                      Add products to the sales invoice
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
                        <TableHead className="font-semibold">M. Qty</TableHead>
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
                                          {mockProducts.map((product) => (
                                            <CommandItem
                                              key={product.id}
                                              value={`${product.id} ${product.productCode} ${product.description}`}
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
                                                  {product.description}
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

                              {/* M. Qty */}
                              <TableCell>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="1"
                                    value={item.mQty}
                                    onChange={(e) =>
                                      handleItemChange(
                                        index,
                                        "mQty",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-20"
                                    disabled={isSubmitting}
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
                </div>
              </div>

              {/* Summary Section - Compact */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Remarks - Left Side */}
                  <div className="lg:col-span-1">
                    <FormField
                      control={form.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Remarks</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter any additional remarks..."
                              className="min-h-[80px]"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Summary - Right Side - Compact and Disabled */}
                  <div className="lg:col-span-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Row 1 */}
                      <FormField
                        control={form.control}
                        name="grossAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Gross</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                readOnly
                                disabled
                                className="h-8 text-sm"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="boxUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Box/Unit</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                readOnly
                                disabled
                                className="h-8 text-sm"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cessInsurance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">CESS/INS</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                readOnly
                                disabled
                                className="h-8 text-sm"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="scheme1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Scheme 1</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                readOnly
                                disabled
                                className="h-8 text-sm"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Row 2 */}
                      <FormField
                        control={form.control}
                        name="discountPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Disc %</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                readOnly
                                disabled
                                className="h-8 text-sm"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Tax</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                readOnly
                                disabled
                                className="h-8 text-sm"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="amountAdd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Add Amt</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                readOnly
                                disabled
                                className="h-8 text-sm"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="creditAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Credit</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                readOnly
                                disabled
                                className="h-8 text-sm"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Final Amount - Full Width */}
                      <div className="col-span-2 sm:col-span-4 mt-2">
                        <FormField
                          control={form.control}
                          name="finalAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-bold">
                                Final Amount
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    className="pl-10 h-10 text-lg font-bold"
                                    readOnly
                                    disabled
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
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
                    : editingSales
                      ? "Update Sales"
                      : "Create Sales"}
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
          onBatchSelect={handleBatchSelect}
        />
      )}
    </>
  );
}
