import { useState, useEffect } from "react";
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
  Plus,
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
} from "@/components/FramerVariants";
import { toast } from "sonner";
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

// ----------------------------------------------------------------------
// Date Utilities
// ----------------------------------------------------------------------
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
      if (isValid(parsed)) return parsed;
    } catch {
      // continue
    }
  }
  return undefined;
};

const formatDateToDisplay = (date: Date | undefined): string => {
  if (!date) return "";
  return format(date, "dd/MM/yyyy");
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function Purchase() {
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
  const [showFilters, setShowFilters] = useState(false);

  // Filters state – invoiceNo removed
  const [filters, setFilters] = useState<PurchaseFilters>({
    search: "",
    supplierId: "all",
    minAmount: "",
    maxAmount: "",
    fromDate: undefined,
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
  const [fromDateInput, setFromDateInput] = useState("");

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
  const handleFromDateInputChange = (value: string) => {
    setFromDateInput(value);
    const parsed = parseDateFromString(value);
    if (parsed) {
      setFilters((prev) => ({ ...prev, fromDate: parsed }));
    } else if (value === "") {
      setFilters((prev) => ({ ...prev, fromDate: undefined }));
    }
  };
  const handleFromDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, fromDate: date }));
    setFromDateInput(date ? formatDateToDisplay(date) : "");
  };

  // Generic filter change
  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      supplierId: "all",
      minAmount: "",
      maxAmount: "",
      fromDate: undefined,
      status: "all",
      page: 1,
      limit: itemsPerPage,
      showDeleted: false,
    });
    setSearchInput("");
    setMinAmountInput("");
    setMaxAmountInput("");
    setFromDateInput("");
  };

  // Clear a single filter
  const clearFilter = (filterName: keyof PurchaseFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "supplierId" || filterName === "status"
          ? "all"
          : filterName === "fromDate"
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
        setMaxAmountInput(""); // fixed
        break;
      case "fromDate":
        setFromDateInput("");
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
        minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
        fromDate: filters.fromDate,
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
  // CRUD Handlers
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

  // --------------------------------------------------------------------
  // Helper functions
  // --------------------------------------------------------------------
  const activeFiltersCount =
    Object.entries(filters).filter(
      ([key, value]) =>
        key !== "search" &&
        key !== "fromDate" &&
        value &&
        value !== "all" &&
        value !== "" &&
        !(value instanceof Date) &&
        !(key === "showDeleted" && !value),
    ).length + (filters.fromDate ? 1 : 0);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const getSupplierName = (id: string | number) => {
    if (id === "all" || !id) return "All Suppliers";
    const supplier = suppliers.find((s) => s.id.toString() === id.toString());
    return supplier ? supplier.name : "Select Supplier";
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
        className="min-h-screen bg-background p-3"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-8xl mx-auto">
          {/* Header Section */}
          <motion.div
            className="flex flex-col gap-6 mb-6 w-full"
            variants={headerVariants}
          >
            <div className="flex justify-between gap-4">
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
                          {/* Supplier */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Supplier
                            </Label>
                            <Popover
                              open={supplierOpen}
                              onOpenChange={setSupplierOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={supplierOpen}
                                  className="w-full justify-between"
                                  disabled={isLoading}
                                >
                                  {getSupplierName(filters.supplierId!)}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search suppliers..." />
                                  <CommandList>
                                    <CommandEmpty>
                                      No supplier found.
                                    </CommandEmpty>
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
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Amount Range */}
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

                          {/* Status */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="status"
                              className="text-sm font-medium"
                            >
                              Status
                            </Label>
                            <Select
                              value={filters.status}
                              onValueChange={(value) =>
                                handleFilterChange("status", value)
                              }
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

                          {/* Invoice Date (fromDate) */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Invoice Date
                            </Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  value={fromDateInput}
                                  onChange={(e) =>
                                    handleFromDateInputChange(e.target.value)
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
                                      selected={filters.fromDate}
                                      onSelect={handleFromDateSelect}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              {fromDateInput && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10"
                                  onClick={() => clearFilter("fromDate")}
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

          {/* Purchases Table */}
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
                              className="group border-1"
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
