import { useEffect, useState } from "react";
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
  Loader2,
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
  containerVariants,
  itemVariants,
  headerVariants,
  buttonVariants,
} from "@/components/FramerVariants";
import { toast } from "sonner";
import { format } from "date-fns";
import { salesService } from "@/services/salesService";
import { purchaseService } from "@/services/purchaseService";
import { gstHistoryService } from "@/services/gstHistoryService";
import type {
  GSTReportHistory,
  GSTReportHistoryFilters,
} from "@/types/sales-report";

const reportLabelMap: Record<string, string> = {
  gst: "Sales GST",
  gstr1: "GSTR1",
  b2c: "B2C",
  "hsn-summary": "HSN Summary",
  "sales-monthly-gst": "Sales Monthly GST",
  "purchase-gst": "Purchase GST",
  gstr2: "GSTR2",
  b2b: "B2B",
  "purchase-monthly-gst": "Purchase Monthly GST",
};

const parseHistoryFilters = (data: string) => {
  try {
    const parsed = JSON.parse(data || "{}");
    const f = parsed?.filters || {};
    return {
      ...f,
      fromDate: f.fromDate ? new Date(f.fromDate) : undefined,
      toDate: f.toDate ? new Date(f.toDate) : undefined,
    };
  } catch {
    return {};
  }
};

