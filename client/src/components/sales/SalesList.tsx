import { useTheme } from "@/contexts/ThemeProvider";
import { useState, useEffect, useCallback, useRef } from "react";
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
import {
  Filter,
  Edit,
  Trash2,
  Search,
  X,
  Calendar,
  Plus,
  Package,
  ShoppingCart,
  RefreshCw,
  IndianRupee,
  Check,
  ChevronsUpDown,
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
  headerVariants,
  buttonVariants,
} from "../FramerVariants";
import { toast } from "sonner";
import { refreshActiveLists } from "@/utils/refreshActiveLists";
import { CustomAlert } from "@/components/custom_ui";
import { useDebounce } from "@/utils/debounce";
import SalesForm from "../forms/SalesForm";
import type { Sales, SalesFormData, SalesFilters } from "@/types/sales";
import { useActiveLists } from "@/hooks/useActiveLists";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { salesService } from "@/services/salesService";
import { CheckIsExpanded } from "@/utils/commonHelper";
import { FileText } from "lucide-react"; // add this
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // add this
import SalesInvoicePreview from "./SalesInvoicePreview";

export default function Sales() {
  const { layoutMode } = useTheme();
  // State for sales
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sales[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSales, setEditingSales] = useState<Sales | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [salesToDelete, setSalesToDelete] = useState<Sales | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSaleId, setPreviewSaleId] = useState<number>(0);

  // Get data from Redux store
  const { areas, customers, salesmen, vans } = useActiveLists();

  // Filter state – now with fromDate/toDate and minAmount/maxAmount
  const [filters, setFilters] = useState<SalesFilters>({
    search: "",
    invoiceNo: "",
    areaId: "all",
    customerId: "all",
    vanId: "all",
    salesmanId: "all",
    gstDetails: undefined,
    minAmount: "",
    maxAmount: "",
    fromDate: undefined,
    toDate: undefined,
    status: "all",
  });

  // State for Command dropdowns
  const [areaOpen, setAreaOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [vanOpen, setVanOpen] = useState(false);
  const [salesmanOpen, setSalesmanOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(true);

  // Local input values (before debounce)
  const [searchInput, setSearchInput] = useState("");
  const [invoiceNoInput, setInvoiceNoInput] = useState("");
  const [minAmountInput, setMinAmountInput] = useState("");
  const [maxAmountInput, setMaxAmountInput] = useState("");
  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);

  // Ref to track if initial load is done
  const initialLoadDone = useRef(false);
  // Ref to track current request to prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced filter setters
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

  // Input handlers
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

  // Generic filter change for selects
  const handleFilterChange = (field: keyof SalesFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      invoiceNo: "",
      areaId: "all",
      customerId: "all",
      vanId: "all",
      salesmanId: "all",
      gstDetails: undefined,
      minAmount: "",
      maxAmount: "",
      fromDate: undefined,
      toDate: undefined,
      status: "all",
    });
    setSearchInput("");
    setInvoiceNoInput("");
    setMinAmountInput("");
    setMaxAmountInput("");
    setFromDateValue(null);
    setToDateValue(null);
    setCurrentPage(1);
  };

  // Clear a single filter
  const clearFilter = (filterName: keyof SalesFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "areaId" ||
        filterName === "customerId" ||
        filterName === "vanId" ||
        filterName === "salesmanId" ||
        filterName === "status"
          ? "all"
          : filterName === "gstDetails"
            ? undefined
          : filterName === "fromDate" || filterName === "toDate"
            ? undefined
            : "",
    }));

    // Clear the corresponding input field
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
      case "fromDate":
        setFromDateValue(null);
        break;
      case "toDate":
        setToDateValue(null);
        break;
    }
  };

  // Memoized fetch function to prevent recreating on every render
  const fetchSales = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const apiFilters: any = {
        page: currentPage,
        limit: itemsPerPage,
        search: filters.search || undefined,
        invoiceNo: filters.invoiceNo || undefined,
        areaId: filters.areaId === "all" ? undefined : filters.areaId,
        customerId:
          filters.customerId === "all" ? undefined : filters.customerId,
        vanId: filters.vanId === "all" ? undefined : filters.vanId,
        salesmanId:
          filters.salesmanId === "all" ? undefined : filters.salesmanId,
        gstDetails: filters.gstDetails,
        status: filters.status === "all" ? undefined : filters.status,
        minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
      };

      // Add date range if present
      if (fromDateValue) {
        apiFilters.fromDate = fromDateValue;
      }
      if (toDateValue) {
        apiFilters.toDate = toDateValue;
      }

      const response = await salesService.getSales(
        currentPage,
        itemsPerPage,
        apiFilters,
      );

      // Only update state if this request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setSales(response.sales);
        setTotalItems(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error: any) {
      // Don't show error if request was cancelled
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        return;
      }
      console.error("Error fetching sales:", error);
      toast.error("Failed to fetch sales");
      setSales([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      // Only set loading to false if this was the most recent request
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [
    currentPage,
    itemsPerPage,
    filters.search,
    filters.invoiceNo,
    filters.areaId,
    filters.customerId,
    filters.vanId,
    filters.salesmanId,
    filters.gstDetails,
    filters.status,
    filters.minAmount,
    filters.maxAmount,
    filters.fromDate,
    filters.toDate,
  ]);

  // Effect for initial load and when dependencies change
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      await fetchSales();
      if (isMounted) {
        initialLoadDone.current = true;
      }
    };

    loadData();

    return () => {
      isMounted = false;
      // Cancel any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchSales]);

  // Reset to first page when filter values change (not the whole filters object)
  useEffect(() => {
    // Skip on initial render
    if (!initialLoadDone.current) return;

    setCurrentPage(1);
  }, [
    filters.search,
    filters.invoiceNo,
    filters.areaId,
    filters.customerId,
    filters.vanId,
    filters.salesmanId,
    filters.minAmount,
    filters.maxAmount,
    filters.fromDate,
    filters.toDate,
    filters.gstDetails,
    filters.status,
  ]);

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

  // Handlers for CRUD
  const handleAddSales = () => {
    setEditingSales(null);
    setIsModalOpen(true);
  };

  const handleEditSales = async (sale: Sales) => {
    try {
      setIsLoading(true);
      const fullSale = await salesService.getSale(sale.id);
      console.log("Fetched sale for editing:", fullSale);
      setEditingSales(fullSale);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Failed to load sale details");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteSales = (sale: Sales) => {
    setSalesToDelete(sale);
    setDeleteOpen(true);
  };

  const handleDeleteSales = async () => {
    if (!salesToDelete) return;
    try {
      await salesService.deleteSale(salesToDelete.id);
      toast.success("Sales deleted successfully");
      void refreshActiveLists();
      fetchSales();
    } catch (error) {
      toast.error("Failed to delete sales");
    } finally {
      setSalesToDelete(null);
      setDeleteOpen(false);
    }
  };

  const handleSaveSales = async (data: SalesFormData, id?: number) => {
    setIsSubmitting(true);
    try {
      if (id) {
        await salesService.updateSale(id, data);
        toast.success("Sales updated successfully");
      } else {
        await salesService.createSale(data);
        toast.success("Sales created successfully");
      }
      void refreshActiveLists();
      setIsModalOpen(false);
      fetchSales();
    } catch (error: any) {
      toast.error(error.message || "Failed to save sales");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    fetchSales();
    toast.info("Refreshing sales data...");
  };

  // Active filters count
  const activeFiltersCount =
    Object.entries(filters).filter(
      ([key, value]) =>
        key !== "search" &&
        value &&
        value !== "all" &&
        !(value instanceof Date) &&
        value !== "",
    ).length +
    (filters.fromDate ? 1 : 0) +
    (filters.toDate ? 1 : 0);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const getAreaName = (id: string) => {
    if (id === "all") return "";
    const area = areas.find((a) => a.id.toString() === id);
    return area ? area.name : "";
  };

  const getCustomerName = (id: string) => {
    if (id === "all") return "";
    const customer = customers.find((c) => c.id.toString() === id);
    return customer
      ? customer.companyName || customer.personName || ""
      : "";
  };

  const getVanName = (id: string) => {
    if (id === "all") return "";
    const van = vans.find((v) => v.id.toString() === id);
    return van ? van.name : "";
  };

  const getSalesmanName = (id: string) => {
    if (id === "all") return "";
    const salesman = salesmen.find((s) => s.id.toString() === id);
    return salesman ? salesman.name : "";
  };

    const handlePreview = (saleId: number) => {
      setPreviewSaleId(saleId);
      setIsPreviewOpen(true);
    };

  return (
    <>
      <motion.div
        className="min-h-screen bg-background p-3"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div
          className={`mx-auto ${
            CheckIsExpanded()
              ? "max-w-5xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl"
              : "max-w-9xl lg:max-w-5xl xl:max-w-7xl 2xl:max-w-8xl"
          }`}
        >
          {/* Header */}
          <motion.div
            className="flex flex-col gap-6 mb-6 w-full"
            variants={headerVariants}
          >
            <div className="flex justify-between gap-4">
              

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
                  placeholder="Search by invoice no, customer, area, van, salesman..."
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
                    onClick={handleAddSales}
                    className="gap-2 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                    New Sales
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
                          <div>
                            <div className="flex gap-2">
                              <Input
                                id="invoiceNo"
                                placeholder="Invoice No"
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
                                  onClick={() => clearFilter("invoiceNo")}
                                  disabled={isLoading}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Area Filter */}
                          <div>
                            <InlineSearchField
                            open={areaOpen}
                            onOpenChange={setAreaOpen}
                            displayValue={getAreaName(filters.areaId as string)}
                            placeholder="Area"
                            emptyMessage="No area found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                                      <CommandItem
                                        value="all"
                                        onSelect={() => {
                                          handleFilterChange("areaId", "all");
                                          setAreaOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.areaId === "all"
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        All Areas
                                      </CommandItem>
                                      {areas.map((area) => (
                                        <CommandItem
                                          key={area.id}
                                          value={area.id.toString()}
                                          onSelect={() => {
                                            handleFilterChange(
                                              "areaId",
                                              area.id.toString(),
                                            );
                                            setAreaOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.areaId ===
                                                area.id.toString()
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          {area.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                          </InlineSearchField>
                          </div>

                          {/* Customer Filter */}
                          <div>
                            <InlineSearchField
                            open={customerOpen}
                            onOpenChange={setCustomerOpen}
                            displayValue={getCustomerName(
                                    filters.customerId as string,
                                  )}
                            placeholder="Customer"
                            emptyMessage="No customer found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                                      <CommandItem
                                        value="all"
                                        onSelect={() => {
                                          handleFilterChange(
                                            "customerId",
                                            "all",
                                          );
                                          setCustomerOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.customerId === "all"
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        All Customers
                                      </CommandItem>
                                      {customers.map((customer) => (
                                        <CommandItem
                                          key={customer.id}
                                          value={customer.id.toString()}
                                          onSelect={() => {
                                            handleFilterChange(
                                              "customerId",
                                              customer.id.toString(),
                                            );
                                            setCustomerOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.customerId ===
                                                customer.id.toString()
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          {customer.companyName ||
                                            customer.personName}
                                          {customer.phoneNo && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              ({customer.phoneNo})
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

                          {/* Van Filter */}
                          <div>
                            <InlineSearchField
                            open={vanOpen}
                            onOpenChange={setVanOpen}
                            displayValue={getVanName(filters.vanId as string)}
                            placeholder="Van"
                            emptyMessage="No van found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                                      <CommandItem
                                        value="all"
                                        onSelect={() => {
                                          handleFilterChange("vanId", "all");
                                          setVanOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.vanId === "all"
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        All Vans
                                      </CommandItem>
                                      {vans.map((van) => (
                                        <CommandItem
                                          key={van.id}
                                          value={van.id.toString()}
                                          onSelect={() => {
                                            handleFilterChange(
                                              "vanId",
                                              van.id.toString(),
                                            );
                                            setVanOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.vanId ===
                                                van.id.toString()
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          {van.name}
                                          {van.vehicleNo && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              ({van.vehicleNo})
                                            </span>
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                          </InlineSearchField>
                          </div>

                          {/* Salesman Filter */}
                          <div>
                            <InlineSearchField
                            open={salesmanOpen}
                            onOpenChange={setSalesmanOpen}
                            displayValue={getSalesmanName(
                                    filters.salesmanId as string,
                                  )}
                            placeholder="Salesman"
                            emptyMessage="No salesman found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                                      <CommandItem
                                        value="all"
                                        onSelect={() => {
                                          handleFilterChange(
                                            "salesmanId",
                                            "all",
                                          );
                                          setSalesmanOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.salesmanId === "all"
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        All Salesmen
                                      </CommandItem>
                                      {salesmen.map((salesman) => (
                                        <CommandItem
                                          key={salesman.id}
                                          value={salesman.id.toString()}
                                          onSelect={() => {
                                            handleFilterChange(
                                              "salesmanId",
                                              salesman.id.toString(),
                                            );
                                            setSalesmanOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              filters.salesmanId ===
                                                salesman.id.toString()
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          {salesman.name}
                                          {salesman.phoneNo && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                              ({salesman.phoneNo})
                                            </span>
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                          </InlineSearchField>
                          </div>

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

                          {/* Status Filter */}
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
                                  value="Delivered"
                                  onSelect={() => {
                                    handleFilterChange("status", "Delivered");
                                    setStatusOpen(false);
                                  }}
                                >
                                  Delivered
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
              Showing {startIndex} to {endIndex} of {totalItems} sales
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

          {/* Sales Table (unchanged) */}
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
                          Customer
                        </TableHead>
                        <TableHead className="font-semibold">Area</TableHead>
                        <TableHead className="font-semibold">Van</TableHead>
                        <TableHead className="font-semibold">
                          Salesman
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
                            // transition={{ duration: 0.3 }}
                          >
                            <TableCell
                              colSpan={15}
                              className="text-center py-12"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">
                                  Loading sales...
                                </p>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ) : sales.length === 0 ? (
                          <motion.tr
                            key="no-data"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <TableCell
                              colSpan={15}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <motion.div
                                className="flex flex-col items-center justify-center"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                              >
                                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-2" />
                                <p>No sales found matching your filters.</p>
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
                          sales.map((sale, index) => (
                            <motion.tr
                              key={sale.id}
                              custom={index}
                              initial="hidden"
                              animate="visible"
                              whileHover="hover"
                              variants={rowVariants}
                              className="group border-1"
                              layout
                              transition={{ layout: { duration: 0.3 } }}
                            >
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="font-mono font-medium text-primary">
                                  {sale.invoiceNo}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div>
                                  <p className="font-medium">
                                    {sale.customer.companyName ||
                                      sale.customer.personName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {sale.customer.phoneNo &&
                                      `Phone: ${sale.customer.phoneNo}`}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-500"
                                >
                                  {sale.area.name}
                                </Badge>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div>
                                  <p className="font-medium text-sm">
                                    {sale.van.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {sale.van.vehicleNo}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div>
                                  <p className="font-medium text-sm">
                                    {sale.salesman.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {sale.salesman.phoneNo}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                {formatDateTime(sale.invoiceDate)}
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <Badge
                                      variant="outline"
                                      className="font-mono"
                                    >
                                      {sale.items.length} items
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Total Qty:{" "}
                                    {sale.items.reduce(
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
                                    ₹{sale.grossAmount.toFixed(2)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700"
                                >
                                  ₹{sale.tax.toFixed(2)}
                                </Badge>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="font-bold text-green-700">
                                  ₹{sale.finalAmount.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                {sale.discountPercent > 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-50 text-red-700"
                                  >
                                    {sale.discountPercent}%
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="text-xs text-muted-foreground">
                                  {getGstDetailsLabel(sale.gstDetails)}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="space-y-1">
                                  <div className="flex items-center">
                                    <span className="text-xs font-medium text-green-400">
                                      Created:
                                    </span>
                                    <p className="text-xs text-muted-foreground ml-1">
                                      {formatDateTime(sale.createdAt)}
                                    </p>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs font-medium text-orange-400">
                                      Updated:
                                    </span>
                                    <p className="text-xs text-muted-foreground ml-1">
                                      {formatDateTime(sale.updatedAt)}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30">
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditSales(sale)}
                                    className="h-8 w-8 hover:bg-green-100"
                                    disabled={isLoading}
                                  >
                                    <Edit className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => confirmDeleteSales(sale)}
                                    className="h-8 w-8 hover:bg-red-100"
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePreview(sale.id)}
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
          {!isLoading && sales.length > 0 && totalPages > 1 && (
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

      <SalesInvoicePreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        saleId={previewSaleId}
      />

      {/* Sales Form Modal */}
      <SalesForm
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingSales={editingSales}
        onSave={handleSaveSales}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation */}
      <CustomAlert
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        mainText="Delete Sales"
        subText={
          salesToDelete
            ? `Are you sure you want to delete sales "${salesToDelete.invoiceNo}"? This action cannot be undone.`
            : "This action cannot be undone."
        }
        nextButtonText="Delete"
        cancelButtonText="Cancel"
        onNext={handleDeleteSales}
        variant="destructive"
        showCancel={true}
        className="sm:max-w-[425px]"
      />
    </>
  );
}
