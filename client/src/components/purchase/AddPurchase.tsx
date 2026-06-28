import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  ArrowLeft,
  Save,
  Printer,
  FilePlus,
} from "lucide-react";
import { toast } from "sonner";
import { refreshActiveLists } from "@/utils/refreshActiveLists";
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
import { useTheme } from "@/contexts/ThemeProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { PurchaseFormData } from "@/types/purchase";
import BatchSelectionModal from "@/components/forms/BatchSelection";
import { useActiveLists } from "@/hooks/useActiveLists";
import {
  gst_details,
  GST_DETAILS_DEFAULT_ID,
  normalizeGstDetailsValue,
} from "@/store/dropdown_data/gst_details";
import { purchaseService } from "@/services/purchaseService";
import { productService } from "@/services/productService";
import type { Purchase } from "@/types/purchase";
import { useHoverOpen } from "@/hooks/useHoverOpen";
import { containerVariants, itemVariants } from "@/components/FramerVariants";
import { CheckIsExpanded } from "@/utils/commonHelper";
import PurchaseInvoicePreview from "./PurchaseInvoicePreview";

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

interface PurchaseResponse {
  id: number;
  invoiceNo: string;
  [key: string]: any;
}

interface AddPurchaseProps {
  mode?: "purchase" | "return";
}

// ----------------------------------------------------------------------
// Schema
// ----------------------------------------------------------------------
const purchaseSchema = z.object({
  invoiceDate: z.string().min(1, "Invoice date is required"),
  supplierId: z.coerce.number().min(1, "Supplier is required"),
  gstDetails: z.string().optional(),

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
        batchId: z.coerce.number().optional(),
        cartonPack: z.coerce.number().optional(),
        conversionFactor: z.coerce.number().optional(),
        productBrand: z.string().optional(),
      }),
    )
    .min(1, "At least one product item is required"),

  remarks: z.string().optional(),
  grossAmount: z.coerce.number().min(0, "Gross amount must be positive"),
  boxUnit: z.coerce.number().min(0).default(0),
  cessInsurance: z.coerce.number().min(0).default(0),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  tax: z.coerce.number().min(0).default(0),
  amountAdd: z.coerce.number().min(0).default(0),
  creditAmount: z.coerce.number().min(0).default(0),
  finalAmount: z.coerce.number().positive("Final amount must be positive"),
});

const emptyItem: PurchaseFormData["items"][0] = {
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
  batchId: undefined,
  cartonPack: 0,
  conversionFactor: 0,
  productBrand: "",
  sch1Percent: 0,
  sch1Amount: 0,
  sch2Percent: 0,
  sch2Amount: 0,
};

