import { useTheme } from "@/contexts/ThemeProvider";
import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
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
  Plus,
  Trash2,
  Percent,
  Package,
  Hash,
  FileText,
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
  MapPin,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { HoverDateInput } from "@/components/custom_ui/HoverDateInput";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SalesFormData } from "@/types/sales";
import BatchSelectionModal from "./BatchSelectionModal";
import { useActiveLists } from "@/hooks/useActiveLists";
import {
  gst_details,
  GST_DETAILS_DEFAULT_ID,
  normalizeGstDetailsValue,
} from "@/store/dropdown_data/gst_details";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// ----------------------------------------------------------------------
// Types & Interfaces (Local to component for clarity)
// ----------------------------------------------------------------------
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

interface Customer {
  id: number;
  companyName: string;
  personName: string;
  phoneNo: string;
  email: string;
  customerType: string | null;
  city: string | null;
  areaId: number | null;
  address: string;
  pincode: string | null;
  status: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------
// Updated Schema – added "phoneNo" for UI state only
// ----------------------------------------------------------------------
const salesSchema = z.object({
  invoiceDate: z.string().min(1, "Invoice date is required"),
  areaId: z.coerce.number().min(1, "Area is required"),
  customerId: z.coerce.number().min(1, "Customer is required"),
  vanId: z.coerce.number().min(1, "Van is required"),
  salesmanId: z.coerce.number().min(1, "Salesman is required"),
  address: z.string().min(1, "Address is required"),
  gstDetails: z.string().optional(),
  phoneNo: z.string().optional(), // UI Only field

  items: z
    .array(
      z.object({
        productId: z.coerce.number().min(1, "Product is required"),
        productCode: z.string().optional(),
        description: z.string().optional(),
        rate: z.coerce.number().min(0, "Rate must be positive"),
        aQty: z.coerce.number().min(0, "A. Qty must be positive").default(0),
        mQty: z.coerce.number().min(0, "M. Qty must be positive").default(0),
        unit: z.coerce.number().min(0, "Unit must be positive").default(0),
        fQty: z.coerce.number().min(0).default(0),
        DQty: z.coerce.number().min(0).default(0),
        totalAmount: z.coerce.number().min(0, "Total amount must be positive"),
        finalAmount: z.coerce.number().min(0, "Final amount must be positive"),
        taxRate: z.coerce
          .number()
          .min(0)
          .max(100, "Tax rate cannot exceed 100%"),
        taxAmount: z.coerce.number().min(0, "Tax amount must be positive"),
        schPercent: z.coerce.number().min(0).max(100).default(0),
        schAmount: z.coerce.number().min(0).default(0),
        batchId: z.coerce.number().min(1, "Batch is required"),
        batchOpeningStock: z.coerce.number().optional(),
        cartonPack: z.coerce.number().optional(),
        conversionFactor: z.coerce.number().optional(),
      }),
    )
    .min(1, "At least one product item is required"),

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

// ----------------------------------------------------------------------
// Component Props
// ----------------------------------------------------------------------
interface SalesFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSales?: any | null;
  onSave: (data: SalesFormData, id?: number) => Promise<void>;
  isSubmitting?: boolean;
}

// ----------------------------------------------------------------------
// Initial Values
// ----------------------------------------------------------------------
const defaultValues: SalesFormData = {
  invoiceDate: new Date().toISOString().split("T")[0],
  areaId: 0,
  customerId: 0,
  vanId: 0,
  salesmanId: 0,
  address: "",
  gstDetails: GST_DETAILS_DEFAULT_ID,
  phoneNo: "",
  items: [
    // <-- one default row
    {
      productId: 0,
      productCode: "",
      description: "",
      rate: 0,
      aQty: 0,
      mQty: 0,
      unit: 0,
      fQty: 0,
      DQty: 0,
      totalAmount: 0,
      finalAmount: 0,
      taxRate: 0,
      taxAmount: 0,
      schPercent: 0,
      schAmount: 0,
      batchId: 0 as any, // will trigger validation until batch is selected
      batchOpeningStock: 0,
      cartonPack: 0,
      conversionFactor: 0,
    },
  ],
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

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
export default function SalesForm({
  open,
  onOpenChange,
  editingSales,
  onSave,
  isSubmitting = false,
}: SalesFormModalProps) {
  const { layoutMode } = useTheme();
  // State for dropdowns
  const [areaOpen, setAreaOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
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
    cartonPack: number;
    conversionFactor: number;
  } | null>(null);

  // Get data from Redux store
  const { areas, customers, salesmen, vans, products } = useActiveLists();

  const form = useForm<SalesFormData>({
    resolver: zodResolver(salesSchema) as any,
    defaultValues,
  });

  // Watch values for filtering logic
  const items = form.watch("items");
  const customerId = form.watch("customerId");
  const areaId = form.watch("areaId");

  // Watch summary fields that affect final amount calculation
  const cessInsurance = useWatch({
    control: form.control,
    name: "cessInsurance",
  });
  const discountPercent = useWatch({
    control: form.control,
    name: "discountPercent",
  });
  const amountAdd = useWatch({ control: form.control, name: "amountAdd" });
  const creditAmount = useWatch({
    control: form.control,
    name: "creditAmount",
  });

  // Filtered Lists based on Area
  const filteredCustomers = useMemo(() => {
    if (!areaId) return customers;
    return customers.filter((c: Customer) => c.areaId === areaId);
  }, [customers, areaId]);

  const filteredSalesmen = useMemo(() => {
    if (!areaId) return salesmen;
    return salesmen.filter((s: any) => s.areaId === areaId);
  }, [salesmen, areaId]);

  // Helper to find entities
  const findProduct = (productId: number) => {
    return products.find((p) => p.id === productId) as
      | ProductWithFactors
      | undefined;
  };

  const findCustomer = (id: number) =>
    customers.find((c: Customer) => c.id === id);
  const findArea = (id: number) => areas.find((a) => a.id === id);

  // --------------------------------------------------------------------
  // Logic: Handle Phone Number Selection
  // --------------------------------------------------------------------
  const handlePhoneSelect = (customerId: number) => {
    const customer = findCustomer(customerId);
    console.log(customer, "fewoihfioweh");
    if (customer) {
      // Update all related fields including address
      form.setValue("phoneNo", customer.phoneNo);
      form.setValue("customerId", customer.id);
      form.setValue("areaId", customer.areaId || 0);
      form.setValue("address", customer.address || ""); // ADDRESS AUTO-FILL

      // Reset salesman if current one doesn't belong to new area
      const currentSalesman = form.getValues("salesmanId");
      const isSalesmanValid = salesmen.find(
        (s: any) => s.id === currentSalesman && s.areaId === customer.areaId,
      );
      if (!isSalesmanValid) {
        form.setValue("salesmanId", 0);
      }

      setPhoneOpen(false);
      toast.success(`Customer ${customer.personName} selected`);
    }
  };

  // --------------------------------------------------------------------
  // Logic: Handle Area Selection
  // --------------------------------------------------------------------
  const handleAreaSelect = (selectedAreaId: number) => {
    form.setValue("areaId", selectedAreaId, { shouldValidate: true });
    form.setValue("customerId", 0, { shouldValidate: true });
    form.setValue("salesmanId", 0, { shouldValidate: true });
    form.setValue("phoneNo", "");
    form.setValue("address", "", { shouldValidate: true });
    form.clearErrors(["areaId"]);
    setAreaOpen(false);
  };

  // --------------------------------------------------------------------
  // Logic: Handle Customer Selection
  // --------------------------------------------------------------------
  const handleCustomerSelect = (selectedCustomerId: number) => {
    const customer = findCustomer(selectedCustomerId);
    if (customer) {
      form.setValue("customerId", customer.id, { shouldValidate: true });
      form.setValue("areaId", customer.areaId || 0, { shouldValidate: true });
      form.setValue("address", customer.address || "", {
        shouldValidate: true,
      });
      form.setValue("phoneNo", customer.phoneNo || "");
      form.clearErrors(["customerId", "areaId", "address"]);

      const currentSalesman = form.getValues("salesmanId");
      const isSalesmanValid = salesmen.find(
        (s: any) => s.id === currentSalesman && s.areaId === customer.areaId,
      );
      if (!isSalesmanValid) {
        form.setValue("salesmanId", 0, { shouldValidate: true });
      }
    }
    setCustomerOpen(false);
  };

  // --------------------------------------------------------------------
  // Calculations
  // --------------------------------------------------------------------
  useEffect(() => {
    const calculateTotals = () => {
      const sumItemFinal = items.reduce(
        (sum, item) => sum + (item.finalAmount || 0),
        0,
      );
      const tax = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
      const grossAmount = items.reduce(
        (sum, item) => sum + ((item.totalAmount || 0) - (item.taxAmount || 0)),
        0,
      );

      const _cessInsurance = Number(cessInsurance) || 0;
      const _discountPercent = Number(discountPercent) || 0;
      const _amountAdd = Number(amountAdd) || 0;
      const _creditAmount = Number(creditAmount) || 0;

      const discountAmount =
        (sumItemFinal + _cessInsurance + _amountAdd - _creditAmount) *
        (_discountPercent / 100);
      const finalAmount =
        sumItemFinal +
        _cessInsurance +
        _amountAdd -
        discountAmount -
        _creditAmount;

      form.setValue("grossAmount", parseFloat(grossAmount.toFixed(2)));
      form.setValue("tax", parseFloat(tax.toFixed(2)));
      form.setValue(
        "finalAmount",
        Math.max(0, parseFloat(finalAmount.toFixed(2))),
      );
    };

    calculateTotals();
  }, [items, cessInsurance, discountPercent, amountAdd, creditAmount, form]);

  // Reset form when editingSales changes
  useEffect(() => {
    if (editingSales) {
      const mappedItems = (editingSales.items ?? []).map((item: any) => {
        let cartonPack = item.cartonPack ?? 0;
        if (!cartonPack && item.productId) {
          const product = findProduct(item.productId);
          cartonPack = product?.cartonPack ?? 0;
        }
        return {
          productId: item.productId ?? 0,
          productCode: item.product?.productCode ?? "",
          description: item.product?.description ?? "",
          rate: item.rate ?? 0,
          aQty: item.aQty ?? 0,
          mQty: item.mQty ?? 0,
          unit: item.unit ?? 0,
          fQty: item.fQty ?? 0,
          DQty: item.DQty ?? 0,
          totalAmount: item.totalAmount ?? 0,
          finalAmount:
            item.finalAmount ?? item.totalAmount - (item.schAmount ?? 0),
          taxRate: item.taxRate ?? 0,
          taxAmount: item.taxAmount ?? 0,
          schPercent: item.schPercent ?? 0,
          schAmount: item.schAmount ?? 0,
          batchId: item.batchId ?? undefined,
          batchOpeningStock: item.batch?.openingStock ?? undefined,
          cartonPack,
          conversionFactor: item.conversionFactor ?? 0,
        };
      });

      form.reset({
        invoiceDate:
          editingSales.invoiceDate?.split("T")[0] ?? defaultValues.invoiceDate,
        areaId: editingSales.area?.id ?? 0,
        customerId: editingSales.customer?.id ?? 0,
        phoneNo: editingSales.customer?.phoneNo ?? "",
        vanId: editingSales.van?.id ?? 0,
        salesmanId: editingSales.salesman?.id ?? 0,
        address: editingSales.address ?? "",
        gstDetails: normalizeGstDetailsValue(editingSales.gstDetails),
        items: mappedItems,
        remarks: editingSales.remarks ?? "",
        grossAmount: editingSales.grossAmount ?? 0,
        boxUnit: editingSales.boxUnit ?? 0,
        cessInsurance: editingSales.cessInsurance ?? 0,
        scheme1: editingSales.scheme1 ?? 0,
        discountPercent: editingSales.discountPercent ?? 0,
        tax: editingSales.tax ?? 0,
        amountAdd: editingSales.amountAdd ?? 0,
        creditAmount: editingSales.creditAmount ?? 0,
        finalAmount: editingSales.finalAmount ?? 0,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [editingSales, form]);

  // --------------------------------------------------------------------
  // Helper functions
  // --------------------------------------------------------------------
  const findAreaName = (areaId: number) => {
    const area = areas.find((a) => a.id === areaId);
    return area
      ? `${area.name} (${area.city || area.state || "N/A"})`
      : "Select area";
  };

  const findCustomerName = (customerId: number) => {
    const customer = findCustomer(customerId);
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
    const product = findProduct(productId);
    return product
      ? `${product.productCode}, ${product.productBrand}`
      : "Select product";
  };

  const calculateMQty = (aQty: number, cartonPack: number = 1): number => {
    if (!cartonPack) return 0;
    return Math.floor(aQty / cartonPack);
  };

  const calculateUnit = (aQty: number, cartonPack: number = 1): number => {
    if (!cartonPack) return 0;
    return aQty % cartonPack;
  };

  const totalCartons = items.reduce((sum, item) => sum + item.mQty, 0);
  const totalAQty = items.reduce((sum, item) => sum + (item.aQty || 0), 0);
  const totalUnits = items.reduce((sum, item) => sum + (item.unit || 0), 0);

  // --------------------------------------------------------------------
  // Item handlers
  // --------------------------------------------------------------------
  const handleItemChange = (
    index: number,
    field: keyof SalesFormData["items"][0],
    value: any,
  ) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    const numValue = value === "" ? 0 : Number(value) || 0;

    if (field === "aQty" && item.batchId && item.batchOpeningStock) {
      if (numValue > item.batchOpeningStock) {
        toast.error(
          `Only ${item.batchOpeningStock} stock available for this batch`,
          {
            description: `Maximum A Qty allowed is ${item.batchOpeningStock}`,
          },
        );
        updatedItems[index] = { ...item, aQty: item.batchOpeningStock };
        form.setValue("items", updatedItems);
        return;
      }
    }

    updatedItems[index] = { ...item, [field]: numValue };

    if (["rate", "aQty", "taxRate", "schPercent"].includes(field)) {
      const rate = field === "rate" ? numValue : item.rate;
      const aQty = field === "aQty" ? numValue : item.aQty;
      const taxRate = field === "taxRate" ? numValue : item.taxRate;
      const schPercent = field === "schPercent" ? numValue : item.schPercent;

      const totalAmount = rate * aQty;
      const taxAmount = totalAmount * (taxRate / 100);
      const schAmount = totalAmount * (schPercent / 100);
      const finalAmount = totalAmount - schAmount;

      if (schAmount > totalAmount) {
        toast.error("Scheme amount cannot exceed total amount for this item");
        return;
      }

      updatedItems[index].totalAmount = parseFloat(totalAmount.toFixed(2));
      updatedItems[index].taxAmount = parseFloat(taxAmount.toFixed(2));
      updatedItems[index].schAmount = parseFloat(schAmount.toFixed(2));
      updatedItems[index].finalAmount = parseFloat(finalAmount.toFixed(2));

      if (field === "aQty") {
        const product = findProduct(item.productId);
        if (product) {
          const mQty = calculateMQty(aQty, product.cartonPack);
          const unit = calculateUnit(aQty, product.cartonPack);
          updatedItems[index].mQty = mQty;
          updatedItems[index].unit = unit;
          updatedItems[index].cartonPack = product.cartonPack;
        }
      }
    }

    if (field === "totalAmount") {
      const taxAmount = numValue * (item.taxRate / 100);
      const schAmount = numValue * (item.schPercent / 100);
      const finalAmount = numValue - schAmount;
      updatedItems[index].taxAmount = parseFloat(taxAmount.toFixed(2));
      updatedItems[index].schAmount = parseFloat(schAmount.toFixed(2));
      updatedItems[index].finalAmount = parseFloat(finalAmount.toFixed(2));
    }

    form.setValue("items", updatedItems);
  };

  // --------------------------------------------------------------------
  // Batch selection
  // --------------------------------------------------------------------
  const handleBatchSelect = (batch: any, aQty: number) => {
    if (pendingBatchSelection) {
      const {
        index,
        productId,
        productCode,
        description,
        cartonPack,
        conversionFactor,
      } = pendingBatchSelection;

      const product = findProduct(productId);
      const taxRate = product?.gstRate || 5;

      const mQty = calculateMQty(aQty, cartonPack);
      const unit = calculateUnit(aQty, cartonPack);
      const rate = batch.saleRate ?? 0;
      const schPercent = 0;
      const totalAmount = rate * aQty;
      const taxAmount = totalAmount * (taxRate / 100);
      const schAmount = totalAmount * (schPercent / 100);
      const finalAmount = totalAmount - schAmount;

      const updatedItems = [...items];
      updatedItems[index] = {
        ...updatedItems[index],
        productId,
        productCode,
        description,
        rate,
        aQty,
        mQty,
        unit,
        totalAmount,
        taxRate,
        taxAmount,
        schPercent,
        schAmount,
        finalAmount,
        cartonPack,
        conversionFactor,
        batchId: batch.id,
        batchOpeningStock: batch.openingStock,
      };

      form.setValue("items", updatedItems);

      toast.success(`Batch applied to ${productCode}`, {
        description: `Rate: ₹${rate.toFixed(2)} | A Qty: ${aQty} | M Qty: ${mQty} | Unit: ${unit} | Stock: ${batch.openingStock}`,
      });

      setPendingBatchSelection(null);
    }
  };

  const handleBatchModalClose = () => {
    setBatchModalOpen(false);
    setTimeout(() => {
      setPendingBatchSelection(null);
    }, 300);
  };

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

  // --------------------------------------------------------------------
  // Row management
  // --------------------------------------------------------------------
  const addProductRow = () => {
    const newItem: SalesFormData["items"][0] = {
      productId: 0,
      productCode: "",
      description: "",
      rate: 0,
      aQty: 0,
      mQty: 0,
      unit: 0,
      fQty: 0,
      DQty: 0,
      totalAmount: 0,
      finalAmount: 0,
      taxRate: 0,
      taxAmount: 0,
      schPercent: 0,
      schAmount: 0,
      batchId: undefined as any,
      batchOpeningStock: 0,
      cartonPack: 0,
      conversionFactor: 0,
    };
    form.setValue("items", [...items, newItem]);
  };

  const removeProductRow = (index: number) => {
    if (items.length > 0) {
      const updatedItems = items.filter((_, i) => i !== index);
      form.setValue("items", updatedItems);
    }
  };

  const handleProductSelect = (index: number, productId: number) => {
    const product = findProduct(productId);
    if (product) {
      setPendingBatchSelection({
        index,
        productId: product.id,
        productCode: product.productCode,
        description: product.description,
        cartonPack: product.cartonPack,
        conversionFactor: product.conversionFactor,
      });
      setProductOpen(false);
      setActiveProductIndex(null);
      setBatchModalOpen(true);
    }
  };

  // --------------------------------------------------------------------
  // Form submission
  // --------------------------------------------------------------------
  const onSubmit = async (data: SalesFormData) => {
    // Destructure to remove phoneNo before sending to backend
    const { phoneNo, ...payloadData } = data;
    const payload = { ...payloadData, boxUnit: 0 };

    try {
      await onSave(payload as SalesFormData, editingSales?.id);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Failed to save sales. Please try again.");
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast.error("Please fix all validation errors before submitting.");
  };

  const isReadOnly =
    editingSales && editingSales.status !== "Pending" ? true : false;

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[99vw] max-h-[95vh] overflow-y-auto">
          {/* <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6" />
                {editingSales
                  ? `Invoice ${editingSales.invoiceNo}`
                  : "Add New Sales Invoice"}
              </DialogTitle>
              {editingSales && editingSales.status !== "Pending" && (
                <Badge variant="secondary" className="ml-2">
                  Read‑only
                </Badge>
              )}
            </div>
            <DialogDescription>
              {editingSales
                ? editingSales.status === "Pending"
                  ? "Update sales invoice details"
                  : "View sales invoice details (read‑only)"
                : "Create a new sales invoice"}
            </DialogDescription>
          </DialogHeader> */}

          <Form {...form}>
            <form
              data-entry-form
              onSubmit={form.handleSubmit(onSubmit, onError)}
              className="space-y-6"
            >
              {/* Header Section */}
              <div className="rounded-lg border p-4 bg-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Invoice Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Phone Number Search */}
                  <FormField
                    control={form.control}
                    name="phoneNo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormControl>
                          <InlineSearchField
                            open={phoneOpen}
                            onOpenChange={setPhoneOpen}
                            displayValue={
                              field.value
                                ? `${field.value} - ${findCustomer(form.getValues("customerId"))?.personName || ""}`
                                : ""
                            }
                            placeholder="Search by Phone"
                            emptyMessage="No customer found."
                            disabled={isSubmitting || isReadOnly}
                          >
                            <CommandGroup>
                              {customers.map((customer: Customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={`${customer.phoneNo} ${customer.personName}`}
                                  onSelect={() => {
                                    if (!isReadOnly) {
                                      handlePhoneSelect(customer.id);
                                    }
                                  }}
                                >
                                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {customer.phoneNo}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {customer.personName}{" "}
                                      {customer.companyName
                                        ? `(${customer.companyName})`
                                        : ""}
                                    </span>
                                  </div>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      customer.id ===
                                        form.getValues("customerId")
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

                  {/* Invoice Date */}
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <HoverDateInput
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            placeholder="Invoice Date *"
                            inputClassName="pl-10"
                            disabled={isSubmitting || isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Area */}
                  <FormField
                    control={form.control}
                    name="areaId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormControl>
                          <InlineSearchField
                            open={areaOpen}
                            onOpenChange={setAreaOpen}
                            displayValue={
                              field.value
                                ? findAreaName(field.value)
                                : ""
                            }
                            placeholder="Area *"
                            emptyMessage="No area found."
                            disabled={isSubmitting || isReadOnly}
                          >
                            <CommandGroup>
                              {areas.map((area) => (
                                <CommandItem
                                  key={area.id}
                                  value={`${area.id} ${area.name} ${area.city || ""}`}
                                  onSelect={() => {
                                    if (!isReadOnly) {
                                      handleAreaSelect(area.id);
                                    }
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
                          </InlineSearchField>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Customer (Filtered by Area) */}
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormControl>
                          <InlineSearchField
                            open={customerOpen}
                            onOpenChange={setCustomerOpen}
                            displayValue={
                              field.value
                                ? findCustomerName(field.value)
                                : ""
                            }
                            placeholder="Customer *"
                            emptyMessage={
                              areaId
                                ? "No customer found in this area."
                                : "Please select an area first."
                            }
                            disabled={isSubmitting || isReadOnly || !areaId}
                          >
                            <CommandGroup>
                              {filteredCustomers.map((customer: Customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={`${customer.id} ${customer.companyName || customer.personName} ${customer.phoneNo || ""}`}
                                  onSelect={() => {
                                    if (!isReadOnly) {
                                      handleCustomerSelect(customer.id);
                                      setCustomerOpen(false);
                                    }
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
                          </InlineSearchField>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address - Now properly auto-filled */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Address *"
                              className="pl-10"
                              {...field}
                              disabled={isSubmitting || isReadOnly}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Van */}
                  <FormField
                    control={form.control}
                    name="vanId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormControl>
                          <InlineSearchField
                            open={vanOpen}
                            onOpenChange={setVanOpen}
                            displayValue={
                              field.value
                                ? findVanName(field.value)
                                : ""
                            }
                            placeholder="Van *"
                            emptyMessage="No van found."
                            disabled={isSubmitting || isReadOnly}
                          >
                            <CommandGroup>
                              {vans.map((van) => (
                                <CommandItem
                                  key={van.id}
                                  value={`${van.id} ${van.name} ${van.vehicleNo || ""}`}
                                  onSelect={() => {
                                    if (!isReadOnly) {
                                      field.onChange(van.id);
                                      setVanOpen(false);
                                    }
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
                          </InlineSearchField>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Salesman (Filtered by Area) */}
                  <FormField
                    control={form.control}
                    name="salesmanId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormControl>
                          <InlineSearchField
                            open={salesmanOpen}
                            onOpenChange={setSalesmanOpen}
                            displayValue={
                              field.value
                                ? findSalesmanName(field.value)
                                : ""
                            }
                            placeholder="Salesman *"
                            emptyMessage={
                              areaId
                                ? "No salesman found in this area."
                                : "Please select an area first."
                            }
                            disabled={isSubmitting || isReadOnly || !areaId}
                          >
                            <CommandGroup>
                              {filteredSalesmen.map((salesman: any) => (
                                <CommandItem
                                  key={salesman.id}
                                  value={`${salesman.id} ${salesman.name} ${salesman.phoneNo || ""}`}
                                  onSelect={() => {
                                    if (!isReadOnly) {
                                      field.onChange(salesman.id);
                                      setSalesmanOpen(false);
                                    }
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {salesman.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {salesman.phoneNo &&
                                        `${salesman.phoneNo} • `}
                                      {salesman.email && `${salesman.email} • `}
                                      {salesman.areaId}
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
                          </InlineSearchField>
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? GST_DETAILS_DEFAULT_ID}
                          disabled={isSubmitting || isReadOnly}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="GST Details" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gst_details.map((gst) => (
                              <SelectItem key={gst.id} value={String(gst.id)}>
                                {gst.type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Display Invoice Number when editing (read‑only) */}
                  {editingSales && (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={editingSales.invoiceNo}
                            placeholder="Invoice No."
                            readOnly
                            disabled
                            className="pl-10 bg-muted"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                </div>
              </div>

              {/* Products Table Section */}
              <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Products</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isReadOnly
                        ? "View product details"
                        : "Add products to the sales invoice"}
                    </p>
                  </div>
                  {!isReadOnly && (
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
                  )}
                </div>
                <div className="flex items-center justify-center overflow-x-auto w-full">
                  <div className="overflow-x-auto border rounded-lg max-w-9xl lg:max-w-4xl xl:max-w-7.5xl 2xl:max-w-10xl">
                    <Table
                      className={cn(
                        layoutMode === "classic" && "classic-table",
                        layoutMode === "classic" && "classic-table",
                      )}
                    >
                      <TableHeader>
                        <TableRow className="bg-secondary/50">
                          <TableHead className="font-semibold w-12">
                            Sr
                          </TableHead>
                          <TableHead className="font-semibold">
                            Prod Code & Description
                          </TableHead>
                          <TableHead className="font-semibold">Rate</TableHead>
                          <TableHead className="font-semibold">
                            A. Qty
                          </TableHead>
                          <TableHead className="font-semibold">Fr</TableHead>
                          <TableHead className="font-semibold">Dm</TableHead>
                          <TableHead className="font-semibold">
                            M. Qty *
                          </TableHead>
                          <TableHead className="font-semibold">
                            Unit *
                          </TableHead>
                          <TableHead className="font-semibold">
                            Amount
                          </TableHead>
                          <TableHead className="font-semibold">Sch%</TableHead>
                          <TableHead className="font-semibold">
                            Sch amt
                          </TableHead>
                          <TableHead className="font-semibold">
                            Tax (%)
                          </TableHead>
                          <TableHead className="font-semibold">
                            Tax Amt
                          </TableHead>
                          <TableHead className="font-semibold">
                            Final Amt
                          </TableHead>
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
                                colSpan={15}
                                className="text-center py-8 text-muted-foreground"
                              >
                                No products added.{" "}
                                {!isReadOnly &&
                                  'Click "Add Product" to get started.'}
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
                                  {isReadOnly ? (
                                    <div className="py-2 px-3 text-sm">
                                      {item.productCode} – {item.description}
                                    </div>
                                  ) : (
                                    <InlineSearchField
                                      open={
                                        productOpen &&
                                        activeProductIndex === index
                                      }
                                      onOpenChange={(open) => {
                                        if (open) {
                                          setActiveProductIndex(index);
                                        } else {
                                          setActiveProductIndex(null);
                                        }
                                        setProductOpen(open);
                                      }}
                                      displayValue={
                                        item.productId
                                          ? findProductName(item.productId)
                                          : "Select product"
                                      }
                                      placeholder="Search products..."
                                      emptyMessage="No product found."
                                      disabled={isSubmitting}
                                    >
                                      <CommandGroup>
                                        {products.map((product) => (
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
                                    </InlineSearchField>
                                  )}
                                </TableCell>

                                {/* Rate */}
                                <TableCell>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={item.rate ?? 0}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "rate",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-24 pl-7"
                                      disabled={isSubmitting || isReadOnly}
                                    />
                                  </div>
                                </TableCell>

                                {/* A. Qty */}
                                <TableCell>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="1"
                                      value={item.aQty ?? 0}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "aQty",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-20"
                                      disabled={isSubmitting || isReadOnly}
                                    />
                                  </div>
                                </TableCell>

                                {/* Fr (Free Qty) */}
                                <TableCell>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="1"
                                      value={item.fQty ?? 0}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "fQty",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-20"
                                      disabled={isSubmitting || isReadOnly}
                                    />
                                  </div>
                                </TableCell>

                                {/* Dm (Damaged Qty) */}
                                <TableCell>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="1"
                                      value={item.DQty ?? 0}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "DQty",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-20"
                                      disabled={isSubmitting || isReadOnly}
                                    />
                                  </div>
                                </TableCell>

                                {/* M. Qty - DISABLED */}
                                <TableCell>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="1"
                                      value={item.mQty.toFixed(0) ?? 0}
                                      readOnly
                                      disabled
                                      className="w-20 bg-muted cursor-not-allowed"
                                    />
                                  </div>
                                </TableCell>

                                {/* Unit - DISABLED */}
                                <TableCell>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="1"
                                      value={item.unit.toFixed(0) ?? 0}
                                      readOnly
                                      disabled
                                      className="w-20 bg-muted cursor-not-allowed"
                                    />
                                  </div>
                                </TableCell>

                                {/* Amount (inclusive) */}
                                <TableCell>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={item.totalAmount ?? 0}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "totalAmount",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-24 pl-7"
                                      disabled={isSubmitting || isReadOnly}
                                    />
                                  </div>
                                </TableCell>

                                {/* Sch% */}
                                <TableCell className="max-w-16">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={item.schPercent ?? 0}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "schPercent",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-14 pl-6"
                                      disabled={isSubmitting || isReadOnly}
                                    />
                                    <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                  </div>
                                </TableCell>

                                {/* Sch Amount */}
                                <TableCell>
                                  <div className="font-medium text-sm">
                                    ₹{(item.schAmount ?? 0).toFixed(2)}
                                  </div>
                                </TableCell>

                                {/* Tax Rate */}
                                <TableCell className="max-w-16">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={item.taxRate ?? 0}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "taxRate",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-14 pl-6"
                                      disabled={isSubmitting || isReadOnly}
                                    />
                                    <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                  </div>
                                </TableCell>

                                {/* Tax Amount */}
                                <TableCell>
                                  <div className="font-medium text-sm">
                                    ₹{(item.taxAmount ?? 0).toFixed(2)}
                                  </div>
                                </TableCell>

                                {/* Final Amount (item) */}
                                <TableCell>
                                  <div className="font-bold text-sm text-green-700">
                                    ₹{(item.finalAmount ?? 0).toFixed(2)}
                                  </div>
                                </TableCell>

                                {/* Actions */}
                                <TableCell>
                                  <div className="flex gap-1">
                                    {!isReadOnly && (
                                      <>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openBatchModal(index)}
                                          disabled={
                                            !item.productId || isSubmitting
                                          }
                                          className="h-7 w-7 p-0"
                                          title="Select Batch"
                                        >
                                          <Layers className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            removeProductRow(index)
                                          }
                                          disabled={isSubmitting}
                                          className="h-7 w-7 p-0"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </motion.tr>
                            ))
                          )}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                    <div className="p-2 text-xs text-muted-foreground border-t">
                      * M Qty = floor(A Qty / Carton Pack), Unit = A Qty %
                      Carton Pack (both auto‑calculated, cannot be edited).
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Remarks - Left Side */}
                  <div className="lg:col-span-1">
                    <div className="bg-remarks-bg rounded-lg p-4 border border-remarks-border">
                      <h4 className="font-semibold mb-3 text-remarks-text flex items-center gap-2">
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
                                className="min-h-30 bg-white dark:bg-gray-900 border-remarks-border focus:border-primary"
                                {...field}
                                disabled={isSubmitting || isReadOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="text-xs text-remarks-text mt-2">
                        {isReadOnly
                          ? "Read‑only view"
                          : "Add any special instructions or notes for this invoice."}
                      </p>
                    </div>
                  </div>

                  {/* Summary - Right Side */}
                  <div className="lg:col-span-3">
                    <div className="bg-summary-container-bg rounded-xl p-5 border border-summary-container-border shadow-sm">
                      <h4 className="font-semibold mb-4 text-summary-container-text flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Invoice Summary
                      </h4>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Gross Amount (read‑only) */}
                        <div className="bg-summary-bg-1 rounded-lg p-3 border border-summary-border-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-summary-text-1">
                              Gross Amount
                            </span>
                            <Tag className="h-3 w-3 text-summary-icon-1" />
                          </div>
                          <FormField
                            control={form.control}
                            name="grossAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-summary-text-1" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-summary-border-1 text-summary-text-1 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Box/Unit Ratio */}
                        <div className="bg-summary-bg-2 rounded-lg p-3 border border-summary-border-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-summary-text-2">
                              Box/Unit Ratio
                            </span>
                            <Package className="h-3 w-3 text-summary-icon-2" />
                          </div>
                          <div className="relative">
                            <Input
                              type="text"
                              value={`${totalCartons.toFixed(2)} / ${totalUnits.toFixed(2)}`}
                              readOnly
                              disabled
                              className="h-8 bg-white dark:bg-gray-900/80 border-summary-border-2 text-summary-text-2 font-medium text-center"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Total units (remainder)
                          </p>
                        </div>

                        {/* CESS/INS */}
                        <div className="bg-summary-bg-3 rounded-lg p-3 border border-summary-border-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-summary-text-3">
                              CESS/INS
                            </span>
                            <Shield className="h-3 w-3 text-summary-icon-3" />
                          </div>
                          <FormField
                            control={form.control}
                            name="cessInsurance"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-summary-text-3" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      disabled={isSubmitting || isReadOnly}
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-summary-border-3 text-summary-text-3 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Discount % */}
                        <div className="bg-summary-bg-5 rounded-lg p-3 border border-summary-border-5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-summary-text-5">
                              Discount %
                            </span>
                            <Percent className="h-3 w-3 text-summary-icon-5" />
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
                                      disabled={isSubmitting || isReadOnly}
                                      className="h-8 bg-white dark:bg-gray-900/80 border-summary-border-5 text-summary-text-5 font-medium text-center"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Tax Amount */}
                        <div className="bg-summary-bg-6 rounded-lg p-3 border border-summary-border-6">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-summary-text-6">
                              Tax Amount
                            </span>
                            <FileText className="h-3 w-3 text-summary-icon-6" />
                          </div>
                          <FormField
                            control={form.control}
                            name="tax"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-summary-text-6" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      readOnly
                                      disabled
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-summary-border-6 text-summary-text-6 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Add Amount */}
                        <div className="bg-summary-bg-7 rounded-lg p-3 border border-summary-border-7">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-summary-text-7">
                              Add Amount
                            </span>
                            <Plus className="h-3 w-3 text-summary-icon-7" />
                          </div>
                          <FormField
                            control={form.control}
                            name="amountAdd"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-summary-text-7" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      disabled={isSubmitting || isReadOnly}
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-summary-border-7 text-summary-text-7 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Credit Amount */}
                        <div className="bg-summary-bg-8 rounded-lg p-3 border border-summary-border-8">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-summary-text-8">
                              Credit Amount
                            </span>
                            <CreditCard className="h-3 w-3 text-summary-icon-8" />
                          </div>
                          <FormField
                            control={form.control}
                            name="creditAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-summary-text-8" />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      disabled={isSubmitting || isReadOnly}
                                      className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-summary-border-8 text-summary-text-8 font-medium"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Total Scheme (read‑only) */}
                        <div className="bg-summary-bg-4 rounded-lg p-3 border border-summary-border-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-summary-text-4">
                              Total Scheme
                            </span>
                            <Gift className="h-3 w-3 text-summary-icon-4" />
                          </div>
                          <div className="relative">
                            <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-summary-text-4" />
                            <Input
                              type="number"
                              step="0.01"
                              value={items
                                .reduce(
                                  (sum, item) => sum + (item.schAmount || 0),
                                  0,
                                )
                                .toFixed(2)}
                              readOnly
                              disabled
                              className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-summary-border-4 text-summary-text-4 font-medium"
                            />
                          </div>
                        </div>

                        {/* Final Amount */}
                        <div className="col-span-2 md:col-span-4 mt-4">
                          <div className="bg-summary-bg-final rounded-xl p-5 border border-summary-border-final shadow-md">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-summary-text-final" />
                                <span className="text-lg font-bold text-summary-text-final">
                                  Final Amount
                                </span>
                              </div>
                              <Badge className="bg-white/20 text-summary-text-final hover:bg-white/30 border-0">
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
                                      <IndianRupee className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-summary-text-final" />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        className="pl-12 h-14 text-2xl font-bold bg-white/10 text-summary-text-final border-white/30 placeholder:text-white/60"
                                        readOnly
                                        disabled
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <p className="text-xs text-(--summary-text-final)/80 mt-3 flex items-center gap-1">
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

              {/* Hidden fields */}
              <FormField
                control={form.control}
                name="boxUnit"
                render={({ field }) => (
                  <input type="hidden" {...field} value={0} />
                )}
              />
              <FormField
                control={form.control}
                name="scheme1"
                render={({ field }) => (
                  <input type="hidden" {...field} value={0} />
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  {isReadOnly ? "Close" : "Cancel"}
                </Button>
                {!isReadOnly && (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Saving..."
                      : editingSales
                        ? "Update Sales"
                        : "Create Sales"}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Batch Selection Modal */}
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
