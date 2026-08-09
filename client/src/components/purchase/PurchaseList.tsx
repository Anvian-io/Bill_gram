import { useTheme } from "@/contexts/ThemeProvider";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Plus,
  Search,
  X,
  RefreshCw,
  Package,
  ShoppingCart,
  IndianRupee,
  Check,
  Info,
  Filter,
} from "lucide-react";
import { CustomPagination, CustomDateInput } from "@/components/custom_ui";
import { motion, AnimatePresence } from "framer-motion";
import { getGstDetailsLabel } from "@/store/dropdown_data/gst_details";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";
import { ItemsPerPageSelect } from "@/components/custom_ui/ItemsPerPageSelect";
import { Input } from "@/components/ui/input";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  badgeVariants,
} from "@/components/FramerVariants";
import { toast } from "sonner";
import { refreshActiveLists } from "@/utils/refreshActiveLists";
import { CustomAlert } from "@/components/custom_ui";
import { useDebounce } from "@/utils/debounce";
import PurchaseForm from "@/components/forms/PurchaseForm";
import { purchaseService } from "@/services/purchaseService";
import { useActiveLists } from "@/hooks/useActiveLists";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import type {
  Purchase,
  PurchaseFormData,
  PurchaseFilters,
} from "@/types/purchase";
import { CheckIsExpanded } from "@/utils/commonHelper";
import PurchaseInvoicePreview from "./PurchaseInvoicePreview";

