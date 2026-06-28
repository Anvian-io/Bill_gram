import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
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
import { purchaseService } from "@/services/purchaseService";
import type {
  PurchaseReportHistory,
  PurchaseReportHistoryFilters,
} from "@/types/purchase";
import { format } from "date-fns";

export default function PurchaseHistory() {
  const { layoutMode } = useTheme();
  // State
  const [histories, setHistories] = useState<PurchaseReportHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Download tracking state
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  // Filter states
  const [searchInput, setSearchInput] = useState("");
  const [fileNameInput, setFileNameInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "pdf" | "excel">("all");
  const [typeOpen, setTypeOpen] = useState(false);
  const [filters, setFilters] = useState<PurchaseReportHistoryFilters>({
    page: 1,
    limit: 10,
    search: "",
    fileName: "",
    type: "", // empty string means no type filter
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Helper functions for download state
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

  // Debounced search
  const debouncedSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  }, 300);

  const debouncedFileName = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, fileName: value, page: 1 }));
  }, 300);

  // Fetch history
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await purchaseService.getPurchaseReportHistory({
        ...filters,
        page: currentPage,
        limit: itemsPerPage,
      });
      setHistories(response.histories);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (error) {
      toast.error("Failed to fetch purchase history");
      setHistories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters, currentPage, itemsPerPage]);

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
      page: 1,
    }));
  };

  const clearFilters = () => {
    setSearchInput("");
    setFileNameInput("");
    setTypeFilter("all");
    setFilters({
      page: 1,
      limit: itemsPerPage,
      search: "",
      fileName: "",
      type: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setCurrentPage(1);
  };

  const clearFilter = (field: keyof PurchaseReportHistoryFilters) => {
    if (field === "search") {
      setSearchInput("");
      setFilters((prev) => ({ ...prev, search: "" }));
    } else if (field === "fileName") {
      setFileNameInput("");
      setFilters((prev) => ({ ...prev, fileName: "" }));
    } else if (field === "type") {
      setTypeFilter("all");
      setFilters((prev) => ({ ...prev, type: "" }));
    }
  };

  // Download handlers (with loading state)
  const handleDownloadPDF = async (id: number, fileName: string | null) => {
    if (downloadingIds.has(id)) return;

    startDownload(id);
    try {
      const blob = await purchaseService.downloadPurchaseReportHistoryPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || `purchase-history-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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
      const blob = await purchaseService.downloadPurchaseReportHistoryExcel(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || `purchase-history-${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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
    return count;
  }, [filters.search, filters.fileName, filters.type]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, "dd/MM/yyyy HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const getTypeLabel = (type: string) => {
    if (type === "all") return "";
    if (type === "pdf") return "PDF";
    return "Excel";
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
                onClick={fetchHistory}
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Info & Pagination Controls */}
        <motion.div
          className="flex justify-between items-center mb-4"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">
            Showing {totalItems > 0 ? startIndex : 0} to {endIndex} of{" "}
            {totalItems} records
            {activeFiltersCount > 0 && " (filtered)"}
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
                          <TableCell colSpan={5} className="text-center py-12">
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
                            colSpan={5}
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
                          const isDownloading = downloadingIds.has(item.id);
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
                                      disabled={isDownloading}
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
                                      disabled={isDownloading}
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagination */}
        {!isLoading && histories.length > 0 && totalPages > 1 && (
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
