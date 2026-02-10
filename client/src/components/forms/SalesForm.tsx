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
  Calendar,
  Tag,
  Gift,
  Shield,
  CreditCard,
  DollarSign,
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
import { useActiveLists } from "@/hooks/useActiveLists";
import { format } from "date-fns";

// Mock product data (you might want to fetch this from Redux as well)
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
  invoiceDate: new Date().toISOString().split("T")[0],
  areaId: 1,
  customerId: 1,
  vanId: 1,
  salesmanId: 1,
  address: "Sample Address",
  invoiceNo: `S${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}001`,
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

  // Get data from Redux store
  const { areas, customers, salesmen, vans } = useActiveLists();

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

  // Helper functions using Redux data
  const findAreaName = (areaId: number) => {
    const area = areas.find((a) => a.id === areaId);
    return area
      ? `${area.name} (${area.city || area.state || "N/A"})`
      : "Select area";
  };

  const findCustomerName = (customerId: number) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer
      ? `${customer.companyName || customer.personName}`
      : "Select customer";
  };

  const findVanName = (vanId: number) => {
    const van = vans.find((v) => v.id === vanId);
    return van ? `${van.name} (${van.vehicleNo || "No Plate"})` : "Select van";
  };

  const findSalesmanName = (salesmanId: number) => {
    const salesman = salesmen.find((s) => s.id === salesmanId);
    return salesman ? `${salesman.name}` : "Select salesman";
  };

  const findProductName = (productId: number) => {
    const product = mockProducts.find((p) => p.id === productId);
    return product
      ? `${product.productCode}, ${product.description}`
      : "Select product";
  };

  // Handle area change (removed filtering logic for customers and salesmen)
  useEffect(() => {
    // We're removing the resetting of customer and salesman based on area
    // Customers and salesmen will now remain independent of area selection
    // This useEffect is kept for any other area-related logic if needed
  }, [areaId, form, areas]);

  // Handle customer change to update address
  useEffect(() => {
    if (customerId) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        form.setValue("address", customer.address || "");
      }
    }
  }, [customerId, form, customers]);

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
        description: `Rate: ₹${batch.sRate} | Qty: A=${aQty}, M=${mQty}`,
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

                  {/* Area Dropdown - Command Component */}
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
                                  {areas.map((area) => (
                                    <CommandItem
                                      key={area.id}
                                      value={`${area.id} ${area.name} ${area.city || ""}`}
                                      onSelect={() => {
                                        field.onChange(area.id);
                                        setAreaOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {area.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {area.city && `${area.city}, `}
                                          {area.state ||
                                            area.region ||
                                            area.description}
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

                  {/* Customer Dropdown - Command Component */}
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
                                disabled={isSubmitting}
                              >
                                {field.value
                                  ? findCustomerName(field.value)
                                  : "Select customer"}
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
                                  {customers.map((customer) => (
                                    <CommandItem
                                      key={customer.id}
                                      value={`${customer.id} ${customer.companyName || customer.personName} ${customer.phoneNo || ""}`}
                                      onSelect={() => {
                                        field.onChange(customer.id);
                                        setCustomerOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {customer.companyName ||
                                            customer.personName}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {customer.phoneNo &&
                                            `${customer.phoneNo} • `}
                                          {customer.city || customer.address}
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

                  {/* Van Dropdown - Command Component */}
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
                                  {vans.map((van) => (
                                    <CommandItem
                                      key={van.id}
                                      value={`${van.id} ${van.name} ${van.vehicleNo || ""}`}
                                      onSelect={() => {
                                        field.onChange(van.id);
                                        setVanOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {van.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {van.vehicleNo &&
                                            `Vehicle: ${van.vehicleNo} • `}
                                          {van.model && `Model: ${van.model}`}
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

                  {/* Salesman Dropdown - Command Component */}
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
                                disabled={isSubmitting}
                              >
                                {field.value
                                  ? findSalesmanName(field.value)
                                  : "Select salesman"}
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
                                  {salesmen.map((salesman) => (
                                    <CommandItem
                                      key={salesman.id}
                                      value={`${salesman.id} ${salesman.name} ${salesman.phoneNo || ""}`}
                                      onSelect={() => {
                                        field.onChange(salesman.id);
                                        setSalesmanOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {salesman.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {salesman.phoneNo &&
                                            `${salesman.phoneNo} • `}
                                          {salesman.email &&
                                            `${salesman.email} • `}
                                          {salesman.area}
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

              {/* Summary Section - Colorful and Formal */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Remarks - Left Side */}
                  <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                      <h4 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
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
                                className="min-h-[120px] bg-white border-blue-200 focus:border-blue-400"
                                {...field}
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-xs text-blue-600 mt-2">
                        Add any special instructions or notes for this invoice.
                      </p>
                    </div>
                  </div>

                  {/* Summary - Right Side - Colorful Grid */}
                  <div className="lg:col-span-3">
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-slate-200 shadow-sm">
                      <h4 className="font-semibold mb-4 text-slate-800 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Invoice Summary
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Gross Amount */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-emerald-700">
                              Gross Amount
                            </span>
                            <Tag className="h-3 w-3 text-emerald-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="grossAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-emerald-600" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white/80 border-emerald-200 text-emerald-700 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Box/Unit */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-amber-700">
                              Box/Unit
                            </span>
                            <Package className="h-3 w-3 text-amber-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="boxUnit"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-amber-600" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white/80 border-amber-200 text-amber-700 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* CESS/INS */}
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-3 border border-cyan-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-cyan-700">
                              CESS/INS
                            </span>
                            <Shield className="h-3 w-3 text-cyan-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="cessInsurance"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-cyan-600" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white/80 border-cyan-200 text-cyan-700 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Scheme 1 */}
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-purple-700">
                              Scheme 1
                            </span>
                            <Gift className="h-3 w-3 text-purple-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="scheme1"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-purple-600" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white/80 border-purple-200 text-purple-700 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Discount % */}
                        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-3 border border-rose-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-rose-700">
                              Discount %
                            </span>
                            <Percent className="h-3 w-3 text-rose-500" />
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
                                      className="h-8 bg-white/80 border-rose-200 text-rose-700 font-medium text-center"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Tax */}
                        <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg p-3 border border-sky-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-sky-700">
                              Tax Amount
                            </span>
                            <FileText className="h-3 w-3 text-sky-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="tax"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-sky-600" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white/80 border-sky-200 text-sky-700 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Add Amount */}
                        <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-lg p-3 border border-lime-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-lime-700">
                              Add Amount
                            </span>
                            <Plus className="h-3 w-3 text-lime-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="amountAdd"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-lime-600" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white/80 border-lime-200 text-lime-700 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Credit Amount */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-orange-700">
                              Credit Amount
                            </span>
                            <CreditCard className="h-3 w-3 text-orange-500" />
                          </div>
                          <FormField
                            control={form.control}
                            name="creditAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-orange-600" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white/80 border-orange-200 text-orange-700 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Final Amount - Full Width */}
                        <div className="col-span-2 md:col-span-4 mt-4">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 border border-blue-600 shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-white" />
                                <span className="text-lg font-bold text-white">
                                  Final Amount
                                </span>
                              </div>
                              <Badge className="bg-white/20 text-white hover:bg-white/30 border-0">
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
                                      <IndianRupee className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-white" />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        className="pl-12 h-14 text-2xl font-bold bg-white/10 text-white border-white/30 placeholder:text-white/60"
                                        readOnly
                                        disabled
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <p className="text-xs text-white/80 mt-3 flex items-center gap-1">
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

              <DialogFooter className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingSales
                      ? "Update Sales Invoice"
                      : "Create Sales Invoice"}
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
