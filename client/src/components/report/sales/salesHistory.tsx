import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
import React, { useState, useMemo } from "react";
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
  LayoutList,
  MapPin,
  User,
  Loader2, // Added for spinner
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
import { useDebounce } from "@/utils/debounce";
import { salesService } from "@/services/salesService";
import type {
  SalesReportHistory,
  SalesReportHistoryFilters,
} from "@/types/sales-report";
import { format } from "date-fns";
import { useServerInfiniteScroll } from "@/hooks/useServerInfiniteScroll";
import ReportInfiniteScrollFooter from "@/components/report/shared/ReportInfiniteScrollFooter";

export default function SalesHistory() {
  const { layoutMode } = useTheme();
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  // Filter states
  const [searchInput, setSearchInput] = useState("");
  const [fileNameInput, setFileNameInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "pdf" | "excel">("all");
  const [tabFilter, setTabFilter] = useState<
    "all" | "summary" | "register" | "area-wise" | "salesman-wise"
  >("all");
  const [typeOpen, setTypeOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [filters, setFilters] = useState<
    Omit<SalesReportHistoryFilters, "page" | "limit">
  >({
    search: "",
    fileName: "",
    type: "",
    tab: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const filterResetKey = JSON.stringify(filters);

  const {
    items: histories,
    isLoading,
    isLoadingMore,
    hasMore,
    sentinelRef,
    refresh,
    total,
    loadedCount,
  } = useServerInfiniteScroll<SalesReportHistory>(
    async (page) => {
      try {
        const response = await salesService.getSalesReportHistory({
          ...filters,
          page,
          limit: 50,
        });
        return {
          items: response.histories,
          pagination: {
            hasNextPage: response.pagination.hasNextPage,
            currentPage: response.pagination.currentPage,
            total: response.pagination.total,
          },
        };
      } catch {
        toast.error("Failed to fetch sales history");
        return {
          items: [],
          pagination: { hasNextPage: false, currentPage: page, total: 0 },
        };
      }
    },
    filterResetKey,
  );

  // Debounced search
  const debouncedSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, 300);

  const debouncedFileName = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, fileName: value }));
  }, 300);

  // Helper functions for download state (new)
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

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileNameInput(e.target.value);
    debouncedFileName(e.target.value);
  };

  const handleTypeChange = (value: string) => {
    const newType = value as typeof typeFilter;
    setTypeFilter(newType);
    // Map "all" to empty string for API
    setFilters((prev) => ({
      ...prev,
      type: newType === "all" ? "" : newType,
    }));
  };

  const handleTabChange = (value: string) => {
    const newTab = value as typeof tabFilter;
    setTabFilter(newTab);
    setFilters((prev) => ({
      ...prev,
      tab: newTab === "all" ? "" : newTab,
    }));
  };

  const clearFilters = () => {
    setSearchInput("");
    setFileNameInput("");
    setTypeFilter("all");
    setTabFilter("all");
    setFilters({
      search: "",
      fileName: "",
      type: "",
      tab: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const clearFilter = (field: keyof SalesReportHistoryFilters) => {
    if (field === "search") {
      setSearchInput("");
      setFilters((prev) => ({ ...prev, search: "" }));
    } else if (field === "fileName") {
      setFileNameInput("");
      setFilters((prev) => ({ ...prev, fileName: "" }));
    } else if (field === "type") {
      setTypeFilter("all");
      setFilters((prev) => ({ ...prev, type: "" }));
    } else if (field === "tab") {
      setTabFilter("all");
      setFilters((prev) => ({ ...prev, tab: "" }));
    }
  };

  // Download handlers (updated with loading state)
  const handleDownloadPDF = async (id: number, fileName: string | null) => {
    // Prevent double download
    if (downloadingIds.has(id)) return;

    startDownload(id);
    try {
      const blob = await salesService.downloadSalesReportHistoryPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || `sales-history-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF");
    } finally {
      finishDownload(id);
    }
  };

  const handleDownloadExcel = async (id: number, fileName: string | null) => {
    if (downloadingIds.has(id)) return;

    startDownload(id);
    try {
      const blob = await salesService.downloadSalesReportHistoryExcel(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || `sales-history-${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      toast.error("Failed to download Excel");
    } finally {
      finishDownload(id);
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.fileName) count++;
    if (filters.type) count++;
    if (filters.tab) count++;
    return count;
  }, [filters.search, filters.fileName, filters.type, filters.tab]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, "dd/MM/yyyy HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "summary":
        return <LayoutList className="h-4 w-4" />;
      case "register":
        return <FileText className="h-4 w-4" />;
      case "area-wise":
        return <MapPin className="h-4 w-4" />;
      case "salesman-wise":
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "summary":
        return "Summary";
      case "register":
        return "Register";
      case "area-wise":
        return "Area Wise";
      case "salesman-wise":
        return "Salesman Wise";
      default:
        return tab;
    }
  };

  const getTabVariant = (
    tab: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (tab) {
      case "summary":
        return "default";
      case "register":
        return "secondary";
      case "area-wise":
        return "outline";
      case "salesman-wise":
        return "destructive";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type: string) => {
    if (type === "all") return "";
    if (type === "pdf") return "PDF";
    return "Excel";
  };

  const getCategoryLabel = (tab: string) => {
    if (tab === "all") return "";
    return getTabLabel(tab);
  };

  return (
    <motion.div
      className="min-h-screen bg-background p-3"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-6 mb-6 w-full"
          variants={headerVariants}
        >
          <div className="flex justify-between gap-4">
            

            {/* Refresh Button */}
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant="outline"
                className="gap-2"
                onClick={refresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Filter Section */}
        <motion.div className="mb-2" variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="p-1">
              <div className="flex flex-col gap-4 p-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Global Search */}
                        <div>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Global Search"
                              className="pl-10"
                              value={searchInput}
                              onChange={handleSearchChange}
                            />
                            {searchInput && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => clearFilter("search")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* File Name Filter */}
                        <div>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="File Name"
                              className="pl-10"
                              value={fileNameInput}
                              onChange={handleFileNameChange}
                            />
                            {fileNameInput && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => clearFilter("fileName")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Type Filter */}
                        <div>
                          <div className="flex items-center gap-2">
                            <InlineSearchField
                              open={typeOpen}
                              onOpenChange={setTypeOpen}
                              displayValue={getTypeLabel(typeFilter)}
                              placeholder="Report Type"
                              emptyMessage="No type found."
                              disabled={isLoading}
                            >
                              <CommandGroup>
                                <CommandItem value="all" onSelect={() => { handleTypeChange("all"); setTypeOpen(false); }}>All Types</CommandItem>
                                <CommandItem value="pdf" onSelect={() => { handleTypeChange("pdf"); setTypeOpen(false); }}>PDF</CommandItem>
                                <CommandItem value="excel" onSelect={() => { handleTypeChange("excel"); setTypeOpen(false); }}>Excel</CommandItem>
                              </CommandGroup>
                            </InlineSearchField>
                            {typeFilter !== "all" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => clearFilter("type")}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Tab/Report Category Filter */}
                        <div>
                          <div className="flex items-center gap-2">
                            <InlineSearchField
                              open={categoryOpen}
                              onOpenChange={setCategoryOpen}
                              displayValue={getCategoryLabel(tabFilter)}
                              placeholder="Report Category"
                              emptyMessage="No category found."
                              disabled={isLoading}
                            >
                              <CommandGroup>
                                <CommandItem value="all" onSelect={() => { handleTabChange("all"); setCategoryOpen(false); }}>All Categories</CommandItem>
                                <CommandItem value="summary" onSelect={() => { handleTabChange("summary"); setCategoryOpen(false); }}>Summary</CommandItem>
                                <CommandItem value="register" onSelect={() => { handleTabChange("register"); setCategoryOpen(false); }}>Register</CommandItem>
                                <CommandItem value="area-wise" onSelect={() => { handleTabChange("area-wise"); setCategoryOpen(false); }}>Area Wise</CommandItem>
                                <CommandItem value="salesman-wise" onSelect={() => { handleTabChange("salesman-wise"); setCategoryOpen(false); }}>Salesman Wise</CommandItem>
                              </CommandGroup>
                            </InlineSearchField>
                            {tabFilter !== "all" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => clearFilter("tab")}
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

        {/* Results Info & Pagination Controls */}
        <motion.div className="mb-4" variants={itemVariants}>
          <p className="text-sm text-muted-foreground">
            {loadedCount > 0
              ? `Loaded ${loadedCount}${total ? ` of ${total}` : ""} records`
              : "No records"}
            {activeFiltersCount > 0 && " (filtered)"}
          </p>
        </motion.div>

        {/* History Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold w-16">ID</TableHead>
                      <TableHead className="font-semibold">File Name</TableHead>
                      <TableHead className="font-semibold w-24">Type</TableHead>
                      <TableHead className="font-semibold w-32">
                        Category
                      </TableHead>
                      <TableHead className="font-semibold">
                        Generated At
                      </TableHead>
                      <TableHead className="font-semibold text-center w-32">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr key="loading">
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading history...
                              </p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : histories.length === 0 ? (
                        <motion.tr
                          key="no-data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <motion.div
                              className="flex flex-col items-center justify-center"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              <FileText className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No report history found.</p>
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
                        histories.map((item, index) => {
                          const isDownloading = downloadingIds.has(item.id); // New
                          return (
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
                              <TableCell className="font-mono font-medium">
                                {item.id}
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">
                                  {item.fileName || "-"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.type === "pdf"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="uppercase"
                                >
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={getTabVariant(item.tab)}
                                  className="gap-1"
                                >
                                  {getTabIcon(item.tab)}
                                  {getTabLabel(item.tab)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {formatDate(item.createdAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center gap-2">
                                  {item.type === "pdf" ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() =>
                                        handleDownloadPDF(
                                          item.id,
                                          item.fileName,
                                        )
                                      }
                                      disabled={isDownloading} // New
                                      title={
                                        isDownloading
                                          ? "Downloading..."
                                          : "Download PDF"
                                      }
                                    >
                                      {isDownloading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <FileText className="h-4 w-4" />
                                      )}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() =>
                                        handleDownloadExcel(
                                          item.id,
                                          item.fileName,
                                        )
                                      }
                                      disabled={isDownloading} // New
                                      title={
                                        isDownloading
                                          ? "Downloading..."
                                          : "Download Excel"
                                      }
                                    >
                                      {isDownloading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <FileSpreadsheet className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
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
