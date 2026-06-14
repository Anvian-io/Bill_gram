import { cn } from "@/lib/utils";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, RefreshCw, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, startOfYear } from "date-fns";
import { CustomDateInput } from "@/components/custom_ui";
import {
  containerVariants,
  itemVariants,
  headerVariants,
  buttonVariants,
} from "@/components/FramerVariants";
import { toast } from "sonner";
import { salesService } from "@/services/salesService";
import type {
  SalesB2CFilters,
  SalesB2CResponse,
  SalesB2CRow,
} from "@/types/sales-report";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";

export default function B2C({ isCollapsed }: { isCollapsed: boolean }) {
  const { layoutMode } = useTheme();
  const getDefaultFromDate = () => startOfYear(new Date());
  const getDefaultToDate = () => new Date();

  const [rows, setRows] = useState<SalesB2CRow[]>([]);
  const [summary, setSummary] = useState<SalesB2CResponse["summary"] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState<SalesB2CFilters>({
    fromDate: getDefaultFromDate(),
    toDate: getDefaultToDate(),
    gstDetails: undefined,
    sortBy: "place",
    sortOrder: "asc",
  });

  const [fromDateValue, setFromDateValue] = useState<string | null>(
    format(getDefaultFromDate(), "yyyy-MM-dd"),
  );
  const [toDateValue, setToDateValue] = useState<string | null>(
    format(getDefaultToDate(), "yyyy-MM-dd"),
  );

  const handleFilterChange = <K extends keyof SalesB2CFilters>(
    field: K,
    value: SalesB2CFilters[K],
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

  const clearFilter = (filterName: keyof SalesB2CFilters) => {
    if (filterName === "fromDate") {
      const date = getDefaultFromDate();
      setFilters((prev) => ({ ...prev, fromDate: date }));
      setFromDateValue(format(date, "yyyy-MM-dd"));
    } else if (filterName === "toDate") {
      const date = getDefaultToDate();
      setFilters((prev) => ({ ...prev, toDate: date }));
      setToDateValue(format(date, "yyyy-MM-dd"));
    } else if (filterName === "gstDetails") {
      setFilters((prev) => ({ ...prev, gstDetails: undefined }));
    }
  };

  const clearFilters = () => {
    const defaultFrom = getDefaultFromDate();
    const defaultTo = getDefaultToDate();
    setFilters({
      fromDate: defaultFrom,
      toDate: defaultTo,
      gstDetails: undefined,
      sortBy: "place",
      sortOrder: "asc",
    });
    setFromDateValue(format(defaultFrom, "yyyy-MM-dd"));
    setToDateValue(format(defaultTo, "yyyy-MM-dd"));
  };

  const fetchReport = async () => {
    if (!filters.fromDate || !filters.toDate) {
      toast.error("Please select both From Date and To Date");
      return;
    }
    setIsLoading(true);
    try {
      const response = await salesService.getSalesB2C(filters);
      setRows(response.rows);
      setSummary(response.summary);
    } catch (error) {
      console.error("Error fetching B2C data:", error);
      toast.error("Failed to fetch B2C data");
      setRows([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (filters.fromDate && filters.toDate) {
      fetchReport();
    }
  }, [filters.fromDate, filters.toDate, filters.sortBy, filters.sortOrder]);

  const handleDownloadExcel = async () => {
    if (!filters.fromDate || !filters.toDate) {
      toast.error("Please select date range first");
      return;
    }
    setIsDownloading(true);
    try {
      const blob = await salesService.downloadSalesB2CExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = format(new Date(), "dd-MM-yyyy_HH-mm");
      link.href = url;
      link.setAttribute("download", `b2c-report-${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error("Error downloading B2C Excel:", error);
      toast.error("Failed to download Excel");
    } finally {
      setIsDownloading(false);
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
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
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

        <motion.div className="mb-2" variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="p-1">
              <div className="flex flex-col gap-4 p-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Filters</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-muted-foreground"
                      disabled={isLoading}
                    >
                      Reset to Default
                    </Button>
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
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t">
                        <GstDetailsFilter
                          value={filters.gstDetails}
                          onChange={(value) =>
                            handleFilterChange("gstDetails", value)
                          }
                          disabled={isLoading}
                        />

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Sort By</Label>
                          <Select
                            value={filters.sortBy}
                            onValueChange={(value) =>
                              handleFilterChange("sortBy", value)
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="place">Place</SelectItem>
                              <SelectItem value="rate">Rate</SelectItem>
                              <SelectItem value="taxable">Taxable</SelectItem>
                              <SelectItem value="taxAmt">Tax Amt</SelectItem>
                              <SelectItem value="cess">Cess</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Order</Label>
                          <Select
                            value={filters.sortOrder}
                            onValueChange={(value) =>
                              handleFilterChange(
                                "sortOrder",
                                value as "asc" | "desc",
                              )
                            }
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Order..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">Ascending</SelectItem>
                              <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <CustomDateInput
                          label="From Date"
                          value={fromDateValue}
                          onChange={handleFromDateChange}
                          placeholder="dd/mm/yyyy"
                          disabled={isLoading}
                        />

                        <CustomDateInput
                          label="To Date"
                          value={toDateValue}
                          onChange={handleToDateChange}
                          placeholder="dd/mm/yyyy"
                          disabled={isLoading}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full transition-normal">
                <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">TYPE</TableHead>
                      <TableHead className="font-semibold">PLACE</TableHead>
                      <TableHead className="font-semibold text-right">
                        RATE
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        TAXABLE
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        TAX AMT
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        CESS
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        ADD_CESS
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        APMC
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr key="loading">
                          <TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading B2C data...
                              </p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : rows.length === 0 ? (
                        <motion.tr
                          key="no-data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <TableCell
                            colSpan={8}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No B2C rows found for selected period.</p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : (
                        <>
                          {rows.map((row, index) => (
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
                              <TableCell>{row.type}</TableCell>
                              <TableCell>{row.place}</TableCell>
                              <TableCell className="text-right">
                                {row.rate.toFixed(2)}%
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(row.taxable)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(row.taxAmt)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(row.cess)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(row.addCess)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(row.apmc)}
                              </TableCell>
                            </motion.tr>
                          ))}

                          {summary && (
                            <TableRow className="bg-muted/80 font-bold border-t-2 border-border">
                              <TableCell className="font-bold">Total</TableCell>
                              <TableCell />
                              <TableCell />
                              <TableCell className="text-right">
                                {formatCurrency(summary.taxable)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(summary.taxAmt)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(summary.cess)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(summary.addCess)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(summary.apmc)}
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {summary && (
          <motion.div
            className="mb-4 bg-muted/40 p-3 rounded-lg"
            variants={itemVariants}
          >
            <p className="text-sm text-muted-foreground">
              Summary B2CS for period{" "}
              <span className="font-medium">
                {filters.fromDate
                  ? format(filters.fromDate, "dd/MM/yyyy")
                  : "-"}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {filters.toDate ? format(filters.toDate, "dd/MM/yyyy") : "-"}
              </span>{" "}
              <Badge variant="secondary" className="ml-2">
                {rows.length} rows
              </Badge>
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
