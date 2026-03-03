import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
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
  ArrowLeft,
  Save,
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
import type { SalesFormData } from "@/types/sales";
import BatchSelectionModal from "@/components/forms/BatchSelectionModal";
import { useActiveLists } from "@/hooks/useActiveLists";
import { gst_details } from "@/store/dropdown_data/gst_details";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { salesService } from "@/services/salesService";
import { CheckIsExpanded } from "@/utils/commonHelper";

// ----------------------------------------------------------------------
// Types & Interfaces
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
// Schema
// ----------------------------------------------------------------------
const salesSchema = z.object({
  invoiceDate: z.string().min(1, "Invoice date is required"),
  areaId: z.coerce.number().min(1, "Area is required"),
  customerId: z.coerce.number().min(1, "Customer is required"),
  vanId: z.coerce.number().min(1, "Van is required"),
  salesmanId: z.coerce.number().min(1, "Salesman is required"),
  address: z.string().min(1, "Address is required"),
  gstDetails: z.string().optional(),
  phoneNo: z.string().optional(),

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
// Initial Values
// ----------------------------------------------------------------------
const defaultValues: SalesFormData = {
  invoiceDate: new Date().toISOString().split("T")[0],
  areaId: 0,
  customerId: 0,
  vanId: 0,
  salesmanId: 0,
  address: "",
  gstDetails: "With GST",
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
      taxRate: 5,
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
export default function AddSales() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (customer) {
      form.setValue("phoneNo", customer.phoneNo);
      form.setValue("customerId", customer.id);
      form.setValue("areaId", customer.areaId || 0);
      form.setValue("address", customer.address || "");

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
    form.setValue("areaId", selectedAreaId);
    form.setValue("customerId", 0);
    form.setValue("salesmanId", 0);
    form.setValue("phoneNo", "");
    form.setValue("address", "");
    setAreaOpen(false);
  };

  // --------------------------------------------------------------------
  // Logic: Handle Customer Selection
  // --------------------------------------------------------------------
  const handleCustomerSelect = (selectedCustomerId: number) => {
    const customer = findCustomer(selectedCustomerId);
    if (customer) {
      form.setValue("customerId", customer.id);
      form.setValue("areaId", customer.areaId || 0);
      form.setValue("address", customer.address || "");
      form.setValue("phoneNo", customer.phoneNo || "");

      const currentSalesman = form.getValues("salesmanId");
      const isSalesmanValid = salesmen.find(
        (s: any) => s.id === currentSalesman && s.areaId === customer.areaId,
      );
      if (!isSalesmanValid) {
        form.setValue("salesmanId", 0);
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
      taxRate: 5,
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
    const { phoneNo, ...payloadData } = data;
    const payload = { ...payloadData, boxUnit: 0 };

    setIsSubmitting(true);
    try {
      await salesService.createSale(payload);
      toast.success("Sales created successfully");
      navigate("/sales");
    } catch (error: any) {
      console.error("Error in form submission:", error);
      toast.error(error.message || "Failed to save sales. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast.error("Please fix all validation errors before submitting.");
  };

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background p-2">
      <div
        className={`mx-auto ${
          CheckIsExpanded()
            ? "max-w-5xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-9xl"
            : "max-w-9xl lg:max-w-5xl xl:max-w-8xl 2xl:max-w-10xl"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/sales")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button> */}
            <div>
              <h1 className="text-3xl font-bold text-heading">Add New Sales</h1>
              <p className="text-muted-foreground mt-1">
                Create a new sales invoice
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/sales")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit, onError)}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Create Sales"}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-6"
          >
            {/* Invoice Details Card */}
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Phone Number Search */}
                  <FormField
                    control={form.control}
                    name="phoneNo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-sm">
                          Search by Phone
                        </FormLabel>
                        <Popover open={phoneOpen} onOpenChange={setPhoneOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={phoneOpen}
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground",
                                )}
                                disabled={isSubmitting}
                              >
                                {field.value
                                  ? `${field.value} - ${findCustomer(form.getValues("customerId"))?.personName || ""}`
                                  : "Search phone number..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search phone numbers..." />
                              <CommandList>
                                <CommandEmpty>No customer found.</CommandEmpty>
                                <CommandGroup>
                                  {customers.map((customer: Customer) => (
                                    <CommandItem
                                      key={customer.id}
                                      value={`${customer.phoneNo} ${customer.personName}`}
                                      onSelect={() => {
                                        handlePhoneSelect(customer.id);
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
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
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
                        <FormLabel className="text-sm">
                          Invoice Date *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="date"
                              value={field.value ?? ""}
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

                  {/* Area */}
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
                                        handleAreaSelect(area.id);
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

                  {/* Customer (Filtered by Area) */}
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
                                  : "Select customer"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search customers..." />
                              <CommandList>
                                <CommandEmpty>
                                  {areaId
                                    ? "No customer found in this area."
                                    : "Please select an area first."}
                                </CommandEmpty>
                                <CommandGroup>
                                  {filteredCustomers.map(
                                    (customer: Customer) => (
                                      <CommandItem
                                        key={customer.id}
                                        value={`${customer.id} ${customer.companyName || customer.personName} ${customer.phoneNo || ""}`}
                                        onSelect={() => {
                                          handleCustomerSelect(customer.id);
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
                                    ),
                                  )}
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

                  {/* Van */}
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

                  {/* Salesman (Filtered by Area) */}
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
                                  : "Select salesman"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search salesmen..." />
                              <CommandList>
                                <CommandEmpty>
                                  {areaId
                                    ? "No salesman found in this area."
                                    : "Please select an area first."}
                                </CommandEmpty>
                                <CommandGroup>
                                  {filteredSalesmen.map((salesman: any) => (
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
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
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
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select GST type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gst_details.map((gst) => (
                              <SelectItem key={gst.id} value={gst.type}>
                                {gst.type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Products Table Section */}
            <Card className="p-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Products
                  </CardTitle>
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
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center overflow-x-auto w-full">
                  <div className="overflow-x-auto border rounded-lg max-w-9xl lg:max-w-3xl xl:max-w-6xl 2xl:max-w-8xl">
                    <Table>
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
                                                    product.id ===
                                                      item.productId
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
                                      value={item.rate ?? 0}
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
                                    disabled={isSubmitting}
                                  />
                                </TableCell>

                                {/* Fr (Free Qty) */}
                                <TableCell>
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
                                    disabled={isSubmitting}
                                  />
                                </TableCell>

                                {/* Dm (Damaged Qty) */}
                                <TableCell>
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
                                    disabled={isSubmitting}
                                  />
                                </TableCell>

                                {/* M. Qty - DISABLED */}
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="1"
                                    value={item.mQty.toFixed(0) ?? 0}
                                    readOnly
                                    disabled
                                    className="w-20 bg-muted cursor-not-allowed"
                                  />
                                </TableCell>

                                {/* Unit - DISABLED */}
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="1"
                                    value={item.unit.toFixed(0) ?? 0}
                                    readOnly
                                    disabled
                                    className="w-20 bg-muted cursor-not-allowed"
                                  />
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
                                      disabled={isSubmitting}
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
                                      disabled={isSubmitting}
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
                                      value={item.taxRate ?? 5}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "taxRate",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-14 pl-6"
                                      disabled={isSubmitting}
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
                      * M Qty = floor(A Qty / Carton Pack), Unit = A Qty %
                      Carton Pack (both auto-calculated).
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
              {/* Remarks */}
              <Card className="lg:col-span-1 p-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Remarks & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any additional remarks, notes, or special instructions..."
                            className="min-h-[120px]"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Summary */}
              <Card className="lg:col-span-2 p-2 ">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Invoice Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Gross Amount (read-only) */}
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
                                  disabled={isSubmitting}
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
                                  disabled={isSubmitting}
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
                                  disabled={isSubmitting}
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
                                  disabled={isSubmitting}
                                  className="pl-7 h-8 bg-white dark:bg-gray-900/80 border-summary-border-8 text-summary-text-8 font-medium"
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Total Scheme (read-only) */}
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
                          <span className="font-medium">Note:</span> This is the
                          total payable amount including all taxes and
                          adjustments.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/sales")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <Save className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Create Sales"}
              </Button>
            </div>
          </form>
        </Form>

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
      </div>
    </div>
  );
}
