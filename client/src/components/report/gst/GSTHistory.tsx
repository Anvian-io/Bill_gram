import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
import { useState } from "react";
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
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { CommandGroup, CommandItem } from "@/components/ui/command";
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
import { useServerInfiniteScroll } from "@/hooks/useServerInfiniteScroll";
import ReportInfiniteScrollFooter from "@/components/report/shared/ReportInfiniteScrollFooter";

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
  const { layoutMode } = useTheme();

  const [sourceOpen, setSourceOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<"all" | "sales" | "purchase">("all");
  const [reportFilter, setReportFilter] = useState("all");
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  const filterResetKey = JSON.stringify({ search, source, reportFilter });

  const {
    items: rows,
    isLoading,
    isLoadingMore,
    hasMore,
    sentinelRef,
    refresh,
    total,
    loadedCount,
  } = useServerInfiniteScroll<GSTReportHistory>(
    async (page) => {
      try {
        const filters: GSTReportHistoryFilters = {
          page,
          limit: 50,
          search: search || "",
          source: source === "all" ? "" : source,
          reportKey: reportFilter === "all" ? "" : (reportFilter as GSTReportHistoryFilters["reportKey"]),
          sortBy: "createdAt",
          sortOrder: "desc",
        };
        const response = await gstHistoryService.getGSTReportHistory(filters);
        return {
          items: response.histories || [],
          pagination: {
            hasNextPage: response.pagination.hasNextPage,
            currentPage: response.pagination.currentPage,
            total: response.pagination.total,
          },
        };
      } catch {
        toast.error("Failed to fetch GST history");
        return {
          items: [],
          pagination: { hasNextPage: false, currentPage: page, total: 0 },
        };
      }
    },
    filterResetKey,
  );

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

  const getSourceLabel = (value: "all" | "sales" | "purchase") => {
    if (value === "all") return "";
    if (value === "sales") return "Sales";
    return "Purchase";
  };

  const getReportLabel = (value: string) => {
    if (value === "all") return "";
    return reportOptions.find((opt) => opt.value === value)?.label ?? "";
  };

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
            
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button variant="outline" className="gap-2" onClick={refresh} disabled={isLoading}>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <InlineSearchField
                            open={sourceOpen}
                            onOpenChange={setSourceOpen}
                            displayValue={getSourceLabel(source)}
                            placeholder="Source"
                            emptyMessage="No source found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                              <CommandItem value="all" onSelect={() => { setSource("all"); setReportFilter("all"); setSourceOpen(false); }}>All</CommandItem>
                              <CommandItem value="sales" onSelect={() => { setSource("sales"); setReportFilter("all"); setSourceOpen(false); }}>Sales</CommandItem>
                              <CommandItem value="purchase" onSelect={() => { setSource("purchase"); setReportFilter("all"); setSourceOpen(false); }}>Purchase</CommandItem>
                            </CommandGroup>
                          </InlineSearchField>
                        </div>

                        <div>
                          <InlineSearchField
                            open={reportOpen}
                            onOpenChange={setReportOpen}
                            displayValue={getReportLabel(reportFilter)}
                            placeholder="Report"
                            emptyMessage="No report found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                              {reportOptions.map((opt) => (
                                <CommandItem
                                  key={opt.value}
                                  value={opt.value}
                                  onSelect={() => {
                                    setReportFilter(opt.value);
                                    setReportOpen(false);
                                  }}
                                >
                                  {opt.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </InlineSearchField>
                        </div>

                        <div>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search"
                              className="pl-10"
                              value={search}
                              onChange={(e) => {
                                setSearch(e.target.value);
                              }}
                            />
                            {search && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => {
                                  setSearch("");
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="mb-4" variants={itemVariants}>
          <p className="text-sm text-muted-foreground">
            {loadedCount > 0
              ? `Loaded ${loadedCount}${total ? ` of ${total}` : ""} records`
              : "No records"}
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
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
