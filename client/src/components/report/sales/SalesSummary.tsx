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
import { Search,
  X,
  RefreshCw,
  FileText,
  ChevronsUpDown,
  Check,
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
import { isValid } from "date-fns";
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
  SalesReportItem,
  SalesReportFilters,
  SalesSummaryReportData,
} from "@/types/sales-report";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";
import SalesSummaryPreviewModal from "./SalesSummaryPreviewModal";

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<SalesSummaryReportData | null>(
    null,
  );
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryPage, setSummaryPage] = useState(1);
  const [summaryLimit] = useState(10);

  // Filters state
  const [filters, setFilters] = useState<SalesReportFilters>({
    fromDate: undefined,
    toDate: undefined,
    invoiceNo: "",
    customerId: undefined,
    areaId: undefined,
    vanId: undefined,
    salesmanId: undefined,
    gstDetails: undefined,
    productGroupId: undefined,
  });

  // Local inputs for debounced fields
  const [invoiceNoInput, setInvoiceNoInput] = useState("");
  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);

  // Pagination (client-side)
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
      areaId: undefined,
      vanId: undefined,
      salesmanId: undefined,
      gstDetails: undefined,
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
        filterName === "areaId" ||
        filterName === "vanId" ||
        filterName === "salesmanId" ||
        filterName === "productGroupId"
          ? undefined
          : filterName === "gstDetails"
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
        gstDetails: filters.gstDetails,
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
  // Export placeholders (replaced by modal functionality)
  // --------------------------------------------------------------------
  const activeFiltersCount = Object.entries(filters).filter(
    ([, value]) =>
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

  // Function to fetch summary data
  const fetchSummary = async (page: number = 1) => {
    setSummaryLoading(true);
    try {
      const data = await salesService.getSalesSummaryReportPDFData(
        {
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          invoiceNo: filters.invoiceNo || undefined,
          customerId: filters.customerId,
          areaId: filters.areaId,
          vanId: filters.vanId,
          salesmanId: filters.salesmanId,
          gstDetails: filters.gstDetails,
          productGroupId: filters.productGroupId,
        },
        page,
        summaryLimit,
      );
      setSummaryData(data);
      setSummaryPage(data.pagination.currentPage);
    } catch {
      toast.error("Failed to load summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Handler for Show button
  const handleShowSummary = async () => {
    await fetchSummary(1);
    setIsPreviewOpen(true);
  };

  // Handler for modal page change
  const handleSummaryPageChange = (newPage: number) => {
    fetchSummary(newPage);
  };


  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(paginatedData.map(item => item.id));
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
                  onClick={handleShowSummary}
                  disabled={
                    isLoading || reportData.length === 0 || summaryLoading
                  }
                >
                  <FileText className="h-4 w-4" />
                  {summaryLoading ? "Loading..." : "Show"}
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

                        {/* Area */}
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
                      </div>
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
                      <TableHead className="w-10 text-center">
                        <Checkbox
                          className="report-checkbox"
                          checked={selectedRowIds.length === paginatedData.length && paginatedData.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
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
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr
                          key="loading"
                          // initial={{ opacity: 0 }}
                          // animate={{ opacity: 1 }}
                          // exit={{ opacity: 0 }}
                        >
                          <TableCell colSpan={5} className="text-center py-12">
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
                            colSpan={5}
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
                            <TableCell className="text-center">
                              <Checkbox
                                className="report-checkbox"
                                checked={selectedRowIds.includes(item.id)}
                                onCheckedChange={(checked) => handleSelectRow(item.id, checked as boolean)}
                              />
                            </TableCell>
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

      {/* Sales Summary Preview Modal */}
      <SalesSummaryPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={summaryData}
        onPageChange={handleSummaryPageChange}
        currentPage={summaryPage}
        filters={filters}
      />
    </motion.div>
  );
}

// __colSpan_fixed__