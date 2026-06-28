import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
import React, { useState, useEffect } from "react";
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
import { Filter, RefreshCw, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfYear } from "date-fns";
import { CustomDateInput } from "@/components/custom_ui";
import {
  containerVariants,
  itemVariants,
  headerVariants,
  buttonVariants,
} from "@/components/FramerVariants";
import { toast } from "sonner";
import { purchaseService } from "@/services/purchaseService";
import type {
  PurchaseMonthlyGSTResponse,
  PurchaseMonthlyData,
  PurchaseMonthlyFilters,
} from "@/types/purchase";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function PurchaseMonthlyGST({
  isCollapsed,
}: {
  isCollapsed: boolean;
}) {
  const { layoutMode } = useTheme();
  // Get default dates - January 1st of current year to today
  const getDefaultFromDate = () => {
    const now = new Date();
    return startOfYear(now); // January 1st of current year
  };

  const getDefaultToDate = () => {
    return new Date(); // Current date
  };

  // State
  const [monthlyData, setMonthlyData] = useState<PurchaseMonthlyData[]>([]);
  const [grandTotals, setGrandTotals] = useState<
    PurchaseMonthlyGSTResponse["grandTotals"] | null
  >(null);
  const [periodInfo, setPeriodInfo] = useState<
    PurchaseMonthlyGSTResponse["period"] | null
  >(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filters state with default dates
  const [filters, setFilters] = useState<PurchaseMonthlyFilters>({
    fromDate: getDefaultFromDate(),
    toDate: getDefaultToDate(),
    gstDetails: undefined,
  });

  const [fromDateValue, setFromDateValue] = useState<string | null>(
    format(getDefaultFromDate(), "yyyy-MM-dd"),
  );
  const [toDateValue, setToDateValue] = useState<string | null>(
    format(getDefaultToDate(), "yyyy-MM-dd"),
  );

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

  const clearFilters = () => {
    const defaultFrom = getDefaultFromDate();
    const defaultTo = getDefaultToDate();

    setFilters({
      fromDate: defaultFrom,
      toDate: defaultTo,
      gstDetails: undefined,
    });
    setFromDateValue(format(defaultFrom, "yyyy-MM-dd"));
    setToDateValue(format(defaultTo, "yyyy-MM-dd"));
  };

  const clearFilter = (filterName: keyof PurchaseMonthlyFilters) => {
    if (filterName === "fromDate") {
      const defaultFrom = getDefaultFromDate();
      setFilters((prev) => ({
        ...prev,
        fromDate: defaultFrom,
      }));
      setFromDateValue(format(defaultFrom, "yyyy-MM-dd"));
    } else if (filterName === "toDate") {
      const defaultTo = getDefaultToDate();
      setFilters((prev) => ({
        ...prev,
        toDate: defaultTo,
      }));
      setToDateValue(format(defaultTo, "yyyy-MM-dd"));
    } else if (filterName === "gstDetails") {
      setFilters((prev) => ({
        ...prev,
        gstDetails: undefined,
      }));
    }
  };

  // ----------------------------------------------------------------------
  // Fetch report data
  // ----------------------------------------------------------------------
  const fetchReport = async () => {
    // Validation
    if (!filters.fromDate || !filters.toDate) {
      toast.error("Please select both From Date and To Date");
      return;
    }

    setIsLoading(true);
    try {
      const response = await purchaseService.getPurchaseGSTMonthly(filters);
      setMonthlyData(response.monthlyData);
      setGrandTotals(response.grandTotals);
      setPeriodInfo(response.period);
    } catch (error) {
      console.error("Error fetching monthly GST data:", error);
      toast.error("Failed to fetch monthly GST data");
      setMonthlyData([]);
      setGrandTotals(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch when both dates are present
  useEffect(() => {
    if (filters.fromDate && filters.toDate) {
      fetchReport();
    }
  }, [filters.fromDate, filters.toDate]);

  // ----------------------------------------------------------------------
  // Download Excel
  // ----------------------------------------------------------------------
  const handleDownloadExcel = async () => {
    if (!filters.fromDate || !filters.toDate) {
      toast.error("Please select date range first");
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await purchaseService.downloadPurchaseGSTMonthlyExcel({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        gstDetails: filters.gstDetails,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = format(new Date(), "dd-MM-yyyy_HH-mm");
      link.href = url;
      link.setAttribute(
        "download",
        `purchase-monthly-gst-report-${timestamp}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast.error("Failed to download Excel");
    } finally {
      setIsDownloading(false);
    }
  };

  // ----------------------------------------------------------------------
  // Helper functions
  // ----------------------------------------------------------------------
  const activeFiltersCount = [
    filters.gstDetails,
    filters.fromDate,
    filters.toDate,
  ].filter(
    (v) => v !== undefined && v !== null,
  ).length;

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatMonthYear = (monthKey: string) => {
    // monthKey is typically "YYYY-MM"
    try {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return format(date, "MMMM yyyy");
    } catch {
      return monthKey;
    }
  };

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
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
                  className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  onClick={handleDownloadExcel}
                  disabled={
                    isLoading || isDownloading || monthlyData.length === 0
                  }
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

        {/* Filter Section */}
        <motion.div className="mb-2" variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="p-1">
              <div className="flex flex-col gap-4 p-1">
                {/* Filter Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Date Range</h3>
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFiltersCount} active
                      </Badge>
                    )}
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
                        <GstDetailsFilter
                          value={filters.gstDetails}
                          onChange={(value) =>
                            setFilters((prev) => ({ ...prev, gstDetails: value }))
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Period Info */}
        {periodInfo && (
          <motion.div
            className="flex justify-between items-center mb-4 bg-muted/50 p-3 rounded-lg"
            variants={itemVariants}
          >
            <p className="text-sm text-muted-foreground">
              Period:{" "}
              <span className="font-medium">
                {new Date(periodInfo.from).toLocaleDateString()}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {new Date(periodInfo.to).toLocaleDateString()}
              </span>
              {" | "}
              Total Months:{" "}
              <span className="font-medium">{periodInfo.totalMonths}</span>
            </p>
          </motion.div>
        )}

        {/* Report Table */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className={`overflow-x-auto w-full transition-normal`}>
                <Table className="">
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="font-semibold">Month</TableHead>
                      <TableHead className="font-semibold text-right">
                        Invoices
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Gross Amount
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Scheme
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Discount
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Damage
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Taxable Value
                      </TableHead>
                      <TableHead className="font-semibold text-right text-purple-700">
                        CGST
                      </TableHead>
                      <TableHead className="font-semibold text-right text-purple-700">
                        SGST
                      </TableHead>
                      <TableHead className="font-semibold text-right text-orange-700">
                        IGST
                      </TableHead>
                      <TableHead className="font-semibold text-right text-red-700">
                        Cess
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Add Amt
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        Credit
                      </TableHead>
                      <TableHead className="font-semibold text-right text-green-700">
                        Final Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr key="loading">
                          <TableCell colSpan={14} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Loading monthly GST data...
                              </p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : monthlyData.length === 0 ? (
                        <motion.tr
                          key="no-data"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <TableCell
                            colSpan={14}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <motion.div
                              className="flex flex-col items-center justify-center"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50 mb-2" />
                              <p>No data found for the selected period.</p>
                              <p className="text-sm mt-1">
                                Select a date range to view the report.
                              </p>
                            </motion.div>
                          </TableCell>
                        </motion.tr>
                      ) : (
                        <>
                          {monthlyData.map((month, index) => (
                            <motion.tr
                              key={month.monthKey}
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
                              <TableCell className="font-medium">
                                {formatMonthYear(month.monthKey)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="font-mono">
                                  {month.invoiceCount}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(month.totalGrossAmount)}
                              </TableCell>
                              <TableCell className="text-right text-blue-700">
                                {formatCurrency(month.totalSchemeAmount)}
                              </TableCell>
                              <TableCell className="text-right text-yellow-700">
                                {formatCurrency(month.totalDiscountAmount)}
                              </TableCell>
                              <TableCell className="text-right text-red-600">
                                {formatCurrency(month.totalDamageAmount)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(month.totalTaxableValue)}
                              </TableCell>
                              <TableCell className="text-right text-purple-700">
                                {formatCurrency(month.totalCGST)}
                              </TableCell>
                              <TableCell className="text-right text-purple-700">
                                {formatCurrency(month.totalSGST)}
                              </TableCell>
                              <TableCell className="text-right text-orange-700">
                                {formatCurrency(month.totalIGST)}
                              </TableCell>
                              <TableCell className="text-right text-red-700">
                                {formatCurrency(month.totalCess)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(month.totalAddAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(month.totalCreditAmount)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-700">
                                {formatCurrency(month.totalFinalAmount)}
                              </TableCell>
                            </motion.tr>
                          ))}

                          {/* Grand Total Row */}
                          {grandTotals && (
                            <TableRow className="bg-muted/80 font-bold border-t-2 border-border">
                              <TableCell className="font-bold">
                                GRAND TOTAL
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="secondary"
                                  className="font-mono font-bold"
                                >
                                  {grandTotals.totalInvoices}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(grandTotals.totalGrossAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(grandTotals.totalSchemeAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(
                                  grandTotals.totalDiscountAmount,
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(grandTotals.totalDamageAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(grandTotals.totalTaxableValue)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(grandTotals.totalCGST)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(grandTotals.totalSGST)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(grandTotals.totalIGST)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(grandTotals.totalCess)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(grandTotals.totalAddAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(grandTotals.totalCreditAmount)}
                              </TableCell>
                              <TableCell className="text-right text-green-700">
                                {formatCurrency(grandTotals.totalFinalAmount)}
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
      </div>
    </motion.div>
  );
}
