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
  ChevronsUpDown,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CustomPagination, CustomDateInput } from "@/components/custom_ui";
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
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { isValid, format } from "date-fns";
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
import type {
  SalesReportFilters,
  SalesmanWiseReportItem,
  SalesmanWisePDFData,
} from "@/types/sales-report";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";
import SalesmanWisePreviewModal from "./SalesmanWisePreviewModal";

// ----------------------------------------------------------------------
// Date Utilities
// ----------------------------------------------------------------------
const formatDate = (date: Date | string) => {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Invalid date";
    return format(d, "dd/MM/yyyy");
  } catch {
    return "Invalid date";
  }
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function SalesmanWise() {
  // State
  const [reportData, setReportData] = useState<SalesmanWiseReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [vanOpen, setVanOpen] = useState(false);
  const [salesmanOpen, setSalesmanOpen] = useState(false);
  const [productGroupOpen, setProductGroupOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfData, setPdfData] = useState<SalesmanWisePDFData | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfLimit] = useState(10);

  // Filters state
  const [filters, setFilters] = useState<SalesReportFilters>({
    fromDate: undefined,
    toDate: undefined,
    invoiceNo: "",
    customerId: undefined,
    gstDetails: undefined,
    areaId: undefined,
    vanId: undefined,
    salesmanId: undefined,
    productGroupId: undefined,
  });

  // Local inputs for debounced fields
  const [invoiceNoInput, setInvoiceNoInput] = useState("");
  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);

  // Pagination (client-side on groups)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

  // Hooks
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

  const handleFilterChange = <K extends keyof SalesReportFilters>(
    field: K,
    value: SalesReportFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      fromDate: undefined,
      toDate: undefined,
      invoiceNo: "",
      customerId: undefined,
      gstDetails: undefined,
      areaId: undefined,
      vanId: undefined,
      salesmanId: undefined,
      productGroupId: undefined,
    });
    setInvoiceNoInput("");
    setFromDateValue(null);
    setToDateValue(null);
  };

  const clearFilter = (filterName: keyof SalesReportFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "customerId" ||
        filterName === "gstDetails" ||
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
        setFromDateValue(null);
        break;
      case "toDate":
        setToDateValue(null);
        break;
    }
  };

  // Toggle row expansion
  const toggleRow = (salesmanId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(salesmanId)) {
        newSet.delete(salesmanId);
      } else {
        newSet.add(salesmanId);
      }
      return newSet;
    });
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
        gstDetails: filters.gstDetails,
        areaId: filters.areaId,
        vanId: filters.vanId,
        productGroupId: filters.productGroupId,
      };
      const data = await salesService.getSalesmanWiseReport(apiFilters);
      setReportData(data);
      setCurrentPage(1);
      setExpandedRows(new Set()); // collapse all on new data
    } catch (error) {
      console.error("Error fetching salesman-wise sales report:", error);
      toast.error("Failed to fetch salesman-wise sales report");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters]);

  // --------------------------------------------------------------------
  // PDF Data fetching
  // --------------------------------------------------------------------
  const fetchPDFData = async (page: number = 1) => {
    setPdfLoading(true);
    try {
      const data = await salesService.getSalesmanWisePDFData(
        {
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          invoiceNo: filters.invoiceNo || undefined,
          customerId: filters.customerId,
          gstDetails: filters.gstDetails,
          areaId: filters.areaId,
          vanId: filters.vanId,
          productGroupId: filters.productGroupId,
        },
        page,
        pdfLimit,
      );
      setPdfData(data);
      setPdfPage(data.pagination.currentPage);
    } catch {
      toast.error("Failed to load salesman-wise PDF data");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShowPDF = async () => {
    await fetchPDFData(1);
    setIsPreviewOpen(true);
  };

  const handlePDFPageChange = (newPage: number) => {
    fetchPDFData(newPage);
  };

  // --------------------------------------------------------------------
  // Export placeholders
  // --------------------------------------------------------------------
  const activeFiltersCount = Object.entries(filters).filter(
    ([, value]) =>
      value !== undefined &&
      value !== "" &&
      !(value instanceof Date && isNaN(value.getTime())),
  ).length;

  // Pagination on groups
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return reportData.slice(start, end);
  }, [reportData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(reportData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, reportData.length);

  const getDisplayName = (
    list: Array<{ id: number; name: string }>,
    id?: number,
    defaultValue = "All",
  ) => {
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

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(paginatedData.map(item => item.salesmanId));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRowIds(prev => [...prev, id]);
    } else {
      setSelectedRowIds(prev => prev.filter(rowId => rowId !== id));
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
            

            {/* Action Buttons */}
            <motion.div className="flex items-center gap-3">
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleShowPDF}
                  disabled={isLoading || reportData.length === 0 || pdfLoading}
                >
                  <FileText className="h-4 w-4" />
                  {pdfLoading ? "Loading..." : "Show"}
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
          <div className="bg-white dark:bg-gray-900 border rounded-none p-2">
              <div className="flex flex-col gap-2">
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
                      <div className="flex flex-wrap items-end gap-3 pt-2">
                        {/* Invoice No */}
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <Label className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 block">
                            Invoice No
                          </Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search by invoice no..."
                              className="pl-8 h-8 text-xs rounded-sm"
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
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <Label className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 block">
                            Customer
                          </Label>
                          <InlineSearchField
                            open={customerOpen}
                            onOpenChange={setCustomerOpen}
                            displayValue={getCustomerName(filters.customerId)}
                            placeholder="Search customers..."
                            emptyMessage="No customer found."
                            disabled={isLoading}
                          >
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
                          </InlineSearchField>
                        </div>

                        <GstDetailsFilter
                          value={filters.gstDetails}
                          onChange={(value) =>
                            handleFilterChange("gstDetails", value)
                          }
                          disabled={isLoading}
                        />

                        {/* Area */}
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <Label className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 block">Area</Label>
                          <InlineSearchField
                            open={areaOpen}
                            onOpenChange={setAreaOpen}
                            displayValue={getDisplayName(areas, filters.areaId, "Area")}
                            placeholder="Search areas..."
                            emptyMessage="No area found."
                            disabled={isLoading}
                          >
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
                          </InlineSearchField>
                        </div>

                        {/* Van */}
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <Label className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 block">Van</Label>
                          <InlineSearchField
                            open={vanOpen}
                            onOpenChange={setVanOpen}
                            displayValue={getDisplayName(vans, filters.vanId, "Van")}
                            placeholder="Search vans..."
                            emptyMessage="No van found."
                            disabled={isLoading}
                          >
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
                          </InlineSearchField>
                        </div>

                        {/* Salesman */}
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <Label className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 block">
                            Salesman
                          </Label>
                          <InlineSearchField
                            open={salesmanOpen}
                            onOpenChange={setSalesmanOpen}
                            displayValue={getDisplayName(
                                  salesmen,
                                  filters.salesmanId,
                                  "Salesman",
                                )}
                            placeholder="Search salesmen..."
                            emptyMessage="No salesman found."
                            disabled={isLoading}
                          >
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
                          </InlineSearchField>
                        </div>

                        {/* Product Group */}
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <Label className="text-[10px] uppercase text-muted-foreground font-semibold mb-1 block">
                            Product Group
                          </Label>
                          <InlineSearchField
                            open={productGroupOpen}
                            onOpenChange={setProductGroupOpen}
                            displayValue={getDisplayName(
                                  groups,
                                  filters.productGroupId,
                                  "Product Group",
                                )}
                            placeholder="Search product groups..."
                            emptyMessage="No product group found."
                            disabled={isLoading}
                          >
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
                          </InlineSearchField>
                        </div>

                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <CustomDateInput
                            label="From Date"
                            value={fromDateValue}
                            onChange={handleFromDateChange}
                            placeholder="dd/mm/yyyy"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <CustomDateInput
                            label="To Date"
                            value={toDateValue}
                            onChange={handleToDateChange}
                            placeholder="dd/mm/yyyy"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
        </motion.div>

        {/* Results Count and Pagination Controls */}
        <motion.div
          className="flex justify-between items-center mb-4"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">
            Showing {reportData.length > 0 ? startIndex : 0} to {endIndex} of{" "}
            {reportData.length} salesmen
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
                      <TableHead className="w-10 text-center">
                        <Checkbox
                          className="report-checkbox"
                          checked={selectedRowIds.length === paginatedData.length && paginatedData.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="font-semibold">
                        Salesman Name
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Total Sales (₹)
                      </TableHead>
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
                              <p>No data found matching your filters.</p>
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
                          <React.Fragment key={item.salesmanId}>
                            <motion.tr
                              custom={index}
                              initial="hidden"
                              animate="visible"
                              whileHover="hover"
                              variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                                hover: { backgroundColor: "rgba(0,0,0,0.02)" },
                              }}
                              className={cn("group border cursor-pointer", selectedRowIds.includes(item.salesmanId) && "report-row-selected")}
                              onClick={() => toggleRow(item.salesmanId)}
                            >
                              <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  className="report-checkbox"
                                  checked={selectedRowIds.includes(item.salesmanId)}
                                  onCheckedChange={(checked) => handleSelectRow(item.salesmanId, checked as boolean)}
                                />
                              </TableCell>
                              <TableCell className="w-10">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  {expandedRows.has(item.salesmanId) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.salesmanName}
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-700">
                                ₹{item.totalAmount.toFixed(2)}
                              </TableCell>
                            </motion.tr>
                            {expandedRows.has(item.salesmanId) && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <TableCell
                                  colSpan={4}
                                  className="p-0 bg-muted/20"
                                >
                                  <div className="p-4">
                                    <h4 className="text-sm font-semibold mb-2">
                                      Invoices for {item.salesmanName}
                                    </h4>
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-muted/50">
                                          <TableHead>Invoice No</TableHead>
                                          <TableHead>Invoice Date</TableHead>
                                          <TableHead>Customer</TableHead>
                                          <TableHead className="text-right">
                                            Amount (₹)
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {item.invoices.map((inv, idx) => (
                                          <TableRow key={idx}>
                                            <TableCell className="font-mono">
                                              {inv.invoiceNo}
                                            </TableCell>
                                            <TableCell>
                                              {formatDate(inv.invoiceDate)}
                                            </TableCell>
                                            <TableCell>
                                              {inv.customerName || "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              ₹{inv.totalAmount.toFixed(2)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            )}
                          </React.Fragment>
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

      {/* Salesman Wise Preview Modal */}
      <SalesmanWisePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={pdfData}
        onPageChange={handlePDFPageChange}
        currentPage={pdfPage}
        filters={filters}
      />
    </motion.div>
  );
}

// colSpanFixed