export default function GSTHistory() {
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rows, setRows] = useState<GSTReportHistory[]>([]);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<"all" | "sales" | "purchase">("all");
  const [reportFilter, setReportFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  const startDownload = (id: number) => {
    setDownloadingIds((prev) => new Set(prev).add(id));
  };
  const finishDownload = (id: number) => {
    setDownloadingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const filters: GSTReportHistoryFilters = {
        page: currentPage,
        limit: itemsPerPage,
        search: search || "",
        source: source === "all" ? "" : source,
        reportKey: reportFilter === "all" ? "" : (reportFilter as any),
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      const response = await gstHistoryService.getGSTReportHistory(filters);
      setRows(response.histories || []);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (error) {
      toast.error("Failed to fetch GST history");
      setRows([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [source, reportFilter, currentPage, itemsPerPage, search]);

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async (row: GSTReportHistory) => {
    if (downloadingIds.has(row.id)) return;
    startDownload(row.id);
    try {
      const filters = parseHistoryFilters(row.data);
      let blob: Blob | null = null;

      if (row.source === "sales") {
        if (row.reportKey === "gst") {
          blob = await salesService.downloadSalesGSTExcel(filters);
        } else if (row.reportKey === "gstr1") {
          blob = await salesService.downloadGSTR1Excel(filters);
        } else if (row.reportKey === "b2c") {
          blob = await salesService.downloadSalesB2CExcel(filters);
        } else if (row.reportKey === "hsn-summary") {
          blob = await salesService.downloadHSNSummaryExcel(filters);
        } else if (row.reportKey === "sales-monthly-gst") {
          blob = await salesService.downloadSalesGSTMonthlyExcel(filters);
        }
      } else {
        if (row.reportKey === "purchase-gst") {
          blob = await purchaseService.downloadPurchaseGSTExcel(filters);
        } else if (row.reportKey === "gstr2") {
          blob = await purchaseService.downloadGSTR2Excel(filters);
        } else if (row.reportKey === "b2b") {
          blob = await purchaseService.downloadPurchaseB2BExcel(filters);
        } else if (row.reportKey === "purchase-monthly-gst") {
          blob = await purchaseService.downloadPurchaseGSTMonthlyExcel(filters);
        }
      }

      if (!blob) throw new Error("Unsupported report type");
      downloadBlob(blob, row.fileName || `gst-history-${row.id}.xlsx`);
      toast.success("Downloaded successfully");
    } catch (error) {
      toast.error("Failed to download report");
    } finally {
      finishDownload(row.id);
    }
  };

  const reportOptions =
    source === "sales"
      ? [
          { value: "all", label: "All GST Reports" },
          { value: "gst", label: "Sales GST" },
          { value: "gstr1", label: "GSTR1" },
          { value: "b2c", label: "B2C" },
          { value: "hsn-summary", label: "HSN Summary" },
          { value: "sales-monthly-gst", label: "Sales Monthly GST" },
        ]
      : source === "purchase"
        ? [
            { value: "all", label: "All GST Reports" },
            { value: "purchase-gst", label: "Purchase GST" },
            { value: "gstr2", label: "GSTR2" },
            { value: "b2b", label: "B2B" },
            { value: "purchase-monthly-gst", label: "Purchase Monthly GST" },
          ]
        : [
            { value: "all", label: "All GST Reports" },
            { value: "gst", label: "Sales GST" },
            { value: "gstr1", label: "GSTR1" },
            { value: "b2c", label: "B2C" },
            { value: "hsn-summary", label: "HSN Summary" },
            { value: "sales-monthly-gst", label: "Sales Monthly GST" },
            { value: "purchase-gst", label: "Purchase GST" },
            { value: "gstr2", label: "GSTR2" },
            { value: "b2b", label: "B2B" },
            { value: "purchase-monthly-gst", label: "Purchase Monthly GST" },
          ];

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <motion.div
      className="min-h-screen bg-background p-3"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-8xl mx-auto">
        <motion.div className="flex flex-col gap-6 mb-6 w-full" variants={headerVariants}>
          <div className="flex justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-heading">GST Report History</h1>
              <motion.p
                className="text-muted-foreground mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                View and download previously generated GST reports
              </motion.p>
            </div>
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button variant="outline" className="gap-2" onClick={fetchHistory} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
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
                  </div>
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
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Source</Label>
                          <Select
                            value={source}
                            onValueChange={(value: "all" | "sales" | "purchase") => {
                              setSource(value);
                              setReportFilter("all");
                              setCurrentPage(1);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="purchase">Purchase</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Report</Label>
                          <Select
                            value={reportFilter}
                            onValueChange={(value) => {
                              setReportFilter(value);
                              setCurrentPage(1);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {reportOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Search</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="File name/report..."
                              className="pl-10"
                              value={search}
                              onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                              }}
                            />
                            {search && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => {
                                  setSearch("");
                                  setCurrentPage(1);
                                }}
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

        <motion.div className="flex justify-between items-center mb-4" variants={itemVariants}>
          <p className="text-sm text-muted-foreground">
            Showing {startIndex} to {endIndex} of {totalItems} records
          </p>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Items per page:</div>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead className="w-24">Source</TableHead>
                      <TableHead className="w-36">Report</TableHead>
                      <TableHead className="w-24">Type</TableHead>
                      <TableHead>Generated At</TableHead>
                      <TableHead className="text-center w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr key="loading">
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">Loading history...</p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : rows.length === 0 ? (
                        <motion.tr key="no-data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No GST history found.
                          </TableCell>
                        </motion.tr>
                      ) : (
                        rows.map((row, index) => {
                          const isDownloading = downloadingIds.has(row.id);
                          return (
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
                              <TableCell className="font-mono font-medium">{row.id}</TableCell>
                              <TableCell>{row.fileName || "-"}</TableCell>
                              <TableCell>
                                <Badge variant={row.source === "sales" ? "default" : "secondary"} className="uppercase">
                                  {row.source}
                                </Badge>
                              </TableCell>
                              <TableCell>{reportLabelMap[row.reportKey] || row.reportKey}</TableCell>
                              <TableCell>
                                <Badge variant={row.type === "pdf" ? "default" : "secondary"} className="uppercase">
                                  {row.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(row.createdAt), "dd/MM/yyyy HH:mm")}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleDownload(row)}
                                    disabled={isDownloading || row.type !== "excel"}
                                    title={row.type === "excel" ? "Download" : "Only Excel supported"}
                                  >
                                    {isDownloading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : row.type === "excel" ? (
                                      <FileSpreadsheet className="h-4 w-4" />
                                    ) : (
                                      <FileText className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {!isLoading && totalItems > 0 && totalPages > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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
