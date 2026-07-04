import { useTheme } from "@/contexts/ThemeProvider";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw,
  FileSpreadsheet,
  Check,
  X,
} from "lucide-react";
import { CustomDateInput } from "@/components/custom_ui";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { CommandGroup, CommandItem } from "@/components/ui/command";
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
import { useServerInfiniteScroll } from "@/hooks/useServerInfiniteScroll";
import ReportInfiniteScrollFooter from "@/components/report/shared/ReportInfiniteScrollFooter";
import type {
  PurchaseGSTFilters,
  PurchaseGSTInvoice,
  PurchaseGSTItem,
  PurchaseGSTResponse,
} from "@/types/purchase";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";

type GSTR2Row = {
  id: string;
  invoiceNo: string;
  purDate: string;
  supplierName: string;
  stateName: string;
  gstNo: string;
  final: number;
  gross: number;
  scheme: number;
  discount: number;
  qty: number;
  rate: number;
  taxable: number;
  gstPercent: number;
  sgst: number;
  cgst: number;
  igst: number;
  cess: number;
  addCess: number;
  apmc: number;
  description: string;
  hsnCode: string;
  unit: string;
};

const getStateFromAddress = (address?: string | null) => {
  if (!address) return "";
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB");
  } catch {
    return "";
  }
};

const toNumber = (value?: number | null) => Number(value || 0);

const invoiceToRows = (invoice: PurchaseGSTInvoice): GSTR2Row[] =>
  invoice.items.map((item: PurchaseGSTItem) => ({
    id: `${invoice.purchaseId}-${item.itemId}`,
    invoiceNo: invoice.invoiceId || "",
    purDate: invoice.invoiceDate || "",
    supplierName: invoice.customerName || invoice.supplierDetails?.name || "",
    stateName: getStateFromAddress(invoice.supplierDetails?.address),
    gstNo: invoice.gstin || "",
    final: toNumber(invoice.finalAmount),
    gross: toNumber(invoice.grossAmount),
    scheme: toNumber(item.schemeAmount || invoice.schemeAmount),
    discount: toNumber(invoice.discountAmount),
    qty: toNumber(item.quantity),
    rate: toNumber(item.rate),
    taxable: toNumber(item.taxableValue),
    gstPercent: toNumber(item.gstRate),
    sgst: toNumber(item.sgstAmount),
    cgst: toNumber(item.cgstAmount),
    igst: toNumber(item.igstAmount),
    cess: toNumber(item.cessAmount),
    addCess: 0,
    apmc: 0,
    description: item.description || "",
    hsnCode: item.hsnSacCode || "",
    unit: String(item.unit || ""),
  }));