function DateInfoBadge({
  createdAt,
  updatedAt,
  formatDateTime,
}: {
  createdAt: string;
  updatedAt: string;
  formatDateTime: (dateString: string) => string;
}) {
  return (
    <div className="relative group/info inline-block">
      <Badge
        variant="outline"
        className="text-xs cursor-default gap-1 px-2 py-0.5"
      >
        <Info className="h-3 w-3" />
        Info
      </Badge>
      <div className="pointer-events-none absolute z-50 hidden group-hover/info:block bottom-full left-0 mb-2 w-48">
        <Card className="shadow-lg border bg-popover">
          <CardContent className="p-3 space-y-2">
            <div>
              <span className="text-xs font-medium text-green-500">
                Created:
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDateTime(createdAt)}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-orange-500">
                Updated:
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDateTime(updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function Purchase() {
  const { layoutMode } = useTheme();
  const navigate = useNavigate();
  // State
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
  const [invoiceNoInput, setInvoiceNoInput] = useState("");
  const [minAmountInput, setMinAmountInput] = useState("");
  const [maxAmountInput, setMaxAmountInput] = useState("");
  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showMainFilter, setShowMainFilter] = useState(false);
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
    setInvoiceNoInput(value);
    debouncedSetSearch(value);
  };
  const handleInvoiceNoChange = (value: string) => {
    setInvoiceNoInput(value);
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
    setInvoiceNoInput("");
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
        setInvoiceNoInput("");
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
    navigate(`/purchases?tab=add&id=${purchase.id}`);
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
          {/* Toolbar */}
          <motion.div
            className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-1"
            variants={itemVariants}
          >
            <p className="text-sm text-muted-foreground">
              Showing {startIndex} to {endIndex} of {totalItems} purchases
              {activeFiltersCount > 0 && " (filtered)"}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Total purchases:{" "}
                <span className="font-medium text-foreground">
                  {totalItems}
                </span>
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9"
                onClick={() => setShowMainFilter((prev) => !prev)}
                disabled={isLoading}
              >
                <Filter className="h-4 w-4" />
                {showMainFilter ? "Hide Main Filter" : "Show Main Filter"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleAddPurchase}
                disabled={isLoading}
                aria-label="Add purchase"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleRefresh}
                disabled={isLoading}
                aria-label="Refresh purchases"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  Items per page:
                </div>
                <ItemsPerPageSelect
                  value={itemsPerPage}
                  onChange={setItemsPerPage}
                  disabled={isLoading}
                />
              </div>
            </div>
          </motion.div>

          {/* Main Filter Section */}
          <AnimatePresence>
            {showMainFilter && (
              <motion.div
                className="mb-4"
                variants={itemVariants}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-1">
                    <div className="flex flex-col gap-4 p-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Purchases Table */}
          <motion.div variants={itemVariants}>
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                  <Table
                    className={cn(
                      "table-fixed",
                      layoutMode === "classic" && "classic-table",
                    )}
                  >
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead className="font-semibold w-[120px] max-w-[120px] whitespace-normal text-center">
                          Invoice No
                        </TableHead>
                        <TableHead className="font-semibold w-[140px] max-w-[140px] whitespace-normal text-center">
                          Supplier
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Invoice Date
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Items
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Gross Amount
                        </TableHead>
                        <TableHead className="font-semibold w-[64px] max-w-[64px] whitespace-normal px-1 text-center">
                          Tax
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Final Amount
                        </TableHead>
                        <TableHead className="font-semibold w-[72px] max-w-[72px] whitespace-normal px-1 text-center">
                          GST Details
                        </TableHead>
                        <TableHead className="font-semibold w-[72px] max-w-[72px] whitespace-normal px-1 text-center">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold w-[72px] max-w-[72px] px-2 text-center">
                          Info
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Actions
                        </TableHead>
                      </TableRow>
                      <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                        <TableHead className="py-2 w-[120px] max-w-[120px] whitespace-normal">
                          <Input
                            placeholder="Invoice No"
                            value={invoiceNoInput}
                            onChange={(e) =>
                              handleInvoiceNoChange(e.target.value)
                            }
                            className="h-8 text-xs font-normal"
                            disabled={isLoading}
                          />
                        </TableHead>
                        <TableHead className="py-2 w-[140px] max-w-[140px] whitespace-normal">
                          <InlineSearchField
                            open={supplierOpen}
                            onOpenChange={setSupplierOpen}
                            displayValue={getSupplierName(filters.supplierId!)}
                            placeholder="Supplier"
                            emptyMessage="No supplier found."
                            disabled={isLoading}
                            inputClassName="h-8 text-xs"
                          >
                            <CommandGroup>
                              <CommandItem
                                value="all"
                                onSelect={() => {
                                  handleFilterChange("supplierId", "all");
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
                        </TableHead>
                        <TableHead className="py-2" />
                        <TableHead className="py-2" />
                        <TableHead className="py-2" />
                        <TableHead className="py-2" />
                        <TableHead className="py-2" />
                        <TableHead className="py-2 w-[72px] max-w-[72px] px-1" />
                        <TableHead className="py-2 w-[72px] max-w-[72px] px-1" />
                        <TableHead className="py-2 w-[72px] max-w-[72px] px-2" />
                        <TableHead className="py-2" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                          <TableRow>
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
                          </TableRow>
                        ) : purchases.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={11}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-2" />
                                <p>No purchases found matching your filters.</p>
                                <Button
                                  variant="link"
                                  onClick={clearFilters}
                                  className="mt-2"
                                >
                                  Clear all filters
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          purchases.map((purchase) => (
                            <TableRow
                              key={purchase.id}
                              className="group border"
                            >
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[120px] max-w-[120px] whitespace-normal align-top">
                                <div
                                  className="font-mono font-medium text-primary truncate"
                                  title={purchase.invoiceNo}
                                >
                                  {purchase.invoiceNo}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[140px] max-w-[140px] whitespace-normal align-top">
                                <p
                                  className="font-medium truncate"
                                  title={purchase.supplier.name}
                                >
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
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[64px] max-w-[64px] px-1 align-top">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 truncate max-w-full"
                                  title={`₹${purchase.tax.toFixed(2)}`}
                                >
                                  ₹{purchase.tax.toFixed(2)}
                                </Badge>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="font-bold text-green-700">
                                  ₹{purchase.finalAmount.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[72px] max-w-[72px] px-1 align-top">
                                <div
                                  className="text-xs text-muted-foreground truncate"
                                  title={getGstDetailsLabel(
                                    purchase.gstDetails,
                                  )}
                                >
                                  {getGstDetailsLabel(purchase.gstDetails)}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[72px] max-w-[72px] whitespace-normal px-1 align-top">
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
                                    className={cn(
                                      "text-[10px] px-1.5 py-0.5 whitespace-normal text-center leading-tight",
                                      purchase.status === "Paid"
                                        ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                                        : purchase.status === "Pending"
                                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400"
                                          : purchase.status === "Partially Paid"
                                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                                            : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400",
                                    )}
                                  >
                                    {purchase.status}
                                  </Badge>
                                </motion.div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 w-[72px] max-w-[72px] px-2">
                                <DateInfoBadge
                                  createdAt={purchase.createdAt}
                                  updatedAt={purchase.updatedAt}
                                  formatDateTime={formatDateTime}
                                />
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30">
                                <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 shrink-0",
                                      isLoading || purchase.status !== "Pending"
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer hover:bg-green-100 text-green-700 border-green-200",
                                    )}
                                    title={
                                      purchase.status !== "Pending"
                                        ? "Only pending invoices can be edited"
                                        : "Edit purchase"
                                    }
                                    onClick={() => {
                                      if (
                                        !isLoading &&
                                        purchase.status === "Pending"
                                      ) {
                                        handleEditPurchase(purchase);
                                      }
                                    }}
                                  >
                                    edit
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 shrink-0",
                                      isLoading || purchase.deleted
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer hover:bg-red-100 text-red-700 border-red-200",
                                    )}
                                    onClick={() => {
                                      if (!isLoading && !purchase.deleted) {
                                        confirmDeletePurchase(purchase);
                                      }
                                    }}
                                  >
                                    delete
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 cursor-pointer shrink-0 hover:bg-secondary text-muted-foreground",
                                      isLoading &&
                                        "opacity-50 cursor-not-allowed",
                                    )}
                                    onClick={() => {
                                      if (!isLoading) {
                                        handlePreview(purchase.id);
                                      }
                                    }}
                                  >
                                    preview
                                  </Badge>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
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
                    setInvoiceNoInput("");
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
