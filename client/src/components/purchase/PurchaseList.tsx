import { useTheme } from "@/contexts/ThemeProvider";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { Plus,
  Edit,
  Trash2,
  Search,
  X,
  RefreshCw,
  Package,
  ShoppingCart,
  IndianRupee,
  ChevronsUpDown,
  Check,
  Calendar,
  FileText,
} from "lucide-react";
import { CustomPagination, CustomDateInput } from "@/components/custom_ui";
import { motion, AnimatePresence } from "framer-motion";
import { getGstDetailsLabel } from "@/store/dropdown_data/gst_details";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  rowVariants,
  badgeVariants,
} from "@/components/FramerVariants";
import { toast } from "sonner";
import { refreshActiveLists } from "@/utils/refreshActiveLists";
import { CustomAlert } from "@/components/custom_ui";
import { useDebounce } from "@/utils/debounce";
import PurchaseForm from "@/components/forms/PurchaseForm";
import { purchaseService } from "@/services/purchaseService";
import { useActiveLists } from "@/hooks/useActiveLists";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type {
  Purchase,
  PurchaseFormData,
  PurchaseFilters,
} from "@/types/purchase";
import { CheckIsExpanded } from "@/utils/commonHelper";
import PurchaseInvoicePreview from "./PurchaseInvoicePreview";

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function Purchase() {
  const { layoutMode } = useTheme();
  // State
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(
    null,
  );
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPurchaseId, setPreviewPurchaseId] = useState<number>(0);

  // Filters state – added toDate
  const [filters, setFilters] = useState<PurchaseFilters>({
    search: "",
    supplierId: "all",
    gstDetails: undefined,
    minAmount: "",
    maxAmount: "",
    fromDate: undefined,
    toDate: undefined,
    status: "all",
    page: 1,
    limit: 10,
    showDeleted: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Local inputs (before debounce)
  const [searchInput, setSearchInput] = useState("");
  const [minAmountInput, setMinAmountInput] = useState("");
  const [maxAmountInput, setMaxAmountInput] = useState("");
  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { suppliers } = useActiveLists();

  // --------------------------------------------------------------------
  // Debounced filter setters
  // --------------------------------------------------------------------
  const debouncedSetSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);
  const debouncedSetMinAmount = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, minAmount: value }));
  }, 300);
  const debouncedSetMaxAmount = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, maxAmount: value }));
  }, 300);

  // --------------------------------------------------------------------
  // Input handlers
  // --------------------------------------------------------------------
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };
  const handleMinAmountChange = (value: string) => {
    setMinAmountInput(value);
    debouncedSetMinAmount(value);
  };
  const handleMaxAmountChange = (value: string) => {
    setMaxAmountInput(value);
    debouncedSetMaxAmount(value);
  };

  // From / To date synced with filter state
  const handleFromDateChange = (value: string | null) => {
    setFromDateValue(value);
    setFilters((prev) => ({
      ...prev,
      fromDate: value ? new Date(`${value}T00:00:00`) : undefined,
    }));
  };

  const handleToDateChange = (value: string | null) => {
    setToDateValue(value);
    setFilters((prev) => ({
      ...prev,
      toDate: value ? new Date(`${value}T00:00:00`) : undefined,
    }));
  };

  useEffect(() => {
    if (showSearchBar) {
      searchInputRef.current?.focus();
    }
  }, [showSearchBar]);

  // Generic filter change
  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      supplierId: "all",
      gstDetails: undefined,
      minAmount: "",
      maxAmount: "",
      fromDate: undefined,
      toDate: undefined,
      status: "all",
      page: 1,
      limit: itemsPerPage,
      showDeleted: false,
    });
    setSearchInput("");
    setMinAmountInput("");
    setMaxAmountInput("");
    setFromDateValue(null);
    setToDateValue(null);
  };

  // Clear a single filter
  const clearFilter = (filterName: keyof PurchaseFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "supplierId" || filterName === "status"
          ? "all"
          : filterName === "gstDetails"
            ? undefined
          : filterName === "fromDate" || filterName === "toDate"
            ? undefined
            : filterName === "showDeleted"
              ? false
              : "",
    }));
    // Clear input field
    switch (filterName) {
      case "search":
        setSearchInput("");
        break;
      case "minAmount":
        setMinAmountInput("");
        break;
      case "maxAmount":
        setMaxAmountInput("");
        break;
      case "fromDate":
        setFromDateValue(null);
        break;
      case "toDate":
        setToDateValue(null);
        break;
    }
  };

  // --------------------------------------------------------------------
  // API Calls
  // --------------------------------------------------------------------
  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const apiFilters: PurchaseFilters = {
        page: currentPage,
        limit: itemsPerPage,
        search: filters.search || undefined,
        supplierId:
          filters.supplierId !== "all" ? filters.supplierId : undefined,
        gstDetails: filters.gstDetails,
        minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        status: filters.status !== "all" ? filters.status : undefined,
        showDeleted: filters.showDeleted,
      };

      const response = await purchaseService.getPurchases(
        currentPage,
        itemsPerPage,
        apiFilters,
      );

      setPurchases(response.purchases || []);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to fetch purchases");
      setPurchases([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [currentPage, itemsPerPage, filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  // --------------------------------------------------------------------
  // CRUD Handlers (unchanged) ...
  // --------------------------------------------------------------------
  const handleAddPurchase = () => {
    setEditingPurchase(null);
    setIsModalOpen(true);
  };

  const handleEditPurchase = async (purchase: Purchase) => {
    try {
      setIsLoading(true);
      const fullPurchase = await purchaseService.getPurchase(purchase.id);
      setEditingPurchase(fullPurchase);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Failed to load purchase details");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeletePurchase = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setDeleteOpen(true);
  };

  const handleDeletePurchase = async () => {
    if (!purchaseToDelete) return;
    try {
      await purchaseService.deletePurchase(purchaseToDelete.id);
      toast.success("Purchase deleted successfully");
      void refreshActiveLists();
      fetchPurchases();
    } catch (error: any) {
      toast.error("Failed to delete purchase", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setPurchaseToDelete(null);
      setDeleteOpen(false);
    }
  };

  const handleSavePurchase = async (data: PurchaseFormData, id?: number) => {
    setIsSubmitting(true);
    try {
      if (id) {
        await purchaseService.updatePurchase(id, data);
        toast.success("Purchase updated successfully");
      } else {
        await purchaseService.createPurchase(data);
        toast.success("Purchase created successfully");
      }
      void refreshActiveLists();
      setIsModalOpen(false);
      fetchPurchases();
    } catch (error: any) {
      toast.error("Failed to save purchase", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    fetchPurchases();
    toast.info("Refreshing purchase data...");
  };

  const handlePreview = (purchaseId: number) => {
    setPreviewPurchaseId(purchaseId);
    setIsPreviewOpen(true);
  };

  // --------------------------------------------------------------------
  // Helper functions
  // --------------------------------------------------------------------
  const activeFiltersCount =
    Object.entries(filters).filter(
      ([key, value]) =>
        key !== "search" &&
        key !== "fromDate" &&
        key !== "toDate" &&
        value &&
        value !== "all" &&
        value !== "" &&
        !(value instanceof Date) &&
        !(key === "showDeleted" && !value),
    ).length +
    (filters.fromDate ? 1 : 0) +
    (filters.toDate ? 1 : 0);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const getSupplierName = (id: string | number) => {
    if (id === "all" || !id) return "";
    const supplier = suppliers.find((s) => s.id.toString() === id.toString());
    return supplier ? supplier.name : "";
  };

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

  // --------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------
  return (
    <>
      <motion.div
        className="min-h-screen bg-background p-3 pb-24"
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
          {/* Filter Section */}
          <motion.div className="mb-2" variants={itemVariants}>
            <Card className="overflow-hidden">
              <CardContent className="p-1">
                <div className="flex flex-col gap-4 p-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Supplier */}
                          <div>
                            <InlineSearchField
                            open={supplierOpen}
                            onOpenChange={setSupplierOpen}
                            displayValue={getSupplierName(filters.supplierId!)}
                            placeholder="Supplier"
                            emptyMessage="No supplier found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                                      <CommandItem
                                        value="all"
                                        onSelect={() => {
                                          handleFilterChange(
                                            "supplierId",
                                            "all",
                                          );
                                          setSupplierOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.supplierId === "all"
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        All Suppliers
                                      </CommandItem>
                                      {suppliers.map((supplier) => (
                                        <CommandItem
                                          key={supplier.id}
                                          value={supplier.id.toString()}
                                          onSelect={() => {
                                            handleFilterChange(
                                              "supplierId",
                                              supplier.id.toString(),
                                            );
                                            setSupplierOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.supplierId ===
                                                supplier.id.toString()
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          {supplier.name}
                                          {supplier.phoneNo && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              ({supplier.phoneNo})
                                            </span>
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                          </InlineSearchField>
                          </div>

                          <GstDetailsFilter
                            value={filters.gstDetails}
                            onChange={(value) =>
                              handleFilterChange("gstDetails", value)
                            }
                            disabled={isLoading}
                          />

                          {/* Amount Range */}
                          <div>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Min Amount"
                                type="number"
                                value={minAmountInput}
                                onChange={(e) =>
                                  handleMinAmountChange(e.target.value)
                                }
                                className="flex-1"
                              />
                              <Input
                                placeholder="Max Amount"
                                type="number"
                                value={maxAmountInput}
                                onChange={(e) =>
                                  handleMaxAmountChange(e.target.value)
                                }
                                className="flex-1"
                              />
                            </div>
                          </div>

                          {/* Status */}
                          <div>
                            <InlineSearchField
                              open={statusOpen}
                              onOpenChange={setStatusOpen}
                              displayValue={
                                filters.status === "all" ? "" : filters.status
                              }
                              placeholder="Status"
                              emptyMessage="No status found."
                              disabled={isLoading}
                            >
                              <CommandGroup>
                                <CommandItem
                                  value="all status"
                                  onSelect={() => {
                                    handleFilterChange("status", "all");
                                    setStatusOpen(false);
                                  }}
                                >
                                  All Status
                                </CommandItem>
                                <CommandItem
                                  value="Pending"
                                  onSelect={() => {
                                    handleFilterChange("status", "Pending");
                                    setStatusOpen(false);
                                  }}
                                >
                                  Pending
                                </CommandItem>
                                <CommandItem
                                  value="Paid"
                                  onSelect={() => {
                                    handleFilterChange("status", "Paid");
                                    setStatusOpen(false);
                                  }}
                                >
                                  Paid
                                </CommandItem>
                                <CommandItem
                                  value="Partially Paid"
                                  onSelect={() => {
                                    handleFilterChange(
                                      "status",
                                      "Partially Paid",
                                    );
                                    setStatusOpen(false);
                                  }}
                                >
                                  Partially Paid
                                </CommandItem>
                                <CommandItem
                                  value="Cancelled"
                                  onSelect={() => {
                                    handleFilterChange("status", "Cancelled");
                                    setStatusOpen(false);
                                  }}
                                >
                                  Cancelled
                                </CommandItem>
                                <CommandItem
                                  value="Return"
                                  onSelect={() => {
                                    handleFilterChange("status", "Return");
                                    setStatusOpen(false);
                                  }}
                                >
                                  Return
                                </CommandItem>
                              </CommandGroup>
                            </InlineSearchField>
                          </div>

                          <CustomDateInput
                            value={fromDateValue}
                            onChange={handleFromDateChange}
                            placeholder="Invoice Date From"
                            disabled={isLoading}
                          />

                          <CustomDateInput
                            value={toDateValue}
                            onChange={handleToDateChange}
                            placeholder="Invoice Date To"
                            disabled={isLoading}
                          />
                        </div>
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
          </motion.div>

          {/* Purchases Table (unchanged) */}
          <motion.div variants={itemVariants}>
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
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
                      <AnimatePresence>
                        {isLoading ? (
                          <motion.tr
                            key="loading"
                            // initial={{ opacity: 0 }}
                            // animate={{ opacity: 1 }}
                            // exit={{ opacity: 0 }}
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
                        ) : purchases.length === 0 ? (
                          <motion.tr
                            key="no-data"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <TableCell
                              colSpan={12}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <motion.div
                                className="flex flex-col items-center justify-center"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                              >
                                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-2" />
                                <p>No purchases found matching your filters.</p>
                                <Button
                                  variant="link"
                                  onClick={clearFilters}
                                  className="mt-2"
                                >
                                  Clear all filters
                                </Button>
                              </motion.div>
                            </TableCell>
                          </motion.tr>
                        ) : (
                          purchases.map((purchase, index) => (
                            <motion.tr
                              key={purchase.id}
                              custom={index}
                              initial="hidden"
                              animate="visible"
                              whileHover="hover"
                              variants={rowVariants}
                              className="group border"
                              layout
                            >
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="font-mono font-medium text-primary">
                                  {purchase.invoiceNo}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <p className="font-medium">
                                  {purchase.supplier.name}
                                </p>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                {formatDateTime(purchase.invoiceDate)}
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <Badge
                                      variant="outline"
                                      className="font-mono"
                                    >
                                      {purchase.items.length} items
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Total Qty:{" "}
                                    {purchase.items.reduce(
                                      (sum, item) => sum + item.aQty,
                                      0,
                                    )}
                                  </div>
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
                                  {getGstDetailsLabel(purchase.gstDetails)}
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
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                        : purchase.status === "Pending"
                                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                          : purchase.status === "Partially Paid"
                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
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
                                    disabled={
                                      isLoading || purchase.status !== "Pending"
                                    }
                                    title={
                                      purchase.status !== "Pending"
                                        ? "Only pending invoices can be edited"
                                        : "Edit purchase"
                                    }
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
                                    disabled={isLoading || purchase.deleted}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePreview(purchase.id)}
                                    className="h-8 w-8 hover:bg-gray-100"
                                    disabled={isLoading}
                                  >
                                    <FileText className="h-4 w-4 text-gray-600" />
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

          {/* Pagination */}
          {!isLoading && purchases.length > 0 && totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Fixed bottom-left search */}
      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2">
        <AnimatePresence>
          {showSearchBar && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search by invoice no, supplier, product..."
                className="w-64 sm:w-80 pl-10 pr-10 h-12 rounded-full shadow-xl bg-background"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={isLoading}
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full"
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
          )}
        </AnimatePresence>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-xl bg-background"
          onClick={() => setShowSearchBar((prev) => !prev)}
          disabled={isLoading}
          aria-label={showSearchBar ? "Close search" : "Search purchases"}
        >
          {showSearchBar ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Fixed bottom-right actions */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full shadow-xl bg-background"
          onClick={handleRefresh}
          disabled={isLoading}
          aria-label="Refresh purchases"
        >
          <RefreshCw
            className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-xl bg-primary hover:bg-primary/90"
          onClick={handleAddPurchase}
          disabled={isLoading}
          aria-label="Add purchase"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Purchase Form Modal */}
      <PurchaseForm
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingPurchase={editingPurchase}
        onSave={handleSavePurchase}
        isSubmitting={isSubmitting}
      />

      <PurchaseInvoicePreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        purchaseId={previewPurchaseId}
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
        className="sm:max-w-106.25"
      />
    </>
  );
}
