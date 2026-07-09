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
  Search,
  X,
  Plus,
  Package,
  ShoppingCart,
  RefreshCw,
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
  rowVariants,
} from "../FramerVariants";
import { toast } from "sonner";
import { refreshActiveLists } from "@/utils/refreshActiveLists";
import { CustomAlert } from "@/components/custom_ui";
import { useDebounce } from "@/utils/debounce";
import type { Sales, SalesFilters } from "@/types/sales";
import { useActiveLists } from "@/hooks/useActiveLists";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { salesService } from "@/services/salesService";
import { CheckIsExpanded } from "@/utils/commonHelper";
import SalesInvoicePreview from "./SalesInvoicePreview";

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

export default function Sales() {
  const { layoutMode } = useTheme();
  // State for sales
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sales[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Local input values (before debounce)
  const [searchInput, setSearchInput] = useState("");
  const [invoiceNoInput, setInvoiceNoInput] = useState("");
  const [minAmountInput, setMinAmountInput] = useState("");
  const [maxAmountInput, setMaxAmountInput] = useState("");
  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showMainFilter, setShowMainFilter] = useState(false);

  // Ref to track if initial load is done
  const initialLoadDone = useRef(false);
  // Ref to track current request to prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (showSearchBar) {
      searchInputRef.current?.focus();
    }
  }, [showSearchBar]);

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

  const formatAuditDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  // Handlers for CRUD
  const handleAddSales = () => {
    navigate("/sales?tab=add&id=new");
  };

  const handleEditSales = async (sale: Sales) => {
    navigate(`/sales?tab=add&id=${sale.id}`);
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
    return customer ? customer.companyName || customer.personName || "" : "";
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
        className="min-h-screen bg-background p-3 pb-24"
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
          {/* Toolbar */}
          <motion.div
            className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-1"
            variants={itemVariants}
          >
            <p className="text-sm text-muted-foreground">
              Showing {startIndex} to {endIndex} of {totalItems} sales
              {activeFiltersCount > 0 && " (filtered)"}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Total sales:{" "}
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
                onClick={handleAddSales}
                disabled={isLoading}
                aria-label="Add sales"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleRefresh}
                disabled={isLoading}
                aria-label="Refresh sales"
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
                                      filters.vanId === van.id.toString()
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
                                  handleFilterChange("salesmanId", "all");
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sales Table */}
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
                        <TableHead className="font-semibold w-[120px] max-w-[120px] text-center">
                          Invoice No
                        </TableHead>
                        <TableHead className="font-semibold w-[140px] max-w-[140px] text-center">
                          Customer
                        </TableHead>
                        <TableHead className="font-semibold min-w-[100px] text-center">
                          Area
                        </TableHead>
                        <TableHead className="font-semibold min-w-[100px] text-center">
                          Invoice Date
                        </TableHead>
                        <TableHead className="font-semibold min-w-[90px] text-center">
                          Items
                        </TableHead>
                        <TableHead className="font-semibold min-w-[100px] text-center">
                          Gross Amount
                        </TableHead>
                        <TableHead className="font-semibold w-[64px] max-w-[64px] whitespace-normal px-1 text-center">
                          Tax
                        </TableHead>
                        <TableHead className="font-semibold min-w-[100px] text-center">
                          Final Amount
                        </TableHead>
                        <TableHead className="font-semibold w-[72px] max-w-[72px] whitespace-normal px-1 text-center">
                          GST Details
                        </TableHead>
                        <TableHead className="font-semibold w-[72px] max-w-[72px] px-2 text-center">
                          Info
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Actions
                        </TableHead>
                      </TableRow>
                      <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                        <TableHead className="py-2 w-[120px] max-w-[120px]">
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
                        <TableHead className="py-2 w-[140px] max-w-[140px]">
                          <InlineSearchField
                            open={customerOpen}
                            onOpenChange={setCustomerOpen}
                            displayValue={getCustomerName(
                              filters.customerId as string,
                            )}
                            placeholder="Customer"
                            emptyMessage="No customer found."
                            disabled={isLoading}
                            inputClassName="h-8 text-xs"
                          >
                            <CommandGroup>
                              <CommandItem
                                value="all"
                                onSelect={() => {
                                  handleFilterChange("customerId", "all");
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
                                  {customer.companyName || customer.personName}
                                  {customer.phoneNo && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      ({customer.phoneNo})
                                    </span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </InlineSearchField>
                        </TableHead>
                        <TableHead className="py-2 min-w-[100px]">
                          <InlineSearchField
                            open={areaOpen}
                            onOpenChange={setAreaOpen}
                            displayValue={getAreaName(filters.areaId as string)}
                            placeholder="Area"
                            emptyMessage="No area found."
                            disabled={isLoading}
                            inputClassName="h-8 text-xs"
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
                                      filters.areaId === area.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {area.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </InlineSearchField>
                        </TableHead>
                        <TableHead className="py-2 min-w-[100px]" />
                        <TableHead className="py-2 min-w-[90px]" />
                        <TableHead className="py-2 min-w-[100px]" />
                        <TableHead className="py-2 w-[64px] max-w-[64px] px-1" />
                        <TableHead className="py-2 min-w-[100px]" />
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
                                  Loading sales...
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : sales.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={11}
                              className="text-center py-8 text-muted-foreground"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-2" />
                                <p>No sales found matching your filters.</p>
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
                          sales.map((sale) => (
                            <TableRow
                              key={sale.id}
                              className="group border"
                            >
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[120px] max-w-[120px] align-top">
                                <div
                                  className="font-mono font-medium text-primary truncate"
                                  title={sale.invoiceNo}
                                >
                                  {sale.invoiceNo}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[140px] max-w-[140px] align-top">
                                <div className="min-w-0">
                                  <p
                                    className="font-medium truncate"
                                    title={
                                      sale.customer.companyName ||
                                      sale.customer.personName ||
                                      undefined
                                    }
                                  >
                                    {sale.customer.companyName ||
                                      sale.customer.personName}
                                  </p>
                                  {sale.customer.phoneNo && (
                                    <p
                                      className="text-xs text-muted-foreground truncate"
                                      title={sale.customer.phoneNo}
                                    >
                                      {sale.customer.phoneNo}
                                    </p>
                                  )}
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
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[64px] max-w-[64px] px-1 align-top">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 truncate max-w-full"
                                  title={`₹${sale.tax.toFixed(2)}`}
                                >
                                  ₹{sale.tax.toFixed(2)}
                                </Badge>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer">
                                <div className="font-bold text-green-700">
                                  ₹{sale.finalAmount.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 cursor-pointer w-[72px] max-w-[72px] px-1 align-top">
                                <div
                                  className="text-xs text-muted-foreground truncate"
                                  title={getGstDetailsLabel(sale.gstDetails)}
                                >
                                  {getGstDetailsLabel(sale.gstDetails)}
                                </div>
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30 w-[72px] max-w-[72px] px-2">
                                <DateInfoBadge
                                  createdAt={sale.createdAt}
                                  updatedAt={sale.updatedAt}
                                  formatDateTime={formatAuditDateTime}
                                />
                              </TableCell>
                              <TableCell className="group-hover:bg-secondary/30">
                                <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 shrink-0",
                                      isLoading
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer hover:bg-green-100 text-green-700 border-green-200",
                                    )}
                                    onClick={() => {
                                      if (!isLoading) {
                                        handleEditSales(sale);
                                      }
                                    }}
                                  >
                                    edit
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 shrink-0",
                                      isLoading
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer hover:bg-red-100 text-red-700 border-red-200",
                                    )}
                                    onClick={() => {
                                      if (!isLoading) {
                                        confirmDeleteSales(sale);
                                      }
                                    }}
                                  >
                                    delete
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 shrink-0",
                                      isLoading
                                        ? "opacity-50 cursor-not-allowed"
                                        : "cursor-pointer hover:bg-gray-100 text-gray-700 border-gray-200",
                                    )}
                                    onClick={() => {
                                      if (!isLoading) {
                                        handlePreview(sale.id);
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
                placeholder="Search by invoice no, customer, area..."
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
          aria-label={showSearchBar ? "Close search" : "Search sales"}
        >
          {showSearchBar ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>
      </div>

      <SalesInvoicePreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        saleId={previewSaleId}
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
