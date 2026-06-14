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
  LayoutList,
  MapPin,
  User,
  Loader2, // Added for spinner
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
import { useDebounce } from "@/utils/debounce";
import { salesService } from "@/services/salesService";
import type {
  SalesReportHistory,
  SalesReportHistoryFilters,
} from "@/types/sales-report";
import { format } from "date-fns";

export default function SalesHistory() {
  const { layoutMode } = useTheme();
  // State
  const [histories, setHistories] = useState<SalesReportHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Download tracking state (new)
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  // Filter states
  const [searchInput, setSearchInput] = useState("");
  const [fileNameInput, setFileNameInput] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "pdf" | "excel">("all");
  const [tabFilter, setTabFilter] = useState<
    "all" | "summary" | "register" | "area-wise" | "salesman-wise"
  >("all");
  const [filters, setFilters] = useState<SalesReportHistoryFilters>({
    page: 1,
    limit: 10,
    search: "",
    fileName: "",
    type: "", // empty string means no type filter
    tab: "", // empty string means no tab filter
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Debounced search
  const debouncedSearch = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  }, 300);

  const debouncedFileName = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, fileName: value, page: 1 }));
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

  // Fetch history
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await salesService.getSalesReportHistory({
        ...filters,
        page: currentPage,
        limit: itemsPerPage,
      });
      setHistories(response.histories);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (error) {
      toast.error("Failed to fetch sales history");
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

  const handleTabChange = (value: string) => {
    const newTab = value as typeof tabFilter;
    setTabFilter(newTab);
    // Map "all" to empty string for API
    setFilters((prev) => ({
      ...prev,
      tab: newTab === "all" ? "" : newTab,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setSearchInput("");
    setFileNameInput("");
    setTypeFilter("all");
    setTabFilter("all");
    setFilters({
      page: 1,
      limit: itemsPerPage,
      search: "",
      fileName: "",
      type: "",
      tab: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setCurrentPage(1);
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

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                        {/* Global Search */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Global Search
                          </Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by file name..."
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
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            File Name
                          </Label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Filter by file name..."
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
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Report Type
                          </Label>
                          <div className="flex items-center gap-2">
                            <Select
                              value={typeFilter}
                              onValueChange={handleTypeChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Types" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="excel">Excel</SelectItem>
                              </SelectContent>
                            </Select>
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
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Report Category
                          </Label>
                          <div className="flex items-center gap-2">
                            <Select
                              value={tabFilter}
                              onValueChange={handleTabChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Categories" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  All Categories
                                </SelectItem>
                                <SelectItem value="summary">Summary</SelectItem>
                                <SelectItem value="register">
                                  Register
                                </SelectItem>
                                <SelectItem value="area-wise">
                                  Area Wise
                                </SelectItem>
                                <SelectItem value="salesman-wise">
                                  Salesman Wise
                                </SelectItem>
                              </SelectContent>
                            </Select>
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
