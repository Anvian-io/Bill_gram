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
  Hash,
  IndianRupee,
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
import { useDebounce } from "@/utils/debounce";
import PurchaseForm from "../components/forms/PurchaseForm";
import type {
  Purchase,
  Supplier,
  Product,
  PurchaseFormData,
} from "@/types/purchase";

// Mock data
const mockSuppliers: Supplier[] = [
  { id: 1, name: "MARINO FOOD PRODUCTS", gstin: "27ABCDE1234F1Z5" },
  { id: 2, name: "ABC Suppliers Pvt. Ltd.", gstin: "27XYZAB1234F1Z6" },
  { id: 3, name: "Global Distributors", gstin: "27GLBAL1234F1Z7" },
];

const mockProducts: Product[] = [
  {
    id: 1,
    productCode: "G6",
    description: "ECLARIS JAR",
    price: 118.0,
    gstRate: 5,
  },
  {
    id: 2,
    productCode: "10087",
    description: "CRUNCHY MUNCHY S",
    price: 3.54,
    gstRate: 5,
  },
  {
    id: 3,
    productCode: "K1",
    description: "KRACK IT S RS",
    price: 3.54,
    gstRate: 5,
  },
  {
    id: 4,
    productCode: "M50",
    description: "GLUCO-G S RS",
    price: 3.7,
    gstRate: 5,
  },
  {
    id: 5,
    productCode: "G13",
    description: "LOLLYPOP BIG JAR S",
    price: 155.0,
    gstRate: 5,
  },
];

