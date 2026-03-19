import { useEffect, useMemo, useState } from "react";
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
import {
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Calendar,
  ChevronsUpDown,
  Check,
  X,
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
  const [invoices, setInvoices] = useState<PurchaseGSTInvoice[]>([]);
  const [summaryData, setSummaryData] = useState<
    PurchaseGSTResponse["summary"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [filters, setFilters] = useState<PurchaseGSTFilters>({
    supplierId: undefined,
    gstDetails: undefined,
    fromDate: undefined,
    toDate: undefined,
    sortBy: "invoiceDate",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const { suppliers } = useActiveLists();

  const rows = useMemo(
    () => invoices.flatMap((invoice) => invoiceToRows(invoice)),
    [invoices],
  );

  const handleFilterChange = <K extends keyof PurchaseGSTFilters>(
    field: K,
    value: PurchaseGSTFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const handleFromDateInputChange = (value: string) => {
    setFromDateInput(value);
    const parsed = parseDateFromString(value);
    if (parsed) {
      setFilters((prev) => ({ ...prev, fromDate: parsed, page: 1 }));
    } else if (value === "") {
      setFilters((prev) => ({ ...prev, fromDate: undefined, page: 1 }));
    }
  };

  const handleToDateInputChange = (value: string) => {
    setToDateInput(value);
    const parsed = parseDateFromString(value);
    if (parsed) {
      setFilters((prev) => ({ ...prev, toDate: parsed, page: 1 }));
    } else if (value === "") {
      setFilters((prev) => ({ ...prev, toDate: undefined, page: 1 }));
    }
  };

  const handleFromDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, fromDate: date, page: 1 }));
    setFromDateInput(date ? formatDateToDisplay(date) : "");
  };

  const handleToDateSelect = (date: Date | undefined) => {
    setFilters((prev) => ({ ...prev, toDate: date, page: 1 }));
    setToDateInput(date ? formatDateToDisplay(date) : "");
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
      page: 1,
    }));
    if (filterName === "fromDate") setFromDateInput("");
    if (filterName === "toDate") setToDateInput("");
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
    setFromDateInput("");
    setToDateInput("");
  };

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const response = await purchaseService.getPurchaseGST(filters);
      setInvoices(response.purchases || []);
      setSummaryData(response.summary || null);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching GSTR2 data:", error);
      toast.error("Failed to fetch GSTR2 data");
      setInvoices([]);
      setSummaryData(null);
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
    if (!id) return "All Suppliers";
    const supplier = suppliers.find((s) => s.id === id);
    return supplier ? supplier.name : "Select Supplier";
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
            <div>
              <h1 className="text-3xl font-bold text-heading">GSTR2</h1>
              <motion.p
                className="text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Item-wise purchase GST rows as per GSTR2 report columns
              </motion.p>
            </div>
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
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Supplier</Label>
                          <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={supplierOpen}
                                className="w-full justify-between"
                                disabled={isLoading}
                              >
                                {getSupplierName(filters.supplierId)}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search suppliers..." />
                                <CommandList>
                                  <CommandEmpty>No supplier found.</CommandEmpty>
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
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <GstDetailsFilter
                          value={filters.gstDetails}
                          onChange={(value) =>
                            handleFilterChange("gstDetails", value)
                          }
                          disabled={isLoading}
                        />

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">From Date</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                value={fromDateInput}
                                onChange={(e) => handleFromDateInputChange(e.target.value)}
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
                                <PopoverContent className="w-auto p-0" align="end">
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

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">To Date</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                value={toDateInput}
                                onChange={(e) => handleToDateInputChange(e.target.value)}
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
                                <PopoverContent className="w-auto p-0" align="end">
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

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Sort By</Label>
                          <Select
                            value={filters.sortBy}
                            onValueChange={(value) => handleFilterChange("sortBy", value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="invoiceDate">Invoice Date</SelectItem>
                              <SelectItem value="invoiceNo">Invoice No</SelectItem>
                              <SelectItem value="grossAmount">Gross Amount</SelectItem>
                              <SelectItem value="finalAmount">Final Amount</SelectItem>
                              <SelectItem value="createdAt">Created At</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="flex justify-between items-center mb-4" variants={itemVariants}>
          <p className="text-sm text-muted-foreground">
            Showing {rows.length} rows from {pagination.total} invoices
            {activeFiltersCount > 0 && " (filtered)"}
            {summaryData ? ` | Total GST: ${summaryData.totalCGST + summaryData.totalSGST + summaryData.totalIGST}` : ""}
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
                <Table>
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
            </CardContent>
          </Card>
        </motion.div>

        {!isLoading && invoices.length > 0 && pagination.totalPages > 1 && (
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
