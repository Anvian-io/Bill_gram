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
  Search,
  X,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Calendar,
  ChevronsUpDown,
  Check,
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
  headerVariants,
  buttonVariants,
} from "@/components/FramerVariants";
import { toast } from "sonner";
import { useDebounce } from "@/utils/debounce";
import { salesService } from "@/services/salesService";
import { useActiveLists } from "@/hooks/useActiveLists";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { SalesReportItem, SalesReportFilters } from "@/types/sales-report";

// ----------------------------------------------------------------------
// Date Utilities (same as Purchase component)
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
export default function SalesSummary() {
  // State
  const [reportData, setReportData] = useState<SalesReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [vanOpen, setVanOpen] = useState(false);
  const [salesmanOpen, setSalesmanOpen] = useState(false);
  const [productGroupOpen, setProductGroupOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filters state
  const [filters, setFilters] = useState<SalesReportFilters>({
    fromDate: undefined,
    toDate: undefined,
    invoiceNo: "",
    customerId: undefined,
    areaId: undefined,
    vanId: undefined,
    salesmanId: undefined,
    productGroupId: undefined,
  });

  // Local inputs for debounced fields
  const [invoiceNoInput, setInvoiceNoInput] = useState("");
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");

  // Pagination (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Hooks – assuming useActiveLists returns all required lists
  const { customers, areas, vans, salesmen, groups } = useActiveLists();

  // --------------------------------------------------------------------
  // Debounced filter setters
  // --------------------------------------------------------------------
  const debouncedSetInvoiceNo = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, invoiceNo: value }));
  }, 300);

  // --------------------------------------------------------------------
  // Input handlers
  // --------------------------------------------------------------------
  const handleInvoiceNoChange = (value: string) => {
    setInvoiceNoInput(value);
    debouncedSetInvoiceNo(value);
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

  const handleToDateInputChange = (value: string) => {
    setToDateInput(value);
    const parsed = parseDateFromString(value);
    if (parsed) {
      setFilters((prev) => ({ ...prev, toDate: parsed }));
    } else if (value === "") {
      setFilters((prev) => ({ ...prev, toDate: undefined }));
    }
  };

  const handleToDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, toDate: date }));
    setToDateInput(date ? formatDateToDisplay(date) : "");
  };

  const handleFilterChange = (field: keyof SalesReportFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      fromDate: undefined,
      toDate: undefined,
      invoiceNo: "",
      customerId: undefined,
      areaId: undefined,
      vanId: undefined,
      salesmanId: undefined,
      productGroupId: undefined,
    });
    setInvoiceNoInput("");
    setFromDateInput("");
    setToDateInput("");
  };

  const clearFilter = (filterName: keyof SalesReportFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "customerId" ||
        filterName === "areaId" ||
        filterName === "vanId" ||
        filterName === "salesmanId" ||
        filterName === "productGroupId"
          ? undefined
          : filterName === "fromDate" || filterName === "toDate"
            ? undefined
            : "",
    }));
    switch (filterName) {
      case "invoiceNo":
        setInvoiceNoInput("");
        break;
      case "fromDate":
        setFromDateInput("");
        break;
      case "toDate":
        setToDateInput("");
        break;
    }
  };

  // --------------------------------------------------------------------
  // Fetch report data
  // --------------------------------------------------------------------
  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const apiFilters: SalesReportFilters = {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        invoiceNo: filters.invoiceNo || undefined,
        customerId: filters.customerId,
        areaId: filters.areaId,
        vanId: filters.vanId,
        salesmanId: filters.salesmanId,
        productGroupId: filters.productGroupId,
      };
      const data = await salesService.getSalesReport(apiFilters);
      setReportData(data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching sales report:", error);
      toast.error("Failed to fetch sales report");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters]);

  // --------------------------------------------------------------------
  // Export placeholders
  // --------------------------------------------------------------------
  const handleExportPDF = () => {
    toast.info("PDF export coming soon");
  };

  const handleExportExcel = () => {
    toast.info("Excel export coming soon");
  };

  // --------------------------------------------------------------------
  // Helper functions
  // --------------------------------------------------------------------
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) =>
      value !== undefined &&
      value !== "" &&
      !(value instanceof Date && isNaN(value.getTime())),
  ).length;

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return reportData.slice(start, end);
  }, [reportData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(reportData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, reportData.length);

  const getDisplayName = (list: any[], id?: number, defaultValue = "All") => {
    if (!id) return `All ${defaultValue}s`;
    const item = list.find((i) => i.id === id);
    return item ? item.name : `Select ${defaultValue}`;
  };

  const getCustomerName = (id?: number) => {
    if (!id) return "All Customers";
    const customer = customers.find((c) => c.id === id);
    return customer
      ? customer.companyName || customer.personName || `Customer ${id}`
      : "Select Customer";
  };

  const formatDate = (dateString: string) => {
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
                Sales Summary Report
              </h1>
              <motion.p
                className="text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                View and export sales invoices with product group filtering
              </motion.p>
            </div>

            {/* Export Buttons */}
            <motion.div className="flex items-center gap-3">
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleExportPDF}
                  disabled={isLoading || reportData.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </motion.div>
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleExportExcel}
                  disabled={isLoading || reportData.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
              </motion.div>
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={fetchReport}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                        {/* Invoice No */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Invoice No
                          </Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by invoice no..."
                              className="pl-10"
                              value={invoiceNoInput}
                              onChange={(e) =>
                                handleInvoiceNoChange(e.target.value)
                              }
                            />
                            {invoiceNoInput && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => clearFilter("invoiceNo")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Customer
                          </Label>
                          <Popover
                            open={customerOpen}
                            onOpenChange={setCustomerOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={customerOpen}
                                className="w-full justify-between"
                                disabled={isLoading}
                              >
                                {getCustomerName(filters.customerId)}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search customers..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No customer found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="all"
                                      onSelect={() => {
                                        handleFilterChange(
                                          "customerId",
                                          undefined,
                                        );
                                        setCustomerOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !filters.customerId
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
                                            customer.id,
                                          );
                                          setCustomerOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.customerId === customer.id
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {customer.companyName ||
                                          customer.personName ||
                                          `Customer ${customer.id}`}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Area */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Area</Label>
                          <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={areaOpen}
                                className="w-full justify-between"
                                disabled={isLoading}
                              >
                                {getDisplayName(areas, filters.areaId, "Area")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search areas..." />
                                <CommandList>
                                  <CommandEmpty>No area found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="all"
                                      onSelect={() => {
                                        handleFilterChange("areaId", undefined);
                                        setAreaOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !filters.areaId
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
                                          handleFilterChange("areaId", area.id);
                                          setAreaOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.areaId === area.id
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {area.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Van */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Van</Label>
                          <Popover open={vanOpen} onOpenChange={setVanOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={vanOpen}
                                className="w-full justify-between"
                                disabled={isLoading}
                              >
                                {getDisplayName(vans, filters.vanId, "Van")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search vans..." />
                                <CommandList>
                                  <CommandEmpty>No van found.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="all"
                                      onSelect={() => {
                                        handleFilterChange("vanId", undefined);
                                        setVanOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !filters.vanId
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
                                          handleFilterChange("vanId", van.id);
                                          setVanOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.vanId === van.id
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {van.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Salesman */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Salesman
                          </Label>
                          <Popover
                            open={salesmanOpen}
                            onOpenChange={setSalesmanOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={salesmanOpen}
                                className="w-full justify-between"
                                disabled={isLoading}
                              >
                                {getDisplayName(
                                  salesmen,
                                  filters.salesmanId,
                                  "Salesman",
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search salesmen..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No salesman found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="all"
                                      onSelect={() => {
                                        handleFilterChange(
                                          "salesmanId",
                                          undefined,
                                        );
                                        setSalesmanOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !filters.salesmanId
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
                                            salesman.id,
                                          );
                                          setSalesmanOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.salesmanId === salesman.id
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {salesman.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Product Group */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Product Group
                          </Label>
                          <Popover
                            open={productGroupOpen}
                            onOpenChange={setProductGroupOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={productGroupOpen}
                                className="w-full justify-between"
                                disabled={isLoading}
                              >
                                {getDisplayName(
                                  groups,
                                  filters.productGroupId,
                                  "Product Group",
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search product groups..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No product group found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="all"
                                      onSelect={() => {
                                        handleFilterChange(
                                          "productGroupId",
                                          undefined,
                                        );
                                        setProductGroupOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !filters.productGroupId
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      All Product Groups
                                    </CommandItem>
                                    {groups.map((group) => (
                                      <CommandItem
                                        key={group.id}
                                        value={group.id.toString()}
                                        onSelect={() => {
                                          handleFilterChange(
                                            "productGroupId",
                                            group.id,
                                          );
                                          setProductGroupOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.productGroupId === group.id
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {group.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* From Date */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            From Date
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

                        {/* To Date */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">To Date</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                value={toDateInput}
                                onChange={(e) =>
                                  handleToDateInputChange(e.target.value)
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
                                    selected={filters.toDate}
                                    onSelect={handleToDateSelect}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            {toDateInput && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10"
                                onClick={() => clearFilter("toDate")}
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

        {/* Results Count and Pagination Controls */}
        <motion.div
          className="flex justify-between items-center mb-4"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">
            Showing {reportData.length > 0 ? startIndex : 0} to {endIndex} of{" "}
            {reportData.length} invoices
            {activeFiltersCount > 0 && " (filtered)"}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Items per page:</div>
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

        {/* Report Table */}
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
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">
                        Invoice Date
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Total Amount (₹)
                      </TableHead>
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
                          <TableCell colSpan={4} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading report...
                              </p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : reportData.length === 0 ? (
                        <motion.tr
                          key="no-data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <motion.div
                              className="flex flex-col items-center justify-center"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              <FileText className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No invoices found matching your filters.</p>
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
                        paginatedData.map((item, index) => (
                          <motion.tr
                            key={item.id}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            variants={{
                              hidden: { opacity: 0, y: 20 },
                              visible: { opacity: 1, y: 0 },
                              hover: { backgroundColor: "rgba(0,0,0,0.02)" },
                            }}
                            className="group border"
                            layout
                          >
                            <TableCell className="font-mono font-medium text-primary">
                              {item.invoiceNo}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {item.customer.companyName ||
                                    item.customer.personName ||
                                    `Customer ${item.customer.id}`}
                                </p>
                                {item.customer.phoneNo && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.customer.phoneNo}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(item.invoiceDate)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-700">
                              ₹{item.totalAmount.toFixed(2)}
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
        {!isLoading && reportData.length > 0 && totalPages > 1 && (
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
  );
}