// ----------------------------------------------------------------------
// Initial Values
// ----------------------------------------------------------------------
const defaultValues: PurchaseFormData = {
  invoiceDate: new Date().toISOString().split("T")[0],
  supplierId: 0,
  gstDetails: GST_DETAILS_DEFAULT_ID,
  items: [{ ...emptyItem }], // one default row
  remarks: "",
  grossAmount: 0,
  boxUnit: 0,
  cessInsurance: 0,
  discountPercent: 0,
  tax: 0,
  amountAdd: 0,
  creditAmount: 0,
  finalAmount: 0,
};

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
export default function AddPurchase({ mode = "purchase" }: AddPurchaseProps) {
  const isReturnMode = mode === "return";
  const purchaseLabel = isReturnMode ? "Purchase Return" : "Purchase";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get id from query params
  const purchaseId = searchParams.get("id");

  // Determine mode
  const isNew = purchaseId === "new" || !purchaseId;
  const isEditMode = Boolean(!isReturnMode && purchaseId && purchaseId !== "new");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPurchaseId, setGeneratedPurchaseId] = useState<number | null>(
    null,
  );
  const [generatedInvoiceNo, setGeneratedInvoiceNo] = useState<string | null>(
    null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPurchaseId, setPreviewPurchaseId] = useState<number>(0);

  const supplierHover = useHoverOpen();
  const productHover = useHoverOpen();
  const gstHover = useHoverOpen();
  const invoiceSearchHover = useHoverOpen();
  const [productOpen, setProductOpen] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [invoiceSearchResults, setInvoiceSearchResults] = useState<Purchase[]>(
    [],
  );
  const [isSearchingInvoice, setIsSearchingInvoice] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(
    null,
  );

  // Batch selection modal state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [pendingBatchSelection, setPendingBatchSelection] = useState<{
    index: number;
    productId: number;
    productCode: string;
    description: string;
    cartonPack: number;
    conversionFactor: number;
  } | null>(null);

  // Get data from hooks
  const { suppliers, products } = useActiveLists();

  // Form hook
  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema) as any,
    defaultValues,
    mode: "onChange",
  });

  // Watch form state for dirty checking
  const { isDirty } = form.formState;

  // Watch items and summary fields
  const items = form.watch("items");
  const { layoutMode } = useTheme();
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

  // Effect 1: Redirect to ?id=new if no ID is present
  useEffect(() => {
    if (!isReturnMode && !purchaseId) {
      setSearchParams({ id: "new" }, { replace: true });
    }
  }, [isReturnMode, purchaseId, setSearchParams]);

  // Search existing invoices — load recent list on open; filter when typing
  useEffect(() => {
    if (!invoiceSearchHover.open) return;

    const query = invoiceSearchQuery.trim();
    const timer = setTimeout(async () => {
      setIsSearchingInvoice(true);
      try {
        const result = await purchaseService.getPurchases(
          1,
          15,
          (query
            ? { search: query }
            : {}) as Parameters<typeof purchaseService.getPurchases>[2],
        );
        setInvoiceSearchResults(result.purchases ?? []);
      } catch {
        setInvoiceSearchResults([]);
      } finally {
        setIsSearchingInvoice(false);
      }
    }, query ? 400 : 0);

    return () => clearTimeout(timer);
  }, [invoiceSearchQuery, invoiceSearchHover.open]);

  // Effect 2: Load purchase data if editing
  useEffect(() => {
    const loadPurchaseData = async () => {
      if (isEditMode && purchaseId) {
        setIsLoading(true);
        try {
          const purchaseData = await purchaseService.getPurchase(
            Number(purchaseId),
          );
          if (purchaseData) {
            populateFormWithPurchaseData(purchaseData);
            setGeneratedPurchaseId(purchaseData.id);
            setGeneratedInvoiceNo(purchaseData.invoiceNo);
            // Reset dirty state after populating form
            form.reset(form.getValues(), { keepDirty: false });
          }
        } catch (error) {
          console.error("Error loading purchase:", error);
          toast.error("Failed to load purchase data");
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPurchaseData();
  }, [purchaseId, isEditMode]);

  // Populate form with existing purchase data
  const populateFormWithPurchaseData = (purchaseData: any) => {
    const mappedItems = (purchaseData.items ?? []).map((item: any) => ({
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
      finalAmount: item.finalAmount ?? item.totalAmount - (item.schAmount ?? 0),
      taxRate: item.taxRate ?? 5,
      taxAmount: item.taxAmount ?? 0,
      schPercent: item.schPercent ?? 0,
      schAmount: item.schAmount ?? 0,
      batchId: item.batchId ?? undefined,
      cartonPack: item.cartonPack ?? 0,
      conversionFactor: item.conversionFactor ?? 1,
      productBrand: item.productBrand ?? "",
    }));

    form.reset({
      invoiceDate:
        purchaseData.invoiceDate?.split("T")[0] ?? defaultValues.invoiceDate,
      supplierId: purchaseData.supplier?.id ?? 0,
      gstDetails: normalizeGstDetailsValue(purchaseData.gstDetails),
      items: mappedItems.length > 0 ? mappedItems : defaultValues.items,
      remarks: purchaseData.remarks ?? "",
      grossAmount: purchaseData.grossAmount ?? 0,
      boxUnit: purchaseData.boxUnit ?? 0,
      cessInsurance: purchaseData.cessInsurance ?? 0,
      discountPercent: purchaseData.discountPercent ?? 0,
      tax: purchaseData.tax ?? 0,
      amountAdd: purchaseData.amountAdd ?? 0,
      creditAmount: purchaseData.creditAmount ?? 0,
      finalAmount: purchaseData.finalAmount ?? 0,
    });
  };

  // ----------------------------------------------------------------------
  // Calculations
  // ----------------------------------------------------------------------
  useEffect(() => {
    const calculateTotals = () => {
      const sumItemFinal = items.reduce(
        (sum, item) => sum + item.finalAmount,
        0,
      );
      const tax = items.reduce((sum, item) => sum + item.taxAmount, 0);
      const grossAmount = items.reduce(
        (sum, item) => sum + (item.totalAmount - item.taxAmount),
        0,
      );

      const _cessInsurance = cessInsurance || 0;
      const _discountPercent = discountPercent || 0;
      const _amountAdd = amountAdd || 0;
      const _creditAmount = creditAmount || 0;

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

  // ----------------------------------------------------------------------
  // Helper functions
  // ----------------------------------------------------------------------
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

  const calculateMQty = (aQty: number, cartonPack: number = 1): number => {
    if (!cartonPack) return 0;
    return Math.floor(aQty / cartonPack);
  };

  const calculateUnit = (aQty: number, cartonPack: number = 1): number => {
    if (!cartonPack) return 0;
    return aQty % cartonPack;
  };

  const totalCartons = items.reduce((sum, item) => sum + item.mQty, 0);
  const totalAQty = items.reduce((sum, item) => sum + item.aQty, 0);
  const totalUnits = items.reduce((sum, item) => sum + (item.unit || 0), 0);

  // ----------------------------------------------------------------------
  // Item handlers
  // ----------------------------------------------------------------------
  const handleItemChange = (
    index: number,
    field: keyof PurchaseFormData["items"][0],
    value: any,
  ) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    const product = findProduct(item.productId);

    updatedItems[index] = { ...item, [field]: value };

    if (["rate", "aQty", "taxRate", "schPercent"].includes(field)) {
      const rate = field === "rate" ? value : item.rate;
      const aQty = field === "aQty" ? value : item.aQty;
      const taxRate = field === "taxRate" ? value : item.taxRate;
      const schPercent = field === "schPercent" ? value : item.schPercent;

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

      if (field === "aQty" && product) {
        const mQty = calculateMQty(aQty, product.cartonPack);
        const unit = calculateUnit(aQty, product.cartonPack);
        updatedItems[index].mQty = parseFloat(mQty.toFixed(2));
        updatedItems[index].unit = parseFloat(unit.toFixed(2));
      }
    }

    if (field === "totalAmount") {
      const taxAmount = value * (item.taxRate / 100);
      const schAmount = value * (item.schPercent / 100);
      const finalAmount = value - schAmount;
      updatedItems[index].taxAmount = parseFloat(taxAmount.toFixed(2));
      updatedItems[index].schAmount = parseFloat(schAmount.toFixed(2));
      updatedItems[index].finalAmount = parseFloat(finalAmount.toFixed(2));
    }

    form.setValue("items", updatedItems);
  };

  // ----------------------------------------------------------------------
  // Batch selection
  // ----------------------------------------------------------------------
  const handleBatchSelect = (batch: any, aQty: number) => {
    if (pendingBatchSelection) {
      const { index, cartonPack, conversionFactor } = pendingBatchSelection;
      const updatedItems = [...items];
      const item = updatedItems[index];

      const mQty = calculateMQty(aQty, cartonPack);
      const unit = calculateUnit(aQty, cartonPack);
      const rate = batch.purchaseRate;
      const taxRate = item.taxRate;
      const schPercent = item.schPercent;

      const totalAmount = rate * aQty;
      const taxAmount = totalAmount * (taxRate / 100);
      const schAmount = totalAmount * (schPercent / 100);
      const finalAmount = totalAmount - schAmount;

      updatedItems[index] = {
        ...item,
        batchId: batch.id,
        rate: rate,
        aQty: aQty,
        mQty: mQty,
        unit: unit,
        totalAmount: totalAmount,
        taxAmount: taxAmount,
        schAmount: schAmount,
        finalAmount: finalAmount,
      };

      form.setValue("items", updatedItems);

      toast.success(`Batch applied to ${item.productCode}`, {
        description: `Rate: ₹${rate.toFixed(2)} | A Qty: ${aQty} | M Qty: ${mQty} | Unit: ${unit}`,
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

  // ----------------------------------------------------------------------
  // Row management
  // ----------------------------------------------------------------------
  const addProductRow = () => {
    const newItem: PurchaseFormData["items"][0] = {
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
      batchId: undefined,
      cartonPack: 0,
      conversionFactor: 0,
      productBrand: "",
      sch1Percent: 0,
      sch1Amount: 0,
      sch2Percent: 0,
      sch2Amount: 0,
    };
    form.setValue("items", [newItem, ...items]);
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
      else if (field === "DQty") {
        if (index === 0) {
          addProductRow();
          nextFieldId = `productSearch-0`;
        } else {
          nextFieldId = `productSearch-${index - 1}`;
        }
      }
      else if (field === "schPercent") nextFieldId = `taxRate-${index}`;
      else if (field === "taxRate") {
        if (index === 0) {
          addProductRow();
          nextFieldId = `productSearch-0`;
        } else {
          nextFieldId = `productSearch-${index - 1}`;
        }
      }
      if (nextFieldId) {
        setTimeout(() => {
          const nextElement = document.getElementById(nextFieldId) as HTMLElement;
          if (nextElement) {
            nextElement.focus();
            if (nextElement instanceof HTMLInputElement) {
              nextElement.select();
            }
          }
        }, 100);
      }
    }
  };

  const removeProductRow = (index: number) => {
    if (items.length > 0) {
      const updatedItems = items.filter((_, i) => i !== index);
      form.setValue("items", updatedItems);
    }
  };

  // ----------------------------------------------------------------------
  // Product selection
  // ----------------------------------------------------------------------
  const handleProductSelect = (index: number, productId: number) => {
    const product = findProduct(productId);
    if (product) {
      const updatedItems = [...items];
      const aQty = 1;
      const mQty = calculateMQty(aQty, product.cartonPack);
      const unit = calculateUnit(aQty, product.cartonPack);
      const rate = product.pricePerPcs || 0;
      const taxRate = product.gstRate || 5;
      const schPercent = 0;
      const totalAmount = rate * aQty;
      const taxAmount = totalAmount * (taxRate / 100);
      const schAmount = totalAmount * (schPercent / 100);
      const finalAmount = totalAmount - schAmount;

      updatedItems[index] = {
        ...updatedItems[index],
        productId: product.id,
        productCode: product.productCode,
        description: product.description,
        productBrand: product.productBrand,
        rate,
        taxRate,
        aQty,
        mQty,
        unit,
        fQty: 0,
        DQty: 0,
        totalAmount,
        taxAmount,
        schPercent,
        schAmount,
        finalAmount,
        cartonPack: product.cartonPack,
        conversionFactor: product.conversionFactor,
        batchId: undefined,
      };
      form.setValue("items", updatedItems);

      setProductOpen(false);
      setActiveProductIndex(null);

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

  // ----------------------------------------------------------------------
  // Form submission
  // ----------------------------------------------------------------------
  const onSubmit = async (data: PurchaseFormData) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, boxUnit: 0 };
      // @ts-ignore
      delete payload.invoiceNo;

      let response: PurchaseResponse;

      if (isEditMode) {
        // Update existing purchase
        response = await purchaseService.updatePurchase(
          Number(purchaseId),
          payload,
        );
        toast.success("Purchase updated successfully");
      } else {
        // Create new purchase
        response = isReturnMode
          ? await purchaseService.createPurchaseReturn(payload)
          : await purchaseService.createPurchase(payload);
        toast.success(`${purchaseLabel} created successfully`);

        // Set generated purchase ID and update URL
        if (response?.id) {
          setGeneratedPurchaseId(response.id);
          setGeneratedInvoiceNo(response.invoiceNo);

          if (!isReturnMode) {
            setSearchParams({ id: response.id.toString() }, { replace: true });
          }
        }
      }
      void refreshActiveLists();
    } catch (error: any) {
      console.error("Error in form submission:", error);
      toast.error(
        error.response?.data?.message ||
          `Failed to save ${purchaseLabel.toLowerCase()}. Please try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast.error("Please fix all validation errors before submitting.");
  };

  // ----------------------------------------------------------------------
  // Navigation handlers
  // ----------------------------------------------------------------------
  const handleNewPurchase = () => {
    // Reset form and navigate to ?id=new
    form.reset(defaultValues);
    setGeneratedPurchaseId(null);
    setGeneratedInvoiceNo(null);
    if (!isReturnMode) {
      setSearchParams({ id: "new" }, { replace: true });
    }
  };

  const handleBillPreview = () => {
    const idToPreview = Number(
      isReturnMode
        ? generatedPurchaseId || 0
        : purchaseId && purchaseId !== "new" ? purchaseId : generatedPurchaseId || 0,
    );
    if (idToPreview > 0) {
      setPreviewPurchaseId(idToPreview);
      setIsPreviewOpen(true);
    }
  };

  const handleBackToPurchases = () => {
    navigate("/purchases");
  };

  const handleLoadPurchaseInvoice = async (summary: Purchase) => {
    try {
      setIsLoading(true);
      const full = await purchaseService.getPurchase(summary.id);
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
          const product = await productService.getProduct(item.productId);
          const batchExists = product.batches?.some(
            (b) => b.id === item.batchId,
          );
          if (!batchExists) {
            issues.push(`${code}: batch no longer exists in product master`);
          }
        } catch {
          issues.push(`${code}: product not found or inactive`);
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

      populateFormWithPurchaseData(full);
      setGeneratedPurchaseId(null);
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
    ? !!generatedPurchaseId
    : (!!purchaseId && purchaseId !== "new") || !!generatedPurchaseId;

  // ----------------------------------------------------------------------
  // Skeleton Loader Component
  // ----------------------------------------------------------------------
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-background p-4 md:p-2">
      <div
        className={`mx-auto ${
          CheckIsExpanded()
            ? "max-w-5xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-9xl"
            : "max-w-9xl lg:max-w-5xl xl:max-w-8xl 2xl:max-w-10xl"
        }`}
      >
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Invoice Details Card Skeleton */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table Skeleton */}
        <Card className="mb-6">
          <CardContent className="p-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
            <div className="border rounded-lg">
              <div className="grid grid-cols-15 gap-4 p-4 bg-secondary/50">
                {Array.from({ length: 15 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
              {Array.from({ length: 3 }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-15 gap-4 p-4 border-t"
                >
                  {Array.from({ length: 15 }).map((_, colIndex) => (
                    <Skeleton key={colIndex} className="h-8 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary Section Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className={cn("lg:col-span-1", layoutMode === "classic" && "remarks-section")}>
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className={cn("lg:col-span-3", layoutMode === "classic" && "classic-summary")}>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-20 w-full mt-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <motion.div
      className="min-h-screen bg-background p-4 md:p-2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div
        className={`mx-auto ${
          CheckIsExpanded()
            ? "max-w-5xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-9xl"
            : "max-w-9xl lg:max-w-5xl xl:max-w-8xl 2xl:max-w-10xl"
        }`}
      >
        {/* Header */}

        <Form {...form}>
          <form
            data-entry-form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="space-y-6"
          >
            {/* Invoice Details Card */}
            <motion.div variants={itemVariants}>
              <Card className={cn(layoutMode === "classic" && "border-none shadow-none bg-transparent")}>
                <CardContent className={cn(layoutMode === "classic" ? "p-0 pb-2" : "p-6")}>
                  {layoutMode !== "classic" && (
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {isReturnMode ? "Return Details" : "Invoice Details"}
                      {generatedInvoiceNo && (
                        <Badge variant="secondary" className="ml-2">
                          {generatedInvoiceNo}
                        </Badge>
                      )}
                    </h3>
                  )}
                  <div className={cn(
                    "grid gap-4",
                    layoutMode === "classic" 
                      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 items-end" 
                      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                  )}>
                    {/* Load from existing invoice */}
                    {!isReturnMode && (
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
                          inputClassName={cn(
                            layoutMode === "classic" &&
                              "classic-input h-8 pl-0 border-b-2 bg-transparent",
                          )}
                        >
                          {!isSearchingInvoice &&
                            invoiceSearchResults.length > 0 && (
                              <CommandGroup>
                                {invoiceSearchResults.map((purchase) => (
                                  <CommandItem
                                    key={purchase.id}
                                    value={purchase.invoiceNo}
                                    onSelect={() =>
                                      handleLoadPurchaseInvoice(purchase)
                                    }
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {purchase.invoiceNo}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {purchase.supplier?.name} •{" "}
                                        {new Date(
                                          purchase.invoiceDate,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                        </InlineSearchField>
                      </FormItem>
                    )}

                    {/* Invoice Date */}
                    <FormField
                      control={form.control}
                      name="invoiceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <HoverDateInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Invoice Date *"
                              inputClassName={cn(
                                "pl-10",
                                layoutMode === "classic" && "classic-input",
                              )}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Supplier */}
                    <FormField
                      control={form.control}
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormControl>
                            <InlineSearchField
                              open={supplierHover.open}
                              onOpenChange={supplierHover.setOpen}
                              displayValue={
                                field.value
                                  ? findSupplierName(field.value)
                                  : ""
                              }
                              placeholder="Supplier Name *"
                              emptyMessage="No supplier found."
                              onMouseEnter={supplierHover.onMouseEnter}
                              onMouseLeave={supplierHover.onMouseLeave}
                              disabled={isSubmitting}
                              inputClassName={cn(
                                layoutMode === "classic" &&
                                  "classic-input h-8 pl-0 border-b-2 bg-transparent",
                              )}
                            >
                              <CommandGroup>
                                {suppliers.map((supplier) => (
                                  <CommandItem
                                    key={supplier.id}
                                    value={`${supplier.id} ${supplier.name} ${supplier.phoneNo || ""}`}
                                    onSelect={() => {
                                      field.onChange(supplier.id);
                                      supplierHover.setOpen(false);
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
                            open={gstHover.open}
                            onOpenChange={gstHover.setOpen}
                            onValueChange={field.onChange}
                            value={field.value ?? GST_DETAILS_DEFAULT_ID}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(layoutMode === "classic" && "classic-input h-8 pl-0 border-b-2 bg-transparent")}
                                onMouseEnter={gstHover.onMouseEnter}
                                onMouseLeave={gstHover.onMouseLeave}
                              >
                                <SelectValue placeholder="GST Details" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent
                              onMouseEnter={gstHover.onMouseEnter}
                              onMouseLeave={gstHover.onMouseLeave}
                            >
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
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Products Table */}
            <motion.div variants={itemVariants}>
              <Card className={cn(layoutMode === "classic" && "border-none shadow-none bg-transparent")}>
                <CardContent className={cn("p-2", layoutMode === "classic" && "p-0")}>
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

                  <div className="flex items-center justify-center overflow-x-auto w-full">
                    <div className={cn(
                      "overflow-x-auto border rounded-lg max-w-9xl lg:max-w-3xl xl:max-w-6xl 2xl:max-w-8xl",
                      layoutMode === "classic" && "rounded-none border-none"
                    )}>
                      <Table className={cn(layoutMode === "classic" && "classic-table")}>
                        <TableHeader>
                          <TableRow className="bg-secondary/50">
                            <TableHead className="font-semibold w-12">
                              Sr
                            </TableHead>
                            <TableHead className="font-semibold">
                              Prod Code & Description
                            </TableHead>
                            <TableHead className="font-semibold">
                              Rate
                            </TableHead>
                            <TableHead className="font-semibold">
                              A. Qty
                            </TableHead>
                            <TableHead className="font-semibold">Fr</TableHead>
                            <TableHead className="font-semibold">Dm</TableHead>
                            <TableHead className="font-semibold">
                              M. Qty *
                            </TableHead>
                            <TableHead className="font-semibold">
                              Unit
                            </TableHead>
                            <TableHead className="font-semibold">
                              Amount
                            </TableHead>
                            <TableHead className="font-semibold">
                              Sch%
                            </TableHead>
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
                                    <InlineSearchField
                                    open={productOpen && activeProductIndex === index}
                                    onOpenChange={(open) => {
                                      if (open) {
                                        setActiveProductIndex(index);
                                      } else {
                                        setActiveProductIndex(null);
                                      }
                                      setProductOpen(open);
                                    }}
                                    displayValue={item.productId
                                            ? findProductName(item.productId)
                                            : "Select product"}
                                    placeholder="Search products..."
                                    emptyMessage="No product found."
                                    disabled={isSubmitting}
                                  >
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
                                                      product.id ===
                                                        item.productId
                                                        ? "opacity-100"
                                                        : "opacity-0",
                                                    )}
                                                  />
                                                </CommandItem>
                                              ))}
                                            </CommandGroup>
                                  </InlineSearchField>
                                  </TableCell>

                                  {/* Rate */}
                                  <TableCell>
                                    <div className="relative">
                                      <IndianRupee className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                      <Input
                                        id={`rate-${index}`}
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
                                        onKeyDown={(e) => handleKeyDown(e, index, "rate")}
                                        className="w-24 pl-7"
                                        disabled={isSubmitting}
                                      />
                                    </div>
                                  </TableCell>

                                  {/* A. Qty */}
                                  <TableCell>
                                    <Input
                                      id={`aQty-${index}`}
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
                                      onKeyDown={(e) => handleKeyDown(e, index, "aQty")}
                                      className="w-20"
                                      disabled={isSubmitting}
                                    />
                                  </TableCell>

                                  {/* Fr */}
                                  <TableCell>
                                    <Input
                                      id={`fQty-${index}`}
                                      type="number"
                                      step="1"
                                      value={item.fQty}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "fQty",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      onKeyDown={(e) => handleKeyDown(e, index, "fQty")}
                                      className="w-20"
                                      disabled={isSubmitting}
                                    />
                                  </TableCell>

                                  {/* Dm */}
                                  <TableCell>
                                    <Input
                                      id={`DQty-${index}`}
                                      type="number"
                                      step="1"
                                      value={item.DQty}
                                      onChange={(e) =>
                                        handleItemChange(
                                          index,
                                          "DQty",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      onKeyDown={(e) => handleKeyDown(e, index, "DQty")}
                                      className="w-20"
                                      disabled={isSubmitting}
                                    />
                                  </TableCell>

                                  {/* M. Qty - Disabled */}
                                  <TableCell>
                                    <Input
                                      type="number"
                                      step="1"
                                      value={item.mQty}
                                      readOnly
                                      disabled
                                      className="w-20 bg-muted cursor-not-allowed"
                                    />
                                  </TableCell>

                                  {/* Unit - Disabled */}
                                  <TableCell>
                                    <Input
                                      type="number"
                                      step="1"
                                      value={item.unit}
                                      readOnly
                                      disabled
                                      className="w-20 bg-muted cursor-not-allowed"
                                    />
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

                                  {/* Sch% */}
                                  <TableCell>
                                    <div className="relative">
                                      <Input
                                        id={`schPercent-${index}`}
                                        type="number"
                                        step="0.01"
                                        value={item.schPercent}
                                        onChange={(e) =>
                                          handleItemChange(
                                            index,
                                            "schPercent",
                                            parseFloat(e.target.value) || 0,
                                          )
                                        }
                                        onKeyDown={(e) => handleKeyDown(e, index, "schPercent")}
                                        className="w-16 pl-5"
                                        disabled={isSubmitting}
                                      />
                                      <Percent className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    </div>
                                  </TableCell>

                                  {/* Sch Amount */}
                                  <TableCell>
                                    <div className="font-medium text-sm">
                                      ₹{item.schAmount.toFixed(2)}
                                    </div>
                                  </TableCell>

                                  {/* Tax Rate */}
                                  <TableCell>
                                    <div className="relative">
                                      <Input
                                        id={`taxRate-${index}`}
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
                                        onKeyDown={(e) => handleKeyDown(e, index, "taxRate")}
                                        className="w-16 pl-5"
                                        disabled={isSubmitting}
                                      />
                                      <Percent className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    </div>
                                  </TableCell>

                                  {/* Tax Amount */}
                                  <TableCell>
                                    <div className="font-medium text-sm">
                                      ₹{item.taxAmount.toFixed(2)}
                                    </div>
                                  </TableCell>

                                  {/* Final Amount */}
                                  <TableCell>
                                    <div className="font-bold text-sm text-green-700">
                                      ₹{item.finalAmount.toFixed(2)}
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
            </motion.div>

            {/* Summary Section with Original Color Classes */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Remarks - Left Side */}
                    <div className={cn("lg:col-span-1", layoutMode === "classic" && "remarks-section")}>
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
                                  className="min-h-[120px] bg-white dark:bg-gray-900 border-remarks-border focus:border-primary"
                                  {...field}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <p className="text-xs text-remarks-text mt-2">
                          Add any special instructions or notes for this
                          invoice.
                        </p>
                      </div>
                    </div>

                    {/* Summary - Right Side */}
                    <div className={cn("lg:col-span-3", layoutMode === "classic" && "classic-summary")}>
                      <div className={cn(
                        "bg-summary-container-bg rounded-xl p-5 border border-summary-container-border shadow-sm",
                        layoutMode === "classic" && "rounded-none shadow-none border-none p-0 bg-transparent"
                      )}>
                        {layoutMode !== "classic" && (
                          <h4 className="font-semibold mb-4 text-summary-container-text flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Invoice Summary
                          </h4>
                        )}

                        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", layoutMode === "classic" && "flex flex-nowrap w-max")}>
                          {/* Gross Amount */}
                          <div className="bg-summary-bg-1 rounded-lg p-3 border border-summary-border-1 grey-block">
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
                          <div className="bg-summary-bg-2 rounded-lg p-3 border border-summary-border-2 yellow-block">
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
                          <div className="bg-summary-bg-3 rounded-lg p-3 border border-summary-border-3 yellow-block">
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
                          <div className="bg-summary-bg-5 rounded-lg p-3 border border-summary-border-5 yellow-block">
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

                          {/* Tax */}
                          <div className="bg-summary-bg-6 rounded-lg p-3 border border-summary-border-6 grey-block">
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

                          {/* Total Scheme */}
                          <div className="bg-summary-bg-4 rounded-lg p-3 border border-summary-border-4 grey-block">
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
                                    (sum, item) => sum + item.schAmount,
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
                                <span className="font-medium">Note:</span> This
                                is the total payable amount including all taxes
                                and adjustments.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Hidden boxUnit field */}
            <FormField
              control={form.control}
              name="boxUnit"
              render={({ field }) => (
                <input type="hidden" {...field} value={0} />
              )}
            />

            {/* Bottom Actions */}
            <motion.div
              className="flex justify-end gap-3 pt-4 border-t mt-4"
              variants={itemVariants}
            >
              {/* Bill Preview Button - Also shown at bottom for convenience */}
              {canShowBillPreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBillPreview}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Bill Preview
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={handleBackToPurchases}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (isEditMode && !isDirty)}
                className="gap-2 fixed bottom-6 right-6 z-50 shadow-xl rounded-full px-6 py-6 text-base font-semibold"
                size="lg"
              >
                <Save className="h-5 w-5" />
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Purchase"
                    : `Create ${purchaseLabel}`}
              </Button>
            </motion.div>
          </form>
        </Form>
      </div>

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

      <PurchaseInvoicePreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        purchaseId={previewPurchaseId}
      />
    </motion.div>
  );
}
