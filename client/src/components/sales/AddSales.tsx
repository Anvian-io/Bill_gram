import { useTheme } from "@/contexts/ThemeProvider";
import { useState, useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import {
  Plus,
  Trash2,
  Percent,
  Package,
  Hash,
  FileText,
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
  Eye,
  FilePlus,
  Printer,
  Loader2,
  Search,
  MoreVertical,
  Pencil,
  LogOut,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { refreshActiveLists } from "@/utils/refreshActiveLists";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { MasterFieldWithAdd } from "@/components/custom_ui/MasterFieldWithAdd";
import { AppliedBatchSummaryBar } from "@/components/custom_ui/AppliedBatchSummaryBar";
import type { AppliedBatchSummary } from "@/components/custom_ui/AppliedBatchSummaryBar";
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
import BatchSelectionModal from "@/components/forms/BatchSelectionModal";
import { useActiveLists } from "@/hooks/useActiveLists";
import {
  gst_details,
  GST_DETAILS_DEFAULT_ID,
  normalizeGstDetailsValue,
  getGstDetailsLabel,
} from "@/store/dropdown_data/gst_details";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomAlert } from "@/components/custom_ui";
import { useNavigate, useSearchParams } from "react-router-dom";
import { salesService } from "@/services/salesService";
import { productService } from "@/services/productService";
import type { Sales } from "@/types/sales";
import { useHoverOpen } from "@/hooks/useHoverOpen";
import { CheckIsExpanded } from "@/utils/commonHelper";
import { focusFieldById } from "@/lib/focusNavigation";
import SalesInvoicePreview from "./SalesInvoicePreview";
import AreaForm, { type AreaFormData } from "@/components/forms/AreaForm";
import VanForm, { type VanFormData } from "@/components/forms/VanForm";
import SalesmanForm, {
  type SalesmanFormData,
} from "@/components/forms/SalesmanForm";
import CustomerForm, {
  type CustomerFormData,
} from "@/components/forms/CustomerForm";
import { areaService } from "@/services/areaService";
import { vanService } from "@/services/vanService";
import { salesmanService } from "@/services/salesmanService";
import { customerService } from "@/services/customerService";
import { printPdfBlob } from "@/utils/printPdf";

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
  innerPack?: number | string | null;
  conversionFactor: number;
  productBrand: string;
  productShortName?: string | null;
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

interface SalesResponse {
  id: number;
  invoiceNo: string;
  [key: string]: any;
}

interface AddSalesProps {
  mode?: "sale" | "return";
}

// ----------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------
const salesSchema = z.object({
  invoiceDate: z.string().min(1),
  areaId: z.coerce.number().min(1),
  customerId: z.coerce.number().min(1),
  vanId: z.coerce.number().min(0).default(0),
  salesmanId: z.coerce.number().min(0).default(0),
  address: z.string().optional(),
  gstDetails: z.string().min(1),
  phoneNo: z.string().optional(),

  items: z
    .array(
      z.object({
        productId: z.coerce.number().min(0).default(0),
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
        batchId: z.coerce.number().optional(),
        batchOpeningStock: z.coerce.number().optional(),
        cartonPack: z.coerce.number().optional(),
        conversionFactor: z.coerce.number().optional(),
      }),
    )
    .min(1)
    .refine(
      (items) => items.some((item) => item.productId > 0),
    ),

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
  gstDetails: GST_DETAILS_DEFAULT_ID,
  phoneNo: "",
  items: [
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
      batchId: 0 as any,
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

const MIN_TABLE_ROWS = 8;

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
export default function AddSales({ mode = "sale" }: AddSalesProps) {
  const { layoutMode } = useTheme();
  const isReturnMode = mode === "return";
  const saleLabel = isReturnMode ? "Sales Return" : "Sales";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get id from query params
  const idParam = searchParams.get("id");
  const saleId = idParam && idParam !== "new" ? idParam : null;
  const isNew = idParam === "new" || !idParam;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSaleId, setGeneratedSaleId] = useState<number | null>(null);
  const [generatedInvoiceNo, setGeneratedInvoiceNo] = useState<string | null>(
    null,
  );
  const [previewInvoiceNo, setPreviewInvoiceNo] = useState<string | null>(null);
  const [areaFormOpen, setAreaFormOpen] = useState(false);
  const [vanFormOpen, setVanFormOpen] = useState(false);
  const [salesmanFormOpen, setSalesmanFormOpen] = useState(false);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [isMasterSubmitting, setIsMasterSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSaleId, setPreviewSaleId] = useState<number>(0);

  // State for dropdowns
  const areaHover = useHoverOpen();
  const customerHover = useHoverOpen();
  const phoneHover = useHoverOpen();
  const vanHover = useHoverOpen();
  const salesmanHover = useHoverOpen();
  const gstHover = useHoverOpen();
  const invoiceSearchHover = useHoverOpen();
  const [productOpen, setProductOpen] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [invoiceSearchResults, setInvoiceSearchResults] = useState<Sales[]>([]);
  const [isSearchingInvoice, setIsSearchingInvoice] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(
    null,
  );
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cartonPackWarningOpen, setCartonPackWarningOpen] = useState(false);
  const [cartonPackWarningText, setCartonPackWarningText] = useState("");
  const [duplicateProductAlertOpen, setDuplicateProductAlertOpen] =
    useState(false);
  const [duplicateProductAlertText, setDuplicateProductAlertText] =
    useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const saveAndNewRef = useRef(false);
  const invoiceSearchSectionRef = useRef<HTMLDivElement>(null);

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
  const [appliedBatchSummary, setAppliedBatchSummary] =
    useState<AppliedBatchSummary | null>(null);

  // Get data from Redux store
  const { areas, customers, salesmen, vans, products } = useActiveLists();

  const form = useForm<SalesFormData>({
    resolver: zodResolver(salesSchema) as any,
    defaultValues,
    mode: "onChange",
  });

  // Track if form is dirty (has changes) - only relevant for edit mode
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;

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

  // Redirect to ?id=new if no id param is present
  useEffect(() => {
    if (!isReturnMode && !idParam) {
      setSearchParams({ id: "new" }, { replace: true });
    }
  }, [idParam, isReturnMode, setSearchParams]);

  const fetchPreviewInvoiceNo = async () => {
    try {
      const nextNo = await salesService.getNextInvoiceNumber(isReturnMode);
      setPreviewInvoiceNo(nextNo);
    } catch {
      setPreviewInvoiceNo(null);
    }
  };

  useEffect(() => {
    if (isNew && !generatedInvoiceNo) {
      void fetchPreviewInvoiceNo();
    }
  }, [isNew, isReturnMode, generatedInvoiceNo]);

  useEffect(() => {
    if (!invoiceSearchHover.open) return;

    const query = invoiceSearchQuery.trim();
    const timer = setTimeout(
      async () => {
        setIsSearchingInvoice(true);
        try {
          const result = await salesService.getSales(
            1,
            15,
            (query ? { search: query } : {}) as Parameters<
              typeof salesService.getSales
            >[2],
          );
          setInvoiceSearchResults(result.sales ?? []);
        } catch {
          setInvoiceSearchResults([]);
        } finally {
          setIsSearchingInvoice(false);
        }
      },
      query ? 400 : 0,
    );

    return () => clearTimeout(timer);
  }, [invoiceSearchQuery, invoiceSearchHover.open]);

  // Load sale data if editing
  useEffect(() => {
    const loadSaleData = async () => {
      if (!isReturnMode && saleId && !isNew) {
        setIsLoading(true);
        try {
          const saleData = await salesService.getSale(Number(saleId));
          if (saleData) {
            populateFormWithSaleData(saleData);
            setGeneratedSaleId(saleData.id);
            setGeneratedInvoiceNo(saleData.invoiceNo);
            // Reset dirty state after populating form
            form.reset(form.getValues(), { keepDirty: false });
          }
        } catch (error) {
          console.error("Error loading sale:", error);
          toast.error("Failed to load sale data");
          // Redirect to new sale if load fails
          setSearchParams({ id: "new" }, { replace: true });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSaleData();
  }, [saleId, isNew, form, setSearchParams]);

  // Populate form with existing sale data
  const populateFormWithSaleData = (saleData: any) => {
    const mappedItems = (saleData.items ?? []).map((item: any) => {
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
        saleData.invoiceDate?.split("T")[0] ?? defaultValues.invoiceDate,
      areaId: saleData.area?.id ?? 0,
      customerId: saleData.customer?.id ?? 0,
      phoneNo: saleData.customer?.phoneNo ?? "",
      vanId: saleData.van?.id ?? 0,
      salesmanId: saleData.salesman?.id ?? 0,
      address: saleData.address ?? "",
      gstDetails: normalizeGstDetailsValue(saleData.gstDetails),
      items: [defaultValues.items[0], ...mappedItems],
      remarks: saleData.remarks ?? "",
      grossAmount: saleData.grossAmount ?? 0,
      boxUnit: saleData.boxUnit ?? 0,
      cessInsurance: saleData.cessInsurance ?? 0,
      scheme1: saleData.scheme1 ?? 0,
      discountPercent: saleData.discountPercent ?? 0,
      tax: saleData.tax ?? 0,
      amountAdd: saleData.amountAdd ?? 0,
      creditAmount: saleData.creditAmount ?? 0,
      finalAmount: saleData.finalAmount ?? 0,
    });
    setEditingRowIndex(null);
  };

  // --------------------------------------------------------------------
  // Logic: Handle Phone Number Selection
  // --------------------------------------------------------------------
  const handlePhoneSelect = (customerId: number) => {
    const customer = findCustomer(customerId);
    if (customer) {
      form.setValue("phoneNo", customer.phoneNo, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("customerId", customer.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("areaId", customer.areaId || 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("address", customer.address || "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.clearErrors(["phoneNo", "customerId", "areaId", "address"]);

      const currentSalesman = form.getValues("salesmanId");
      const isSalesmanValid = salesmen.find(
        (s: any) => s.id === currentSalesman && s.areaId === customer.areaId,
      );
      if (!isSalesmanValid) {
        form.setValue("salesmanId", 0, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      phoneHover.setOpen(false);
      toast.success(`Customer ${customer.personName} selected`);
    }
  };

  // --------------------------------------------------------------------
  // Logic: Handle Area Selection
  // --------------------------------------------------------------------
  const handleAreaSelect = (selectedAreaId: number) => {
    form.setValue("areaId", selectedAreaId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("customerId", 0, { shouldDirty: true, shouldValidate: true });
    form.setValue("salesmanId", 0, { shouldDirty: true, shouldValidate: true });
    form.setValue("phoneNo", "", { shouldDirty: true });
    form.setValue("address", "", { shouldDirty: true, shouldValidate: true });
    form.clearErrors(["areaId"]);
    areaHover.setOpen(false);
  };

  // --------------------------------------------------------------------
  // Logic: Handle Customer Selection
  // --------------------------------------------------------------------
  const handleCustomerSelect = (selectedCustomerId: number) => {
    const customer = findCustomer(selectedCustomerId);
    if (customer) {
      form.setValue("customerId", customer.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("areaId", customer.areaId || 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("address", customer.address || "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("phoneNo", customer.phoneNo || "", { shouldDirty: true });
      form.clearErrors(["customerId", "areaId", "address"]);

      const currentSalesman = form.getValues("salesmanId");
      const isSalesmanValid = salesmen.find(
        (s: any) => s.id === currentSalesman && s.areaId === customer.areaId,
      );
      if (!isSalesmanValid) {
        form.setValue("salesmanId", 0, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }
    customerHover.setOpen(false);
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

      form.setValue("grossAmount", parseFloat(grossAmount.toFixed(2)), {
        shouldDirty: false,
      });
      form.setValue("tax", parseFloat(tax.toFixed(2)), { shouldDirty: false });
      form.setValue(
        "finalAmount",
        Math.max(0, parseFloat(finalAmount.toFixed(2))),
        { shouldDirty: false },
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
      ? `${product.productCode}, ${
          product.productShortName || product.productBrand
        }`
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
        form.setValue("items", updatedItems, { shouldDirty: true });
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

    form.setValue("items", updatedItems, { shouldDirty: true });
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

      form.setValue("items", updatedItems, { shouldDirty: true });

      setAppliedBatchSummary({
        batchNo: batch.batchNo,
        mfgDate: batch.mfgDate ?? null,
        expDate: batch.expDate ?? null,
        barcode: batch.barcode ?? "",
        stock: batch.openingStock ?? 0,
        mrp: batch.mrp ?? 0,
        rate: batch.saleRate ?? rate,
        pack: cartonPack,
      });

      toast.success(`Batch applied to ${productCode}`, {
        description: `Rate: ₹${rate.toFixed(2)} | A Qty: ${aQty} | M Qty: ${mQty} | Unit: ${unit} | Stock: ${batch.openingStock}`,
      });

      setPendingBatchSelection(null);
      focusField(`aQty-${index}`, 350);
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
  const isRowEditable = (index: number) =>
    isEditMode || index === 0 || editingRowIndex === index;

  const focusField = (fieldId: string, delay = 100) => {
    focusFieldById(fieldId, delay);
  };

  const focusProductSearch = () => focusField("productSearch-0");

  const proceedAddProductRow = () => {
    setEditingRowIndex(null);
    setAppliedBatchSummary(null);
    addProductRow();
    focusProductSearch();
  };

  const confirmProductRow = () => {
    const item = items[0];
    if (!item?.productId) {
      toast.error("Please select a product");
      return;
    }
    if (!item?.batchId) {
      toast.error("Please select a batch");
      return;
    }
    if ((item.aQty ?? 0) <= 0 && (item.fQty ?? 0) <= 0) {
      toast.error("Please enter quantity");
      return;
    }
    const product = item.productId ? findProduct(item.productId) : undefined;
    const innerPack = Number(product?.innerPack || 0);
    const aQty = Number(item.aQty || 0);
    if (innerPack > 0 && aQty > 0 && aQty % innerPack !== 0) {
      const lowerMultiple = Math.floor(aQty / innerPack) * innerPack;
      const upperMultiple = lowerMultiple + innerPack;
      const addQty = upperMultiple - aQty;
      const removeQty = aQty - lowerMultiple;
      setCartonPackWarningText(
        `A Qty must be multiple of inner pack (${innerPack}). Add ${addQty} or remove ${removeQty}.`,
      );
      setCartonPackWarningOpen(true);
      return;
    }
    proceedAddProductRow();
  };

  const handleConfirmProductRow = (index: number) => {
    if (index === 0) {
      confirmProductRow();
      return;
    }
    setEditingRowIndex(null);
  };

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
    form.setValue("items", [newItem, ...items], { shouldDirty: true });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field: string,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      let nextFieldId = "";
      if (field === "rate") nextFieldId = `aQty-${index}`;
      else if (field === "aQty") nextFieldId = `fQty-${index}`;
      else if (field === "fQty") nextFieldId = `DQty-${index}`;
      else if (field === "DQty") nextFieldId = `totalAmount-${index}`;
      else if (field === "totalAmount") nextFieldId = `schPercent-${index}`;
      else if (field === "schPercent") nextFieldId = `taxRate-${index}`;
      else if (field === "taxRate") nextFieldId = `confirmProduct-${index}`;
      if (nextFieldId) {
        focusField(nextFieldId);
      }
    }
  };

  const handleConfirmKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (e.key === "Enter" && index === 0) {
      e.preventDefault();
      confirmProductRow();
    }
  };

  const removeProductRow = (index: number) => {
    if (index === 0) return;
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      form.setValue("items", updatedItems, { shouldDirty: true });
      if (editingRowIndex === index) {
        setEditingRowIndex(null);
      }
    }
  };

  const getDuplicateProductInfo = (index: number, productId: number) => {
    return items.find(
      (item, itemIndex) => itemIndex !== index && item.productId === productId,
    );
  };

  const handleProductSelect = (index: number, productId: number) => {
    const product = findProduct(productId);
    if (product) {
      const duplicateItem = getDuplicateProductInfo(index, product.id);
      if (duplicateItem) {
        const duplicateIndex = items.findIndex(
          (item, itemIndex) =>
            itemIndex !== index && item.productId === product.id,
        );
        setDuplicateProductAlertText(
          `${product.productBrand || product.description || product.productCode} is already added in row ${duplicateIndex + 1} with A Qty: ${duplicateItem.aQty ?? 0}.`,
        );
        setDuplicateProductAlertOpen(true);
        setProductOpen(false);
        setActiveProductIndex(null);
        return;
      }
      setAppliedBatchSummary(null);
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
    const filteredItems = payloadData.items.filter(
      (item) => item.productId > 0,
    );
    if (filteredItems.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    const payload = { ...payloadData, items: filteredItems, boxUnit: 0 };

    setIsSubmitting(true);
    try {
      let response: SalesResponse;

      if (saleId && !isNew) {
        // Update existing sale
        response = await salesService.updateSale(Number(saleId), payload);
        toast.success("Sales updated successfully");

        // Reset dirty state after successful update
        form.reset(data, { keepDirty: false });
        setGeneratedInvoiceNo(response.invoiceNo);
      } else {
        // Create new sale
        response = isReturnMode
          ? await salesService.createSalesReturn(payload)
          : await salesService.createSale(payload);
        toast.success(`${saleLabel} created successfully`);

        // Set generated sale ID and update URL
        if (response?.id) {
          setGeneratedSaleId(response.id);
          setGeneratedInvoiceNo(response.invoiceNo);

          if (!isReturnMode) {
            setSearchParams({ id: response.id.toString() }, { replace: true });
          }

          // Reset dirty state after successful creation
          form.reset(data, { keepDirty: false });
        }
      }
      void refreshActiveLists();
      if (saveAndNewRef.current) {
        saveAndNewRef.current = false;
        handleNewSales();
      }
    } catch (error: any) {
      console.error("Error in form submission:", error);
      toast.error(
        error.message ||
          `Failed to save ${saleLabel.toLowerCase()}. Please try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

  // --------------------------------------------------------------------
  // Navigation handlers
  // --------------------------------------------------------------------
  const handleNewSales = () => {
    // Reset form and navigate to ?id=new
    form.reset(defaultValues);
    setGeneratedSaleId(null);
    setGeneratedInvoiceNo(null);
    setEditingRowIndex(null);
    setAppliedBatchSummary(null);
    void fetchPreviewInvoiceNo();
    if (!isReturnMode) {
      setSearchParams({ id: "new" }, { replace: true });
    }
  };

  const handleSaveArea = async (data: AreaFormData) => {
    setIsMasterSubmitting(true);
    try {
      const created = await areaService.createArea(data);
      await refreshActiveLists();
      form.setValue("areaId", created.id, { shouldDirty: true });
      form.clearErrors(["areaId"]);
      setAreaFormOpen(false);
      toast.success("Area created successfully");
      focusField("vanSearch");
    } catch (error: any) {
      toast.error(error.message || "Failed to create area");
    } finally {
      setIsMasterSubmitting(false);
    }
  };

  const handleSaveVan = async (data: VanFormData) => {
    setIsMasterSubmitting(true);
    try {
      const created = await vanService.createVan(data);
      await refreshActiveLists();
      form.setValue("vanId", created.id, { shouldDirty: true });
      form.clearErrors(["vanId"]);
      setVanFormOpen(false);
      toast.success("Van created successfully");
      focusField("salesmanSearch");
    } catch (error: any) {
      toast.error(error.message || "Failed to create van");
    } finally {
      setIsMasterSubmitting(false);
    }
  };

  const handleSaveSalesman = async (data: SalesmanFormData) => {
    setIsMasterSubmitting(true);
    try {
      const payload = {
        ...data,
        areaId: data.areaId ?? areaId ?? undefined,
      };
      const created = await salesmanService.createSalesman(payload);
      await refreshActiveLists();
      form.setValue("salesmanId", created.id, { shouldDirty: true });
      form.clearErrors(["salesmanId"]);
      setSalesmanFormOpen(false);
      toast.success("Salesman created successfully");
      focusField("customerSearch");
    } catch (error: any) {
      toast.error(error.message || "Failed to create salesman");
    } finally {
      setIsMasterSubmitting(false);
    }
  };

  const handleSaveCustomer = async (data: CustomerFormData) => {
    setIsMasterSubmitting(true);
    try {
      const payload = {
        ...data,
        areaId: data.areaId ?? areaId ?? null,
      };
      const created = await customerService.createCustomer(payload);
      await refreshActiveLists();
      handleCustomerSelect(created.id);
      setCustomerFormOpen(false);
      toast.success("Customer created successfully");
      focusField("productSearch-0");
    } catch (error: any) {
      toast.error(error.message || "Failed to create customer");
    } finally {
      setIsMasterSubmitting(false);
    }
  };

  const handleSaveAndNew = () => {
    saveAndNewRef.current = true;
    form.handleSubmit(onSubmit, onError)();
  };

  const scrollToInvoiceSearch = () => {
    invoiceSearchSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    invoiceSearchHover.setOpen(true);
  };

  const handleDeleteSale = async () => {
    if (!saleId || isNew) return;
    setIsDeleting(true);
    try {
      await salesService.deleteSale(Number(saleId));
      toast.success("Sales deleted successfully");
      void refreshActiveLists();
      navigate("/sales");
    } catch {
      toast.error("Failed to delete sales");
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleBillPreview = () => {
    const idToPreview = getPreviewSaleId();
    if (idToPreview > 0) {
      setPreviewSaleId(idToPreview);
      setIsPreviewOpen(true);
    } else {
      toast.error("Save the invoice first to preview");
    }
  };

  const getPreviewSaleId = () =>
    Number(
      isReturnMode ? generatedSaleId || 0 : saleId || generatedSaleId || 0,
    );

  const getPrintDocumentName = (id: number) => {
    const safeInvoiceNo = (generatedInvoiceNo || `sale-${id}`)
      .toString()
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    return `sales-invoice-${safeInvoiceNo}.pdf`;
  };

  const handleDownloadPdf = async () => {
    const idToPreview = getPreviewSaleId();
    if (idToPreview <= 0) {
      toast.error("Save the invoice first to download PDF");
      return;
    }
    setIsDownloadingPdf(true);
    try {
      const blob = await salesService.downloadSalesBillPreviewPDF(idToPreview);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeInvoiceNo = (generatedInvoiceNo || `sale-${idToPreview}`)
        .toString()
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `sales-invoice-${safeInvoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintBill = async () => {
    const idToPreview = getPreviewSaleId();
    if (idToPreview <= 0) {
      toast.error("Save the invoice first to print");
      return;
    }
    setIsPrinting(true);
    try {
      const blob = await salesService.downloadSalesBillPreviewPDF(idToPreview);
      await printPdfBlob(blob);
    } catch {
      toast.error("Failed to open print preview");
    } finally {
      setIsPrinting(false);
    }
  };

  // Save the invoice first (if new/dirty), then trigger browser print on the PDF
  const handleSaveAndPrint = async () => {
    setIsPrinting(true);
    try {
      // If there's already a saved ID, just print directly
      const existingId = getPreviewSaleId();
      if (existingId > 0 && !isDirty) {
        const blob =
          await salesService.downloadSalesBillPreviewPDF(existingId);
        await printPdfBlob(blob, {
          silent: true,
          documentName: getPrintDocumentName(existingId),
        });
        return;
      }

      // Otherwise, save first
      await new Promise<void>((resolve, reject) => {
        form.handleSubmit(
          async (data) => {
            try {
              await onSubmit(data);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          (errors) => {
            console.error("Form validation errors:", errors);
            reject(new Error("Validation failed"));
          },
        )();
      });

      // After saving, get the ID and print
      // Wait a tick for state to update
      await new Promise((r) => setTimeout(r, 300));
      const savedId = getPreviewSaleId();
      if (savedId > 0) {
        const blob = await salesService.downloadSalesBillPreviewPDF(savedId);
        await printPdfBlob(blob, {
          silent: true,
          documentName: getPrintDocumentName(savedId),
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to print";
      if (message !== "Print canceled") {
        toast.error(message);
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDmPrint = () => {
    const damageItems = items.filter(
      (item) => item.productId > 0 && (item.DQty ?? 0) > 0,
    );
    if (damageItems.length === 0) {
      toast.info("No damaged items to print");
      return;
    }

    const customerName = findCustomerName(form.getValues("customerId")) || "—";
    const invoiceNo = generatedInvoiceNo || "Draft";
    const invoiceDate = form.getValues("invoiceDate") || "—";
    const rowsHtml = damageItems
      .map(
        (item, idx) => `
        <tr>
          <td style="border:1px solid #ccc;padding:4px;text-align:center">${idx + 1}</td>
          <td style="border:1px solid #ccc;padding:4px">${findProductName(item.productId)}</td>
          <td style="border:1px solid #ccc;padding:4px;text-align:right">${item.DQty ?? 0}</td>
          <td style="border:1px solid #ccc;padding:4px;text-align:right">${(item.rate ?? 0).toFixed(2)}</td>
          <td style="border:1px solid #ccc;padding:4px;text-align:right">${((item.DQty ?? 0) * (item.rate ?? 0)).toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>DM Print - ${invoiceNo}</title></head>
        <body style="font-family:Arial,sans-serif;padding:16px">
          <h2 style="margin:0 0 8px">Damage Memo (DM)</h2>
          <p style="margin:0 0 4px"><strong>Invoice:</strong> ${invoiceNo}</p>
          <p style="margin:0 0 4px"><strong>Date:</strong> ${invoiceDate}</p>
          <p style="margin:0 0 12px"><strong>Customer:</strong> ${customerName}</p>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="background:#f3f4f6">
                <th style="border:1px solid #ccc;padding:4px">Sr</th>
                <th style="border:1px solid #ccc;padding:4px">Product</th>
                <th style="border:1px solid #ccc;padding:4px">DM Qty</th>
                <th style="border:1px solid #ccc;padding:4px">Rate</th>
                <th style="border:1px solid #ccc;padding:4px">Amount</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  };

  const handleBackToSales = () => {
    navigate("/sales");
  };

  const handleLoadSalesInvoice = async (summary: Sales) => {
    try {
      setIsLoading(true);
      const full = await salesService.getSale(summary.id);
      const issues: string[] = [];

      for (const item of full.items ?? []) {
        const code =
          item.productCode ||
          (item as { product?: { productCode?: string } }).product
            ?.productCode ||
          `Product #${item.productId}`;

        if (!item.batchId) {
          issues.push(`${code}: batch information is missing`);
          continue;
        }

        try {
          const batchData = await productService.getProductBatches(
            item.productId,
          );
          const batch = batchData.batches.find((b) => b.id === item.batchId);
          if (!batch) {
            issues.push(`${code}: batch is not in active stock`);
          } else if ((batch.openingStock ?? 0) < item.aQty) {
            issues.push(
              `${code}: insufficient stock in batch ${batch.batchNo} (need ${item.aQty}, available ${batch.openingStock})`,
            );
          }
        } catch {
          issues.push(`${code}: could not verify batch stock`);
        }
      }

      if (issues.length > 0) {
        toast.error("Cannot load this invoice", {
          description:
            issues.slice(0, 4).join(". ") +
            (issues.length > 4 ? ` (+${issues.length - 4} more issues)` : ""),
        });
        return;
      }

      populateFormWithSaleData(full);
      setGeneratedSaleId(null);
      setGeneratedInvoiceNo(null);
      if (!isReturnMode) {
        setSearchParams({ id: "new" }, { replace: true });
      }
      form.clearErrors();
      form.reset(form.getValues(), { keepDirty: false });
      invoiceSearchHover.setOpen(false);
      setInvoiceSearchQuery("");
      toast.success(
        `Invoice ${full.invoiceNo} loaded. Saving will create a new invoice.`,
      );
    } catch {
      toast.error("Failed to load invoice data");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if bill preview should be visible
  const canShowBillPreview = isReturnMode
    ? !!generatedSaleId
    : !!saleId || !!generatedSaleId;
  const isEditMode = !isReturnMode && !!saleId && !isNew;

  // Determine if update button should be enabled (only in edit mode when dirty)
  const isUpdateEnabled = isEditMode && isDirty && isValid;
  const isCreateEnabled = isNew && isValid;
  const dummyRowCount = Math.max(MIN_TABLE_ROWS - items.length, 0);
  const totalScheme = items.reduce(
    (sum, item) => sum + (item.schAmount || 0),
    0,
  );

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-2 pb-56">
      <div
        className={`mx-auto ${
          CheckIsExpanded()
            ? "max-w-5xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-9xl"
            : "max-w-9xl lg:max-w-5xl xl:max-w-8xl 2xl:max-w-10xl"
        }`}
      >
        {/* Header */}

        {/* Show unsaved changes indicator in edit mode */}
        {isEditMode && isDirty && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            You have unsaved changes
          </div>
        )}

        <Form {...form}>
          <form
            data-entry-form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-4"
          >
            {/* Invoice Details */}
            <Card className="p-3">
              <CardContent className="p-0 pt-1">
                {generatedInvoiceNo && (
                  <div className="flex justify-end mb-2">
                    <Badge variant="secondary">{generatedInvoiceNo}</Badge>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {isNew && !generatedInvoiceNo && previewInvoiceNo && (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="previewInvoiceNo"
                            value={previewInvoiceNo}
                            placeholder="Invoice No."
                            className="pl-10"
                            disabled
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}

                  {/* Invoice Date */}
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <HoverDateInput
                            value={field.value ?? ""}
                            onChange={(value) => {
                              field.onChange(value);
                              form.setValue("invoiceDate", value, {
                                shouldDirty: true,
                              });
                            }}
                            placeholder="Invoice Date *"
                            inputClassName={cn(
                              "pl-10",
                              fieldState.error && "border-destructive",
                            )}
                            aria-invalid={!!fieldState.error}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* GST Details */}
                  <FormField
                    control={form.control}
                    name="gstDetails"
                    render={({ field, fieldState }) => (
                      <FormItem className="flex flex-col">
                        <FormControl>
                          <InlineSearchField
                            inputId="gstDetailsSearch"
                            open={gstHover.open}
                            onOpenChange={gstHover.setOpen}
                            displayValue={
                              field.value ? getGstDetailsLabel(field.value) : ""
                            }
                            placeholder="Tax Details *"
                            emptyMessage="No tax option found."
                            onMouseEnter={gstHover.onMouseEnter}
                            onMouseLeave={gstHover.onMouseLeave}
                            disabled={isSubmitting}
                            onAfterEnterSelect={() => focusField("areaSearch")}
                          >
                            <CommandGroup>
                              {gst_details.map((gst) => (
                                <CommandItem
                                  key={gst.id}
                                  value={`${gst.id} ${gst.type}`}
                                  onSelect={() => {
                                    field.onChange(String(gst.id));
                                    form.setValue(
                                      "gstDetails",
                                      String(gst.id),
                                      { shouldDirty: true },
                                    );
                                    form.clearErrors(["gstDetails"]);
                                    gstHover.setOpen(false);
                                    focusField("areaSearch");
                                  }}
                                >
                                  <span className="font-medium">
                                    {gst.type}
                                  </span>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      String(gst.id) === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </InlineSearchField>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Area */}
                  <FormField
                    control={form.control}
                    name="areaId"
                    render={({ field, fieldState }) => (
                      <FormItem className="flex flex-col">
                        <FormControl>
                          <MasterFieldWithAdd
                            onAdd={() => setAreaFormOpen(true)}
                            disabled={isSubmitting}
                            addLabel="Add area"
                          >
                          <InlineSearchField
                            inputId="areaSearch"
                            open={areaHover.open}
                            onOpenChange={areaHover.setOpen}
                            displayValue={
                              field.value ? findAreaName(field.value) : ""
                            }
                            placeholder="Area *"
                            emptyMessage="No area found."
                            onMouseEnter={areaHover.onMouseEnter}
                            onMouseLeave={areaHover.onMouseLeave}
                            disabled={isSubmitting}
                            onAfterEnterSelect={() => focusField("vanSearch")}
                          >
                            <CommandGroup>
                              {areas.map((area) => (
                                <CommandItem
                                  key={area.id}
                                  value={`${area.id} ${area.name} ${area.city || ""}`}
                                  onSelect={() => {
                                    handleAreaSelect(area.id);
                                    focusField("vanSearch");
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
                          </MasterFieldWithAdd>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="address"
                              placeholder="Address"
                              className={cn(
                                "pl-10",
                                fieldState.error && "border-destructive",
                              )}
                              aria-invalid={!!fieldState.error}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                form.setValue("address", e.target.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  focusField("vanSearch");
                                }
                              }}
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Invoice Search */}
                  {!isReturnMode && (
                    <div ref={invoiceSearchSectionRef}>
                      <FormItem className="flex flex-col">
                        <InlineSearchField
                          open={invoiceSearchHover.open}
                          onOpenChange={invoiceSearchHover.setOpen}
                          displayValue={invoiceSearchQuery}
                          searchValue={invoiceSearchQuery}
                          onSearchChange={setInvoiceSearchQuery}
                          placeholder="Search Invoice"
                          emptyMessage={
                            isSearchingInvoice
                              ? "Searching..."
                              : "No invoice found."
                          }
                          shouldFilter={false}
                          onMouseEnter={invoiceSearchHover.onMouseEnter}
                          onMouseLeave={invoiceSearchHover.onMouseLeave}
                          disabled={isSubmitting}
                        >
                          {!isSearchingInvoice &&
                            invoiceSearchResults.length > 0 && (
                              <CommandGroup>
                                {invoiceSearchResults.map((sale) => (
                                  <CommandItem
                                    key={sale.id}
                                    value={sale.invoiceNo}
                                    onSelect={() =>
                                      handleLoadSalesInvoice(sale)
                                    }
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {sale.invoiceNo}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {sale.customer?.personName} •{" "}
                                        {new Date(
                                          sale.invoiceDate,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                        </InlineSearchField>
                      </FormItem>
                    </div>
                  )}

                  {/* Van */}
                  <FormField
                    control={form.control}
                    name="vanId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormControl>
                          <MasterFieldWithAdd
                            onAdd={() => setVanFormOpen(true)}
                            disabled={isSubmitting}
                            addLabel="Add van"
                          >
                          <InlineSearchField
                            inputId="vanSearch"
                            open={vanHover.open}
                            onOpenChange={vanHover.setOpen}
                            displayValue={
                              field.value ? findVanName(field.value) : ""
                            }
                            placeholder="Van Salesman"
                            emptyMessage="No van found."
                            onMouseEnter={vanHover.onMouseEnter}
                            onMouseLeave={vanHover.onMouseLeave}
                            disabled={isSubmitting}
                            onAfterEnterSelect={() => focusField("salesmanSearch")}
                          >
                            <CommandGroup>
                              {vans.map((van) => (
                                <CommandItem
                                  key={van.id}
                                  value={`${van.id} ${van.name} ${van.vehicleNo || ""}`}
                                  onSelect={() => {
                                    field.onChange(van.id);
                                    form.clearErrors(["vanId"]);
                                    vanHover.setOpen(false);
                                    focusField("salesmanSearch");
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
                          </MasterFieldWithAdd>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Salesman */}
                  <FormField
                    control={form.control}
                    name="salesmanId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormControl>
                          <MasterFieldWithAdd
                            onAdd={() => setSalesmanFormOpen(true)}
                            disabled={isSubmitting || !areaId}
                            addLabel="Add salesman"
                          >
                          <InlineSearchField
                            inputId="salesmanSearch"
                            open={salesmanHover.open}
                            onOpenChange={salesmanHover.setOpen}
                            displayValue={
                              field.value ? findSalesmanName(field.value) : ""
                            }
                            placeholder="Salesman"
                            emptyMessage={
                              areaId
                                ? "No salesman found in this area."
                                : "Please select an area first."
                            }
                            onMouseEnter={salesmanHover.onMouseEnter}
                            onMouseLeave={salesmanHover.onMouseLeave}
                            disabled={isSubmitting || !areaId}
                            onAfterEnterSelect={() =>
                              focusField("customerSearch")
                            }
                          >
                            <CommandGroup>
                              {filteredSalesmen.map((salesman: any) => (
                                <CommandItem
                                  key={salesman.id}
                                  value={`${salesman.id} ${salesman.name} ${salesman.phoneNo || ""}`}
                                  onSelect={() => {
                                    field.onChange(salesman.id);
                                    form.clearErrors(["salesmanId"]);
                                    salesmanHover.setOpen(false);
                                    focusField("customerSearch");
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
                          </MasterFieldWithAdd>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Customer */}
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field, fieldState }) => (
                      <FormItem className="flex flex-col">
                        <FormControl>
                          <MasterFieldWithAdd
                            onAdd={() => setCustomerFormOpen(true)}
                            disabled={isSubmitting || !areaId}
                            addLabel="Add customer"
                          >
                          <InlineSearchField
                            inputId="customerSearch"
                            open={customerHover.open}
                            onOpenChange={customerHover.setOpen}
                            displayValue={
                              field.value ? findCustomerName(field.value) : ""
                            }
                            placeholder="Customer *"
                            emptyMessage={
                              areaId
                                ? "No customer found in this area."
                                : "Please select an area first."
                            }
                            onMouseEnter={customerHover.onMouseEnter}
                            onMouseLeave={customerHover.onMouseLeave}
                            disabled={isSubmitting || !areaId}
                            onAfterEnterSelect={() =>
                              focusField("productSearch-0")
                            }
                          >
                            <CommandGroup>
                              {filteredCustomers.map((customer: Customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={`${customer.id} ${customer.companyName || customer.personName} ${customer.phoneNo || ""}`}
                                  onSelect={() => {
                                    handleCustomerSelect(customer.id);
                                    customerHover.setOpen(false);
                                    focusField("productSearch-0");
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
                          </MasterFieldWithAdd>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNo"
                  render={({ field }) => <input type="hidden" {...field} />}
                />
              </CardContent>
            </Card>

            {/* Products Table Section */}
            <Card className="p-2">
              <CardContent className="p-0 pt-1">
                <div className="w-full overflow-x-auto">
                  <div className="w-full overflow-x-auto border rounded-lg">
                    <Table
                      className={cn(
                        "w-full",
                        layoutMode === "classic" && "classic-table",
                      )}
                    >
                      <TableHeader>
                        <TableRow className="bg-secondary/50">
                          <TableHead className="font-semibold w-10 text-center">
                            #
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
                          {items.map((item, index) => {
                            const editable = isRowEditable(index);
                            const isEntryRow = index === 0;
                            const rowNumber =
                              index > 0 && item.productId > 0 ? index : null;
                            return (
                              <motion.tr
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={cn(
                                  "hover:bg-secondary/30",
                                  !editable && "bg-muted/20",
                                )}
                              >
                                <TableCell className="text-center w-10">
                                  {rowNumber !== null ? (
                                    <span className="text-sm font-semibold text-muted-foreground">
                                      {rowNumber}
                                    </span>
                                  ) : (
                                    <span className="text-transparent select-none">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                                {/* Product Selection */}
                                <TableCell>
                                  {editable ? (
                                    <InlineSearchField
                                      inputId={`productSearch-${index}`}
                                      enterNextFieldId={
                                        item.productId && item.batchId
                                          ? `aQty-${index}`
                                          : undefined
                                      }
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
                                          : ""
                                      }
                                      placeholder="Search products..."
                                      emptyMessage="No product found."
                                      disabled={isSubmitting}
                                    >
                                      <CommandGroup>
                                        {products.map((product) => (
                                          <CommandItem
                                            key={product.id}
                                            value={`${product.id} ${product.productCode} ${product.productShortName || ""} ${product.description}`}
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
                                                {product.productShortName ||
                                                  product.productBrand}
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
                                  ) : (
                                    <span className="text-sm font-medium">
                                      {item.productId
                                        ? findProductName(item.productId)
                                        : "—"}
                                    </span>
                                  )}
                                </TableCell>

                                {/* Rate */}
                                <TableCell>
                                  {editable ? (
                                    <div className="relative">
                                      <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                      <Input
                                        id={`rate-${index}`}
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
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, index, "rate")
                                        }
                                        className="w-24 pl-7"
                                        disabled={isSubmitting}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-sm">
                                      ₹{(item.rate ?? 0).toFixed(2)}
                                    </span>
                                  )}
                                </TableCell>

                                {/* A. Qty */}
                                <TableCell>
                                  {editable ? (
                                    <Input
                                      id={`aQty-${index}`}
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
                                      onKeyDown={(e) =>
                                        handleKeyDown(e, index, "aQty")
                                      }
                                      className="w-20"
                                      disabled={isSubmitting}
                                    />
                                  ) : (
                                    <span className="text-sm">
                                      {item.aQty ?? 0}
                                    </span>
                                  )}
                                </TableCell>

                                {/* Fr (Free Qty) */}
                                <TableCell>
                                  {editable ? (
                                    <Input
                                      id={`fQty-${index}`}
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
                                      onKeyDown={(e) =>
                                        handleKeyDown(e, index, "fQty")
                                      }
                                      className="w-20"
                                      disabled={isSubmitting}
                                    />
                                  ) : (
                                    <span className="text-sm">
                                      {item.fQty ?? 0}
                                    </span>
                                  )}
                                </TableCell>

                                {/* Dm (Damaged Qty) */}
                                <TableCell>
                                  {editable ? (
                                    <Input
                                      id={`DQty-${index}`}
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
                                      onKeyDown={(e) =>
                                        handleKeyDown(e, index, "DQty")
                                      }
                                      className="w-20"
                                      disabled={isSubmitting}
                                    />
                                  ) : (
                                    <span className="text-sm">
                                      {item.DQty ?? 0}
                                    </span>
                                  )}
                                </TableCell>

                                {/* M. Qty */}
                                <TableCell>
                                  <span className="text-sm">
                                    {item.mQty.toFixed(0) ?? 0}
                                  </span>
                                </TableCell>

                                {/* Unit */}
                                <TableCell>
                                  <span className="text-sm">
                                    {item.unit.toFixed(0) ?? 0}
                                  </span>
                                </TableCell>

                                {/* Amount (inclusive) */}
                                <TableCell>
                                  {editable ? (
                                    <div className="relative">
                                      <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                      <Input
                                        id={`totalAmount-${index}`}
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
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, index, "totalAmount")
                                        }
                                        className="w-24 pl-7"
                                        disabled={isSubmitting}
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-sm">
                                      ₹{(item.totalAmount ?? 0).toFixed(2)}
                                    </span>
                                  )}
                                </TableCell>

                                {/* Sch% */}
                                <TableCell className="max-w-16">
                                  {editable ? (
                                    <div className="relative">
                                      <Input
                                        id={`schPercent-${index}`}
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
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, index, "schPercent")
                                        }
                                        className="w-14 pl-6"
                                        disabled={isSubmitting}
                                      />
                                      <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    </div>
                                  ) : (
                                    <span className="text-sm">
                                      {item.schPercent ?? 0}%
                                    </span>
                                  )}
                                </TableCell>

                                {/* Sch Amount */}
                                <TableCell>
                                  <div className="font-medium text-sm">
                                    ₹{(item.schAmount ?? 0).toFixed(2)}
                                  </div>
                                </TableCell>

                                {/* Tax Rate */}
                                <TableCell className="max-w-16">
                                  {editable ? (
                                    <div className="relative">
                                      <Input
                                        id={`taxRate-${index}`}
                                        type="number"
                                        step="0.01"
                                        value={item.taxRate ?? 0}
                                        data-enter-next={
                                          item.batchId
                                            ? `confirmProduct-${index}`
                                            : undefined
                                        }
                                        onChange={(e) =>
                                          handleItemChange(
                                            index,
                                            "taxRate",
                                            parseFloat(e.target.value) || 0,
                                          )
                                        }
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, index, "taxRate")
                                        }
                                        className="w-14 pl-6"
                                        disabled={isSubmitting}
                                      />
                                      <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    </div>
                                  ) : (
                                    <span className="text-sm">
                                      {item.taxRate ?? 0}%
                                    </span>
                                  )}
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
                                  {editable ? (
                                    <div className="flex gap-1">
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
                                        tabIndex={item.batchId ? -1 : undefined}
                                        {...(item.batchId
                                          ? { "data-skip-field-nav": true }
                                          : {})}
                                      >
                                        <Layers className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        id={`confirmProduct-${index}`}
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        onClick={() =>
                                          handleConfirmProductRow(index)
                                        }
                                        onKeyDown={(e) =>
                                          handleConfirmKeyDown(e, index)
                                        }
                                        disabled={isSubmitting}
                                        className="h-7 w-7 p-0"
                                        title={
                                          isEntryRow
                                            ? "Add product"
                                            : "Done editing"
                                        }
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          disabled={isSubmitting}
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() =>
                                            setEditingRowIndex(index)
                                          }
                                        >
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() =>
                                            removeProductRow(index)
                                          }
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                          {Array.from({ length: dummyRowCount }).map(
                            (_, dummyIndex) => (
                              <TableRow
                                key={`dummy-row-${dummyIndex}`}
                                className="h-11 bg-muted/5 pointer-events-none"
                              >
                                {Array.from({ length: 15 }).map(
                                  (_, cellIndex) => (
                                    <TableCell
                                      key={`dummy-cell-${dummyIndex}-${cellIndex}`}
                                      className="py-2"
                                    >
                                      <span className="text-transparent select-none">
                                        —
                                      </span>
                                    </TableCell>
                                  ),
                                )}
                              </TableRow>
                            ),
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

            {/* Fixed bottom: remarks + summary + actions */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
              <div className="border-b bg-muted/30 px-3 py-2">
                <div className="mx-auto flex flex-wrap items-end gap-3 max-w-[1600px]">
                  <div className="w-full sm:w-48 shrink-0">
                    <FormField
                      control={form.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Remarks
                          </span>
                          <FormControl>
                            <Textarea
                              placeholder="Remarks..."
                              className="min-h-[52px] max-h-[52px] text-sm resize-none"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                form.setValue("remarks", e.target.value, {
                                  shouldDirty: true,
                                });
                              }}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Invoice Summary
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2">
                      <div className="bg-summary-bg-1 rounded-lg p-2 border border-summary-border-1 grey-block">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-medium text-summary-text-1">
                            Gross
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
                                  <IndianRupee className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-summary-text-1" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    readOnly
                                    disabled
                                    className="pl-6 h-7 text-xs bg-white dark:bg-gray-900/80 border-summary-border-1 text-summary-text-1 font-medium"
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="bg-summary-bg-2 rounded-lg p-2 border border-summary-border-2 yellow-block">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-medium text-summary-text-2">
                            Box/Unit
                          </span>
                          <Package className="h-3 w-3 text-summary-icon-2" />
                        </div>
                        <Input
                          type="text"
                          value={`${totalCartons.toFixed(2)}/${totalUnits.toFixed(2)}`}
                          readOnly
                          disabled
                          className="h-7 text-xs bg-white dark:bg-gray-900/80 border-summary-border-2 text-summary-text-2 font-medium text-center"
                        />
                      </div>

                      <div className="bg-summary-bg-3 rounded-lg p-2 border border-summary-border-3 yellow-block">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-medium text-summary-text-3">
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
                                  <IndianRupee className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-summary-text-3" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      form.setValue(
                                        "cessInsurance",
                                        parseFloat(e.target.value) || 0,
                                        { shouldDirty: true },
                                      );
                                    }}
                                    disabled={isSubmitting}
                                    className="pl-6 h-7 text-xs bg-white dark:bg-gray-900/80 border-summary-border-3 text-summary-text-3 font-medium"
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="bg-summary-bg-5 rounded-lg p-2 border border-summary-border-5 yellow-block">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-medium text-summary-text-5">
                            Disc %
                          </span>
                          <Percent className="h-3 w-3 text-summary-icon-5" />
                        </div>
                        <FormField
                          control={form.control}
                          name="discountPercent"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    form.setValue(
                                      "discountPercent",
                                      parseFloat(e.target.value) || 0,
                                      { shouldDirty: true },
                                    );
                                  }}
                                  disabled={isSubmitting}
                                  className="h-7 text-xs bg-white dark:bg-gray-900/80 border-summary-border-5 text-summary-text-5 font-medium text-center"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="bg-summary-bg-6 rounded-lg p-2 border border-summary-border-6 grey-block">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-medium text-summary-text-6">
                            Tax
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
                                  <IndianRupee className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-summary-text-6" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    readOnly
                                    disabled
                                    className="pl-6 h-7 text-xs bg-white dark:bg-gray-900/80 border-summary-border-6 text-summary-text-6 font-medium"
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="bg-summary-bg-7 rounded-lg p-2 border border-summary-border-7">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-medium text-summary-text-7">
                            Add Amt
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
                                  <IndianRupee className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-summary-text-7" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      form.setValue(
                                        "amountAdd",
                                        parseFloat(e.target.value) || 0,
                                        { shouldDirty: true },
                                      );
                                    }}
                                    disabled={isSubmitting}
                                    className="pl-6 h-7 text-xs bg-white dark:bg-gray-900/80 border-summary-border-7 text-summary-text-7 font-medium"
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="bg-summary-bg-8 rounded-lg p-2 border border-summary-border-8">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-medium text-summary-text-8">
                            Credit
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
                                  <IndianRupee className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-summary-text-8" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      form.setValue(
                                        "creditAmount",
                                        parseFloat(e.target.value) || 0,
                                        { shouldDirty: true },
                                      );
                                    }}
                                    disabled={isSubmitting}
                                    className="pl-6 h-7 text-xs bg-white dark:bg-gray-900/80 border-summary-border-8 text-summary-text-8 font-medium"
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="bg-summary-bg-4 rounded-lg p-2 border border-summary-border-4 grey-block">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-medium text-summary-text-4">
                            Tot Sch
                          </span>
                          <Gift className="h-3 w-3 text-summary-icon-4" />
                        </div>
                        <div className="relative">
                          <IndianRupee className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-summary-text-4" />
                          <Input
                            type="number"
                            step="0.01"
                            value={totalScheme.toFixed(2)}
                            readOnly
                            disabled
                            className="pl-6 h-7 text-xs bg-white dark:bg-gray-900/80 border-summary-border-4 text-summary-text-4 font-medium"
                          />
                        </div>
                      </div>

                      <div className="bg-summary-bg-final rounded-lg p-2 border border-summary-border-final">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-semibold text-summary-text-final">
                            Final Amt
                          </span>
                          <DollarSign className="h-3 w-3 text-summary-icon-final" />
                        </div>
                        <FormField
                          control={form.control}
                          name="finalAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <IndianRupee className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-summary-text-final" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    readOnly
                                    disabled
                                    className="pl-6 h-7 text-xs font-bold bg-white/10 dark:bg-gray-900/80 border-summary-border-final text-summary-text-final"
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

              <div className="px-3 py-2.5 bg-background">
                <div className="mx-auto flex items-center gap-2 max-w-[1600px] flex-nowrap overflow-hidden">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={scrollToInvoiceSearch}
                    disabled={isSubmitting || isReturnMode}
                    aria-label="Search invoice"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                    disabled={
                      isSubmitting || isReturnMode || !saleId || isNew
                    }
                    aria-label="Delete invoice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  {appliedBatchSummary && (
                    <AppliedBatchSummaryBar
                      summary={appliedBatchSummary}
                      rateLabel="S. Rate"
                    />
                  )}

                  <div className="flex items-center gap-2 shrink-0 ml-auto flex-nowrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleBillPreview}
                      disabled={isSubmitting || !canShowBillPreview}
                      aria-label="Preview PDF"
                      title="Preview PDF"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1 px-2 font-semibold text-xs"
                      onClick={handleSaveAndPrint}
                      disabled={isSubmitting || isPrinting}
                      aria-label="Save and Print"
                      title="Save and Print"
                    >
                      {isPrinting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Save and Print
                          <Printer className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleDownloadPdf}
                      disabled={
                        isSubmitting || isDownloadingPdf || !canShowBillPreview
                      }
                      aria-label="Download PDF"
                      title="PDF"
                    >
                      {isDownloadingPdf ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    {!isEditMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSaveAndNew}
                        disabled={isSubmitting}
                        className="gap-1.5"
                      >
                        <FilePlus className="h-4 w-4" />
                        Save & New
                      </Button>
                    )}
                    {isEditMode && !isNew && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleNewSales}
                        disabled={isSubmitting}
                        className="gap-1.5"
                      >
                        <FilePlus className="h-4 w-4" />
                        New
                      </Button>
                    )}
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting || (isEditMode && !isDirty)}
                      className="gap-1.5"
                      title={isEditMode && !isDirty ? "No changes made" : ""}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSubmitting
                        ? "Saving..."
                        : isEditMode
                          ? "Update"
                          : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBackToSales}
                      disabled={isSubmitting}
                      className="gap-1.5"
                    >
                      <LogOut className="h-4 w-4" />
                      Exit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Form>

        <CustomAlert
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          mainText="Delete Sales"
          subText={
            generatedInvoiceNo
              ? `Are you sure you want to delete invoice "${generatedInvoiceNo}"? This action cannot be undone.`
              : "Are you sure you want to delete this invoice? This action cannot be undone."
          }
          nextButtonText={isDeleting ? "Deleting..." : "Delete"}
          cancelButtonText="Cancel"
          onNext={handleDeleteSale}
          variant="destructive"
          showCancel={true}
        />
        <CustomAlert
          open={cartonPackWarningOpen}
          onOpenChange={setCartonPackWarningOpen}
          mainText="Carton Pack Warning"
          subText={cartonPackWarningText}
          nextButtonText="OK"
          cancelButtonText="Cancel"
          onNext={() => {
            setCartonPackWarningOpen(false);
            proceedAddProductRow();
          }}
          variant="default"
          showCancel={true}
        />
        <CustomAlert
          open={duplicateProductAlertOpen}
          onOpenChange={setDuplicateProductAlertOpen}
          mainText="Duplicate Product"
          subText={duplicateProductAlertText}
          nextButtonText="OK"
          onNext={() => setDuplicateProductAlertOpen(false)}
          variant="default"
          showCancel={false}
        />

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

        <SalesInvoicePreview
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          saleId={previewSaleId}
        />

        <AreaForm
          open={areaFormOpen}
          onOpenChange={setAreaFormOpen}
          onSave={handleSaveArea}
          isSubmitting={isMasterSubmitting}
        />
        <VanForm
          open={vanFormOpen}
          onOpenChange={setVanFormOpen}
          onSave={handleSaveVan}
          isSubmitting={isMasterSubmitting}
        />
        <SalesmanForm
          open={salesmanFormOpen}
          onOpenChange={setSalesmanFormOpen}
          onSave={handleSaveSalesman}
          isSubmitting={isMasterSubmitting}
        />
        <CustomerForm
          open={customerFormOpen}
          onOpenChange={setCustomerFormOpen}
          onSave={handleSaveCustomer}
          isSubmitting={isMasterSubmitting}
        />
      </div>
    </div>
  );
}