// Mock purchases
const mockPurchases: Purchase[] = [
  {
    id: 1,
    invoiceNo: "501622",
    invoiceDate: "2024-01-15",
    supplier: {
      id: 1,
      name: "MARINO FOOD PRODUCTS",
      gstin: "27ABCDE1234F1Z5",
    },
    gstDetails: "Against GST",
    items: [
      {
        id: 1,
        productId: 1,
        productCode: "G6",
        description: "ECLARIS JAR",
        rate: 118.0,
        expiryDate: "2025-12-31",
        manufacturingDate: "2024-01-01",
        totalAmount: 1416.0,
        taxRate: 5,
        taxAmount: 70.8,
        sch1Percent: 0,
        sch1Amount: 0,
        sch2Percent: 0,
        sch2Amount: 0,
      },
      {
        id: 2,
        productId: 2,
        productCode: "10087",
        description: "CRUNCHY MUNCHY S",
        rate: 3.54,
        expiryDate: "2025-06-30",
        manufacturingDate: "2024-01-01",
        totalAmount: 5097.6,
        taxRate: 5,
        taxAmount: 254.88,
        sch1Percent: 0,
        sch1Amount: 0,
        sch2Percent: 0,
        sch2Amount: 0,
      },
    ],
    remarks: "",
    grossAmount: 6513.6,
    boxUnit: 22.48,
    cessInsurance: 0,
    scheme1: 0,
    discountPercent: 0,
    tax: 325.68,
    amountAdd: 0,
    creditAmount: 0,
    finalAmount: 6839.28,
    status: "Paid",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    invoiceNo: "501623",
    invoiceDate: "2024-01-16",
    supplier: {
      id: 2,
      name: "ABC Suppliers Pvt. Ltd.",
      gstin: "27XYZAB1234F1Z6",
    },
    gstDetails: "Against GST",
    items: [
      {
        id: 3,
        productId: 4,
        productCode: "M50",
        description: "GLUCO-G S RS",
        rate: 3.7,
        expiryDate: "2025-07-31",
        manufacturingDate: "2024-02-01",
        totalAmount: 2664.0,
        taxRate: 5,
        taxAmount: 133.2,
        sch1Percent: 0,
        sch1Amount: 0,
        sch2Percent: 0,
        sch2Amount: 0,
      },
      {
        id: 4,
        productId: 5,
        productCode: "G13",
        description: "LOLLYPOP BIG JAR S",
        rate: 155.0,
        expiryDate: "2025-12-31",
        manufacturingDate: "2024-01-15",
        totalAmount: 9300.0,
        taxRate: 5,
        taxAmount: 465.0,
        sch1Percent: 0,
        sch1Amount: 0,
        sch2Percent: 0,
        sch2Amount: 0,
      },
    ],
    remarks: "Monthly order",
    grossAmount: 11964.0,
    boxUnit: 18.75,
    cessInsurance: 0,
    scheme1: 0,
    discountPercent: 5,
    tax: 598.2,
    amountAdd: 0,
    creditAmount: 0,
    finalAmount: 12562.2,
    status: "Pending",
    createdAt: "2024-01-16T14:45:00Z",
    updatedAt: "2024-01-16T14:45:00Z",
  },
];

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
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(
    null,
  );

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    invoiceNo: "",
    supplier: "all" as string | "all",
    minAmount: "",
    maxAmount: "",
    invoiceDate: undefined as Date | undefined,
    status: "all" as
      | "all"
      | "Pending"
      | "Paid"
      | "Partially Paid"
      | "Cancelled",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(mockPurchases.length);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Local state for immediate input values
  const [searchInput, setSearchInput] = useState<string>("");
  const [invoiceNoInput, setInvoiceNoInput] = useState<string>("");
  const [minAmountInput, setMinAmountInput] = useState<string>("");
  const [maxAmountInput, setMaxAmountInput] = useState<string>("");
  const [invoiceDateInput, setInvoiceDateInput] = useState<string>("");

  // Create debounced filter functions
  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedSetInvoiceNo = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, invoiceNo: value }));
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

  const handleInvoiceNoChange = (value: string) => {
    setInvoiceNoInput(value);
    debouncedSetInvoiceNo(value);
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
      invoiceNo: "",
      supplier: "all",
      minAmount: "",
      maxAmount: "",
      invoiceDate: undefined,
      status: "all",
    });
    setSearchInput("");
    setInvoiceNoInput("");
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
      case "invoiceNo":
        setInvoiceNoInput("");
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
          purchase.invoiceNo.toLowerCase().includes(searchLower) ||
          purchase.supplier.name.toLowerCase().includes(searchLower) ||
          purchase.remarks.toLowerCase().includes(searchLower) ||
          purchase.items.some(
            (item) =>
              item.productCode.toLowerCase().includes(searchLower) ||
              item.description.toLowerCase().includes(searchLower),
          );
        if (!matches) return false;
      }

      // Invoice No filter
      if (
        filters.invoiceNo &&
        !purchase.invoiceNo.includes(filters.invoiceNo)
      ) {
        return false;
      }

      // Supplier filter
      if (
        filters.supplier !== "all" &&
        purchase.supplier.id.toString() !== filters.supplier
      ) {
        return false;
      }

      // Amount range filter
      if (
        filters.minAmount &&
        purchase.finalAmount < parseFloat(filters.minAmount)
      ) {
        return false;
      }
      if (
        filters.maxAmount &&
        purchase.finalAmount > parseFloat(filters.maxAmount)
      ) {
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

  // Calculate total items amount
  const calculateTotalAmount = (items: any[]) => {
    return items.reduce((sum, item) => sum + item.totalAmount, 0);
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
        setPurchases(purchases.filter((p) => p.id !== purchaseToDelete.id));
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
      const supplier = mockSuppliers.find((s) => s.id === data.supplierId);

      if (!supplier) {
        throw new Error("Supplier not found");
      }

      if (id) {
        // Update existing purchase
        const updatedPurchase: Purchase = {
          id,
          invoiceNo: data.invoiceNo,
          invoiceDate: data.invoiceDate,
          supplier: {
            id: supplier.id,
            name: supplier.name,
            gstin: supplier.gstin,
          },
          gstDetails: data.gstDetails || "Against GST",
          items: data.items.map((item, index) => ({
            id: index + 1,
            productId: item.productId,
            productCode: item.productCode,
            description: item.description,
            rate: item.rate,
            expiryDate: item.expiryDate,
            manufacturingDate: item.manufacturingDate,
            totalAmount: item.totalAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            sch1Percent: item.sch1Percent,
            sch1Amount: item.sch1Amount,
            sch2Percent: item.sch2Percent,
            sch2Amount: item.sch2Amount,
          })),
          remarks: data.remarks || "",
          grossAmount: data.grossAmount,
          boxUnit: data.boxUnit,
          cessInsurance: data.cessInsurance,
          scheme1: data.scheme1,
          discountPercent: data.discountPercent,
          tax: data.tax,
          amountAdd: data.amountAdd,
          creditAmount: data.creditAmount,
          finalAmount: data.finalAmount,
          status: "Pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setPurchases(purchases.map((p) => (p.id === id ? updatedPurchase : p)));
        toast.success("Purchase updated successfully!");
      } else {
        // Add new purchase
        const newPurchase: Purchase = {
          id: purchases.length + 1,
          invoiceNo: data.invoiceNo,
          invoiceDate: data.invoiceDate,
          supplier: {
            id: supplier.id,
            name: supplier.name,
            gstin: supplier.gstin,
          },
          gstDetails: data.gstDetails || "Against GST",
          items: data.items.map((item, index) => ({
            id: index + 1,
            productId: item.productId,
            productCode: item.productCode,
            description: item.description,
            rate: item.rate,
            expiryDate: item.expiryDate,
            manufacturingDate: item.manufacturingDate,
            totalAmount: item.totalAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            sch1Percent: item.sch1Percent,
            sch1Amount: item.sch1Amount,
            sch2Percent: item.sch2Percent,
            sch2Amount: item.sch2Amount,
          })),
          remarks: data.remarks || "",
          grossAmount: data.grossAmount,
          boxUnit: data.boxUnit,
          cessInsurance: data.cessInsurance,
          scheme1: data.scheme1,
          discountPercent: data.discountPercent,
          tax: data.tax,
          amountAdd: data.amountAdd,
          creditAmount: data.creditAmount,
          finalAmount: data.finalAmount,
          status: "Pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setPurchases([newPurchase, ...purchases]);
        toast.success("Purchase created successfully!");
      }

      setIsModalOpen(false);
    } catch (error: any) {
      toast.error("Failed to save purchase", {
        description: error.message || "Please try again",
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
        !(value instanceof Date),
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
                  Manage and track your purchase invoices
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
                  placeholder="Search by invoice no, supplier, product, or remarks..."
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
                          {/* Invoice No Filter */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="invoiceNo"
                              className="text-sm font-medium"
                            >
                              Invoice No
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="invoiceNo"
                                placeholder="Enter invoice no"
                                value={invoiceNoInput}
                                onChange={(e) =>
                                  handleInvoiceNoChange(e.target.value)
                                }
                                className="flex-1"
                              />
                              {invoiceNoInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => {
                                    setInvoiceNoInput("");
                                    clearFilter("invoiceNo");
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
                                <SelectItem value="all">
                                  All Suppliers
                                </SelectItem>
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
                                value:
                                  | "all"
                                  | "Pending"
                                  | "Paid"
                                  | "Partially Paid"
                                  | "Cancelled",
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
                                <SelectItem value="Partially Paid">
                                  Partially Paid
                                </SelectItem>
                                <SelectItem value="Cancelled">
                                  Cancelled
                                </SelectItem>
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
                        <TableHead className="font-semibold">
                          Invoice No
                        </TableHead>
                        <TableHead className="font-semibold">
                          Supplier
                        </TableHead>
                        <TableHead className="font-semibold">
                          Invoice Date
                        </TableHead>
                        <TableHead className="font-semibold">Items</TableHead>
                        <TableHead className="font-semibold">
                          Gross Amount
                        </TableHead>
                        <TableHead className="font-semibold">Tax</TableHead>
                        <TableHead className="font-semibold">
                          Final Amount
                        </TableHead>
                        <TableHead className="font-semibold">
                          Discount %
                        </TableHead>
                        <TableHead className="font-semibold">
                          GST Details
                        </TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">
                          Created & Updated
                        </TableHead>
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
                              colSpan={12}
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
                              colSpan={12}
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
                                  {purchase.invoiceNo}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div>
                                  <p className="font-medium">
                                    {purchase.supplier.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    GSTIN: {purchase.supplier.gstin}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                {formatDateTime(purchase.invoiceDate)}
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <Badge
                                    variant="outline"
                                    className="font-mono"
                                  >
                                    {purchase.items.length}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="flex items-center gap-1">
                                  <IndianRupee className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">
                                    ₹{purchase.grossAmount.toFixed(2)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700"
                                >
                                  ₹{purchase.tax.toFixed(2)}
                                </Badge>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="font-bold text-green-700">
                                  ₹{purchase.finalAmount.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                {purchase.discountPercent > 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-50 text-red-700"
                                  >
                                    {purchase.discountPercent}%
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="text-xs text-muted-foreground">
                                  {purchase.gstDetails}
                                </div>
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
                                    onClick={() =>
                                      confirmDeletePurchase(purchase)
                                    }
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
      <PurchaseForm
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
            ? `Are you sure you want to delete purchase "${purchaseToDelete.invoiceNo}"? This action cannot be undone.`
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