export default function GSTR2({ isCollapsed }: { isCollapsed: boolean }) {
  const { layoutMode } = useTheme();
  const [summaryData, setSummaryData] = useState<
    PurchaseGSTResponse["summary"] | null
  >(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);
  const [filters, setFilters] = useState<PurchaseGSTFilters>({
    supplierId: undefined,
    gstDetails: undefined,
    fromDate: undefined,
    toDate: undefined,
    sortBy: "invoiceDate",
    sortOrder: "desc",
  });

  const filterResetKey = JSON.stringify({
    supplierId: filters.supplierId,
    gstDetails: filters.gstDetails,
    fromDate: filters.fromDate?.toISOString(),
    toDate: filters.toDate?.toISOString(),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const {
    items: invoices,
    isLoading,
    isLoadingMore,
    hasMore,
    sentinelRef,
    refresh,
    total,
    loadedCount,
  } = useServerInfiniteScroll<PurchaseGSTInvoice>(
    async (page) => {
      try {
        const response = await purchaseService.getPurchaseGST({
          ...filters,
          page,
          limit: 50,
        });
        if (page === 1) {
          setSummaryData(response.summary || null);
        }
        return {
          items: response.purchases || [],
          pagination: {
            hasNextPage: response.pagination.hasNextPage,
            currentPage: response.pagination.currentPage,
            total: response.pagination.total,
          },
        };
      } catch (error) {
        console.error("Error fetching GSTR2 data:", error);
        toast.error("Failed to fetch GSTR2 data");
        if (page === 1) setSummaryData(null);
        return {
          items: [],
          pagination: { hasNextPage: false, currentPage: page, total: 0 },
        };
      }
    },
    filterResetKey,
  );

  const { suppliers } = useActiveLists();

  const rows = useMemo(
    () => invoices.flatMap((invoice) => invoiceToRows(invoice)),
    [invoices],
  );

  const handleFilterChange = <K extends keyof PurchaseGSTFilters>(
    field: K,
    value: PurchaseGSTFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
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

  const clearFilter = (filterName: keyof PurchaseGSTFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]:
        filterName === "supplierId" || filterName === "gstDetails"
          ? undefined
          : filterName === "fromDate" || filterName === "toDate"
            ? undefined
            : prev[filterName],
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
    });
    setFromDateValue(null);
    setToDateValue(null);
  };

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const blob = await purchaseService.downloadGSTR2Excel({
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
      link.setAttribute("download", `gstr2-report-${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("GSTR2 Excel downloaded successfully");
    } catch (error) {
      console.error("Error downloading GSTR2 Excel:", error);
      toast.error("Failed to download GSTR2 Excel");
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
      grossAmount: "Gross Amount",
      finalAmount: "Final Amount",
      createdAt: "Created At",
    };
    return labels[sortBy] ?? "";
  };

  const formatAmount = (amount: number) => amount.toFixed(2);

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
        <motion.div className="flex flex-col gap-6 mb-6 w-full" variants={headerVariants}>
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
                <Button variant="outline" className="gap-2" onClick={refresh} disabled={isLoading}>
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

                        <GstDetailsFilter
                          value={filters.gstDetails}
                          onChange={(value) =>
                            handleFilterChange("gstDetails", value)
                          }
                          disabled={isLoading}
                        />

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
                              <CommandItem
                                value="invoiceDate"
                                onSelect={() => {
                                  handleFilterChange("sortBy", "invoiceDate");
                                  setSortOpen(false);
                                }}
                              >
                                Invoice Date
                              </CommandItem>
                              <CommandItem
                                value="invoiceNo"
                                onSelect={() => {
                                  handleFilterChange("sortBy", "invoiceNo");
                                  setSortOpen(false);
                                }}
                              >
                                Invoice No
                              </CommandItem>
                              <CommandItem
                                value="grossAmount"
                                onSelect={() => {
                                  handleFilterChange("sortBy", "grossAmount");
                                  setSortOpen(false);
                                }}
                              >
                                Gross Amount
                              </CommandItem>
                              <CommandItem
                                value="finalAmount"
                                onSelect={() => {
                                  handleFilterChange("sortBy", "finalAmount");
                                  setSortOpen(false);
                                }}
                              >
                                Final Amount
                              </CommandItem>
                              <CommandItem
                                value="createdAt"
                                onSelect={() => {
                                  handleFilterChange("sortBy", "createdAt");
                                  setSortOpen(false);
                                }}
                              >
                                Created At
                              </CommandItem>
                            </CommandGroup>
                          </InlineSearchField>
                        </div>
                      </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="mb-4" variants={itemVariants}>
          <p className="text-sm text-muted-foreground">
            Showing {rows.length} rows from {total || loadedCount} invoices
            {activeFiltersCount > 0 && " (filtered)"}
            {summaryData ? ` | Total GST: ${summaryData.totalCGST + summaryData.totalSGST + summaryData.totalIGST}` : ""}
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full transition-normal">
                <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>INVOICE_NO</TableHead>
                      <TableHead>PUR_DATE</TableHead>
                      <TableHead>SUPPLIER_NAME</TableHead>
                      <TableHead>STATE_NAME</TableHead>
                      <TableHead>GST_NO</TableHead>
                      <TableHead className="text-right">FINAL</TableHead>
                      <TableHead className="text-right">GROSS</TableHead>
                      <TableHead className="text-right">SCHEME</TableHead>
                      <TableHead className="text-right">DISCOUNT</TableHead>
                      <TableHead className="text-right">QTY</TableHead>
                      <TableHead className="text-right">RATE</TableHead>
                      <TableHead className="text-right">TAXABLE</TableHead>
                      <TableHead className="text-right">GST%</TableHead>
                      <TableHead className="text-right">SGST</TableHead>
                      <TableHead className="text-right">CGST</TableHead>
                      <TableHead className="text-right">IGST</TableHead>
                      <TableHead className="text-right">CESS</TableHead>
                      <TableHead className="text-right">ADD_CESS</TableHead>
                      <TableHead className="text-right">APMC</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>HSN_CODE</TableHead>
                      <TableHead>UNIT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr key="loading">
                          <TableCell colSpan={22} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">Loading GSTR2 data...</p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : rows.length === 0 ? (
                        <motion.tr key="no-data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <TableCell colSpan={22} className="text-center py-8 text-muted-foreground">
                            No rows found matching your filters.
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
                            <TableCell>{row.invoiceNo}</TableCell>
                            <TableCell>{formatDate(row.purDate)}</TableCell>
                            <TableCell>{row.supplierName}</TableCell>
                            <TableCell>{row.stateName}</TableCell>
                            <TableCell>{row.gstNo}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.final)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.gross)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.scheme)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.discount)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.qty)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.rate)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.taxable)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.gstPercent)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.sgst)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.cgst)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.igst)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.cess)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.addCess)}</TableCell>
                            <TableCell className="text-right">{formatAmount(row.apmc)}</TableCell>
                            <TableCell>{row.description}</TableCell>
                            <TableCell>{row.hsnCode}</TableCell>
                            <TableCell>{row.unit}</TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
              <ReportInfiniteScrollFooter
                sentinelRef={sentinelRef}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                loadedCount={loadedCount}
                totalCount={total}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
