import React, { useState, useEffect } from "react";
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
import { Search,
  X,
  RefreshCw,
  FileText,
  ChevronsUpDown,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CustomDateInput } from "@/components/custom_ui";
import { motion, AnimatePresence } from "framer-motion";
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
  AreaWiseReportItem,
  AreaWisePDFData,
} from "@/types/sales-report";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";
import AreaWisePreviewModal from "./AreaWisePreviewModal";
import { useReportRowSelection } from "@/hooks/useReportRowSelection";
import { useInfiniteScrollList } from "@/hooks/useInfiniteScrollList";
import ReportInfiniteScrollFooter from "@/components/report/shared/ReportInfiniteScrollFooter";

const REPORT_PREVIEW_FETCH_LIMIT = 5000;

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
export default function AreaWise() {
  // State
  const [reportData, setReportData] = useState<AreaWiseReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [vanOpen, setVanOpen] = useState(false);
  const [salesmanOpen, setSalesmanOpen] = useState(false);
  const [productGroupOpen, setProductGroupOpen] = useState(false);

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfData, setPdfData] = useState<AreaWisePDFData | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

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

  const {
    selectedRowIds,
    handleSelectAll,
    handleSelectRow,
    applySelectedIds,
    isAllSelected,
    isSomeSelected,
    clearSelection,
  } = useReportRowSelection<AreaWiseReportItem>((item) => item.areaId);

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
  const toggleRow = (areaId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(areaId)) {
        newSet.delete(areaId);
      } else {
        newSet.add(areaId);
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
        salesmanId: filters.salesmanId,
        productGroupId: filters.productGroupId,
      };
      const data = await salesService.getAreaWiseReport(apiFilters);
      setReportData(data);
      clearSelection();
      setExpandedRows(new Set()); // collapse all on new data
    } catch (error) {
      console.error("Error fetching area-wise sales report:", error);
      toast.error("Failed to fetch area-wise sales report");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const previewFilters = applySelectedIds({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    invoiceNo: filters.invoiceNo || undefined,
    customerId: filters.customerId,
    gstDetails: filters.gstDetails,
    vanId: filters.vanId,
    salesmanId: filters.salesmanId,
    productGroupId: filters.productGroupId,
  });

  const fetchPDFData = async () => {
    setPdfLoading(true);
    try {
      const data = await salesService.getAreaWisePDFData(
        previewFilters,
        1,
        REPORT_PREVIEW_FETCH_LIMIT,
      );
      setPdfData(data);
    } catch {
      toast.error("Failed to load area-wise PDF data");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShowPDF = async () => {
    await fetchPDFData();
    setIsPreviewOpen(true);
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

  const { visibleItems, sentinelRef, hasMore, totalCount, visibleCount } =
    useInfiniteScrollList(reportData);

  const getDisplayName = (
    list: Array<{ id: number; name: string }>,
    id?: number,
    _defaultValue = "All",
  ) => {
    if (!id) return "";
    const item = list.find((i) => i.id === id);
    return item ? item.name : "";
  };

  const getCustomerName = (id?: number) => {
    if (!id) return "";
    const customer = customers.find((c) => c.id === id);
    return customer
      ? customer.companyName || customer.personName || `Customer ${id}`
      : "";
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
          <div className="flex justify-end gap-4">
            <motion.div className="flex items-center gap-3">
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
                      <div className="flex flex-wrap items-end gap-3 pt-2">
                        {/* Invoice No */}
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
<div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Invoice No"
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
<InlineSearchField
                            open={customerOpen}
                            onOpenChange={setCustomerOpen}
                            displayValue={getCustomerName(filters.customerId)}
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

                        {/* Area (filter) */}
                        <div className="flex-1 min-w-[150px] max-w-[200px]">
<InlineSearchField
                            open={areaOpen}
                            onOpenChange={setAreaOpen}
                            displayValue={getDisplayName(areas, filters.areaId, "Area")}
                            placeholder="Area"
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
<InlineSearchField
                            open={vanOpen}
                            onOpenChange={setVanOpen}
                            displayValue={getDisplayName(vans, filters.vanId, "Van")}
                            placeholder="Van"
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
<InlineSearchField
                            open={salesmanOpen}
                            onOpenChange={setSalesmanOpen}
                            displayValue={getDisplayName(
                                  salesmen,
                                  filters.salesmanId,
                                  "Salesman",
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
<InlineSearchField
                            open={productGroupOpen}
                            onOpenChange={setProductGroupOpen}
                            displayValue={getDisplayName(
                                  groups,
                                  filters.productGroupId,
                                  "Product Group",
                                )}
                            placeholder="Product Group"
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
                            value={fromDateValue}
                            onChange={handleFromDateChange}
                            placeholder="From Date"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex-1 min-w-[150px] max-w-[200px]">
                          <CustomDateInput
                            value={toDateValue}
                            onChange={handleToDateChange}
                            placeholder="To Date"
                            disabled={isLoading}
                          />
                        </div>

                        <div className="ml-auto flex items-end">
                          <Button
                            variant="outline"
                            className="gap-2 h-8"
                            onClick={handleShowPDF}
                            disabled={
                              isLoading ||
                              reportData.length === 0 ||
                              pdfLoading
                            }
                          >
                            <FileText className="h-4 w-4" />
                            {pdfLoading ? "Loading..." : "Show"}
                          </Button>
                        </div>
                      </div>
              </div>
            </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          className="flex justify-between items-center mb-4"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">
            Showing {visibleCount} of {totalCount} areas
            {selectedRowIds.length > 0 && ` (${selectedRowIds.length} selected)`}
            {activeFiltersCount > 0 && " (filtered)"}
          </p>
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
                          checked={
                            isAllSelected(reportData)
                              ? true
                              : isSomeSelected(reportData)
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAll(checked as boolean, reportData)
                          }
                        />
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="font-semibold">Area Name</TableHead>
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
                        visibleItems.map((item, index) => (
                          <React.Fragment key={item.areaId}>
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
                              className={cn(
                                "group border cursor-pointer",
                                selectedRowIds.includes(item.areaId) &&
                                  "report-row-selected",
                              )}
                              onClick={() => toggleRow(item.areaId)}
                            >
                              <TableCell
                                className="text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Checkbox
                                  className="report-checkbox"
                                  checked={selectedRowIds.includes(item.areaId)}
                                  onCheckedChange={(checked) =>
                                    handleSelectRow(item.areaId, checked as boolean)
                                  }
                                />
                              </TableCell>
                              <TableCell className="w-10">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  {expandedRows.has(item.areaId) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.areaName}
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-700">
                                ₹{item.totalAmount.toFixed(2)}
                              </TableCell>
                            </motion.tr>
                            {expandedRows.has(item.areaId) && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <TableCell
                                  colSpan={3}
                                  className="p-0 bg-muted/20"
                                >
                                  <div className="p-4">
                                    <h4 className="text-sm font-semibold mb-2">
                                      Invoices for {item.areaName}
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
              {!isLoading && reportData.length > 0 && (
                <ReportInfiniteScrollFooter
                  sentinelRef={sentinelRef}
                  hasMore={hasMore}
                  loadedCount={visibleCount}
                  totalCount={totalCount}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Area Wise Preview Modal */}
      <AreaWisePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={pdfData}
        filters={previewFilters}
      />
    </motion.div>
  );
}
