import { useTheme } from "@/contexts/ThemeProvider";
import React, { useEffect, useState } from "react";
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
import { RefreshCw,
  FileSpreadsheet,
  ChevronsUpDown,
  Check,
  X,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  containerVariants,
  itemVariants,
  headerVariants,
  buttonVariants,
} from "@/components/FramerVariants";
import { toast } from "sonner";
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
import type { PurchaseB2BFilters, PurchaseB2BRow } from "@/types/purchase";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";

export default function B2B({ isCollapsed }: { isCollapsed: boolean }) {
  const { layoutMode } = useTheme();
  const [rows, setRows] = useState<PurchaseB2BRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);


  const [filters, setFilters] = useState<PurchaseB2BFilters>({
    supplierId: undefined,
    gstDetails: undefined,
    fromDate: undefined,
    toDate: undefined,
    sortBy: "invoiceDate",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  });

  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const { suppliers } = useActiveLists();

  const handleFilterChange = <K extends keyof PurchaseB2BFilters>(
    field: K,
    value: PurchaseB2BFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handleFromDateChange = (value: string | null) => {
    setFromDateValue(value);
    setFilters((prev) => ({
      ...prev,
      fromDate: value ? new Date(`${value}T00:00:00`) : undefined,
      page: 1,
    }));
  };

  const handleToDateChange = (value: string | null) => {
    setToDateValue(value);
    setFilters((prev) => ({
      ...prev,
      toDate: value ? new Date(`${value}T00:00:00`) : undefined,
      page: 1,
    }));
  };

  const clearFilter = (filterName: keyof PurchaseB2BFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "supplierId" || filterName === "gstDetails"
          ? undefined
          : filterName === "fromDate" || filterName === "toDate"
            ? undefined
            : prev[filterName],
      page: 1,
    }));

    if (filterName === "fromDate") setFromDateValue(null);
    if (filterName === "toDate") setToDateValue(null);
  };

  const clearFilters = () => {
    setFilters({
      supplierId: undefined,
      gstDetails: undefined,
      fromDate: undefined,
      toDate: undefined,
      sortBy: "invoiceDate",
      sortOrder: "desc",
      page: 1,
      limit: 10,
    });
    setFromDateValue(null);
    setToDateValue(null);
  };

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const response = await purchaseService.getPurchaseB2B(filters);
      setRows(response.rows);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching B2B report:", error);
      toast.error("Failed to fetch B2B report");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const blob = await purchaseService.downloadPurchaseB2BExcel({
        supplierId: filters.supplierId,
        gstDetails: filters.gstDetails,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = format(new Date(), "dd-MM-yyyy_HH-mm");
      link.href = url;
      link.setAttribute("download", `b2b-report-${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error("Error downloading B2B Excel:", error);
      toast.error("Failed to download Excel");
    } finally {
      setIsDownloading(false);
    }
  };

  const activeFiltersCount = [
    filters.supplierId,
    filters.gstDetails,
    filters.fromDate,
    filters.toDate,
  ].filter((v) => v !== undefined && v !== null).length;

  const getSupplierName = (id?: number) => {
    if (!id) return "";
    const supplier = suppliers.find((s) => s.id === id);
    return supplier ? supplier.name : "";
  };

  const getSortByLabel = (sortBy: string) => {
    const labels: Record<string, string> = {
      invoiceDate: "Invoice Date",
      invoiceNo: "Invoice No",
      finalAmount: "Final Amount",
      grossAmount: "Gross Amount",
      createdAt: "Created At",
    };
    return labels[sortBy] ?? "";
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

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;

  return (
    <motion.div
      className="min-h-screen bg-background p-3"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div
        className={`mx-auto ${
          isCollapsed
            ? "max-w-5xl lg:max-w-2xl xl:max-w-7xl 2xl:max-w-9xl"
            : "max-w-9xl lg:max-w-xl xl:max-w-4xl 2xl:max-w-6xl"
        }`}
      >
        <motion.div
          className="flex flex-col gap-6 mb-6 w-full"
          variants={headerVariants}
        >
          <div className="flex justify-between gap-4">
            
            <motion.div className="flex items-center gap-3">
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button
                  variant="outline"
                  className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  onClick={handleDownloadExcel}
                  disabled={isLoading || isDownloading || rows.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {isDownloading ? "Downloading..." : "Download Excel"}
                </Button>
              </motion.div>
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Button variant="outline" className="gap-2" onClick={fetchReport} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div className="mb-2" variants={itemVariants}>
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

                        <div>
                          <InlineSearchField
                            open={sortOpen}
                            onOpenChange={setSortOpen}
                            displayValue={getSortByLabel(filters.sortBy ?? "")}
                            placeholder="Sort By"
                            emptyMessage="No sort option found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                              <CommandItem value="invoiceDate" onSelect={() => { handleFilterChange("sortBy", "invoiceDate"); setSortOpen(false); }}>Invoice Date</CommandItem>
                              <CommandItem value="invoiceNo" onSelect={() => { handleFilterChange("sortBy", "invoiceNo"); setSortOpen(false); }}>Invoice No</CommandItem>
                              <CommandItem value="finalAmount" onSelect={() => { handleFilterChange("sortBy", "finalAmount"); setSortOpen(false); }}>Final Amount</CommandItem>
                              <CommandItem value="grossAmount" onSelect={() => { handleFilterChange("sortBy", "grossAmount"); setSortOpen(false); }}>Gross Amount</CommandItem>
                              <CommandItem value="createdAt" onSelect={() => { handleFilterChange("sortBy", "createdAt"); setSortOpen(false); }}>Created At</CommandItem>
                            </CommandGroup>
                          </InlineSearchField>
                        </div>

                        <div>
                          <InlineSearchField
                            open={supplierOpen}
                            onOpenChange={setSupplierOpen}
                            displayValue={getSupplierName(filters.supplierId)}
                            placeholder="Supplier"
                            emptyMessage="No supplier found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                                    <CommandItem
                                      value="all"
                                      onSelect={() => {
                                        handleFilterChange("supplierId", undefined);
                                        setSupplierOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !filters.supplierId ? "opacity-100" : "opacity-0",
                                        )}
                                      />
                                      All Suppliers
                                    </CommandItem>
                                    {suppliers.map((supplier) => (
                                      <CommandItem
                                        key={supplier.id}
                                        value={supplier.id.toString()}
                                        onSelect={() => {
                                          handleFilterChange("supplierId", supplier.id);
                                          setSupplierOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            filters.supplierId === supplier.id
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />
                                        {supplier.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                          </InlineSearchField>
                        </div>

                        <CustomDateInput
                          value={fromDateValue}
                          onChange={handleFromDateChange}
                          placeholder="From Date"
                          disabled={isLoading}
                        />

                        <CustomDateInput
                          value={toDateValue}
                          onChange={handleToDateChange}
                          placeholder="To Date"
                          disabled={isLoading}
                        />
                      </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="flex justify-between items-center mb-4" variants={itemVariants}>
          <p className="text-sm text-muted-foreground">
            Showing {rows.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0} to{" "}
            {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{" "}
            {pagination.total} invoices
            {activeFiltersCount > 0 && " (filtered)"}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Items per page:</div>
            <Select
              value={filters.limit?.toString()}
              onValueChange={(value) => handleFilterChange("limit", Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full transition-normal">
                <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">Party</TableHead>
                      <TableHead className="font-semibold">GSTIN Number</TableHead>
                      <TableHead className="font-semibold">Invoice No</TableHead>
                      <TableHead className="font-semibold">Invoice Date</TableHead>
                      <TableHead className="font-semibold">Place</TableHead>
                      <TableHead className="font-semibold">Invoice Type</TableHead>
                      <TableHead className="font-semibold text-right">Final Amount</TableHead>
                      <TableHead className="font-semibold text-right">Rate</TableHead>
                      <TableHead className="font-semibold text-right">Taxable</TableHead>
                      <TableHead className="font-semibold text-right">Tax Value</TableHead>
                      <TableHead className="font-semibold text-right">CESS</TableHead>
                      <TableHead className="font-semibold text-right">Add Cess</TableHead>
                      <TableHead className="font-semibold text-right">APMC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr key="loading">
                          <TableCell colSpan={13} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">Loading B2B data...</p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : rows.length === 0 ? (
                        <motion.tr key="no-data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center justify-center">
                              <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No B2B rows found matching your filters.</p>
                              <Button variant="link" onClick={clearFilters} className="mt-2">
                                Clear all filters
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : (
                        rows.map((row, index) => (
                          <motion.tr
                            key={row.id}
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
                            <TableCell className="font-medium">{row.party || "-"}</TableCell>
                            <TableCell className="font-mono">{row.gstinNumber || "-"}</TableCell>
                            <TableCell className="font-mono">{row.invoiceNo || "-"}</TableCell>
                            <TableCell>{formatDate(row.invoiceDate)}</TableCell>
                            <TableCell>{row.place || "-"}</TableCell>
                            <TableCell>{row.invoiceType || "-"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.finalAmount)}</TableCell>
                            <TableCell className="text-right">{row.rate.toFixed(2)}%</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.taxable)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.taxValue)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.cess)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.addCess)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.apmc)}</TableCell>
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

        {!isLoading && rows.length > 0 && pagination.totalPages > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <CustomPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(page) => handleFilterChange("page", page)}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
