import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InlineSearchField } from "@/components/custom_ui/InlineSearchField";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { format } from "date-fns";
import { CustomDateInput } from "@/components/custom_ui";
import {
  containerVariants,
  itemVariants,
  headerVariants,
  buttonVariants,
} from "@/components/FramerVariants";
import { toast } from "sonner";
import { salesService } from "@/services/salesService";
import type { HSNSummaryFilters, HSNSummaryRow } from "@/types/sales-report";
import GstDetailsFilter from "@/components/common/GstDetailsFilter";

export default function HSNSummary({ isCollapsed }: { isCollapsed: boolean }) {
  const { layoutMode } = useTheme();
  const [rows, setRows] = useState<HSNSummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [sourceOpen, setSourceOpen] = useState(false);

  const [filters, setFilters] = useState<HSNSummaryFilters>({
    source: "all",
    gstDetails: undefined,
    fromDate: undefined,
    toDate: undefined,
  });
  const [fromDateValue, setFromDateValue] = useState<string | null>(null);
  const [toDateValue, setToDateValue] = useState<string | null>(null);

  const activeFiltersCount = [
    filters.gstDetails,
    filters.fromDate,
    filters.toDate,
  ].filter(
    (v) => v !== undefined && v !== null,
  ).length;

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.totalQty += row.totalQty;
          acc.totalValue += row.totalValue;
          acc.taxable += row.taxable;
          acc.igst += row.igst;
          acc.cgstAmt += row.cgstAmt;
          acc.sgstAmt += row.sgstAmt;
          acc.cess += row.cess;
          acc.addCess += row.addCess;
          acc.apmc += row.apmc;
          return acc;
        },
        {
          totalQty: 0,
          totalValue: 0,
          taxable: 0,
          igst: 0,
          cgstAmt: 0,
          sgstAmt: 0,
          cess: 0,
          addCess: 0,
          apmc: 0,
        },
      ),
    [rows],
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
    setFilters((prev) => ({
      ...prev,
      gstDetails: undefined,
      fromDate: undefined,
      toDate: undefined,
    }));
    setFromDateValue(null);
    setToDateValue(null);
  };

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const response = await salesService.getHSNSummary(filters);
      setRows(response.rows || []);
    } catch (error) {
      console.error("Error fetching HSN summary:", error);
      toast.error("Failed to fetch HSN summary report");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [filters.source, filters.fromDate, filters.toDate]);

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const blob = await salesService.downloadHSNSummaryExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = format(new Date(), "dd-MM-yyyy_HH-mm");
      link.href = url;
      link.setAttribute(
        "download",
        `hsn-summary-${filters.source || "all"}-${timestamp}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("HSN summary Excel downloaded successfully");
    } catch (error) {
      console.error("Error downloading HSN summary Excel:", error);
      toast.error("Failed to download HSN summary Excel");
    } finally {
      setIsDownloading(false);
    }
  };

  const num = (n: number) => n.toFixed(2);

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
                        Clear dates
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                        <GstDetailsFilter
                          value={filters.gstDetails}
                          onChange={(value) =>
                            setFilters((prev) => ({ ...prev, gstDetails: value }))
                          }
                          disabled={isLoading}
                        />

                        <div>
                          <InlineSearchField
                            open={sourceOpen}
                            onOpenChange={setSourceOpen}
                            displayValue={
                              filters.source === "all" ? "" : filters.source === "sales" ? "Sales" : "Purchase"
                            }
                            placeholder="Data Type"
                            emptyMessage="No data type found."
                            disabled={isLoading}
                          >
                            <CommandGroup>
                              <CommandItem value="all" onSelect={() => { setFilters((prev) => ({ ...prev, source: "all" })); setSourceOpen(false); }}>All</CommandItem>
                              <CommandItem value="sales" onSelect={() => { setFilters((prev) => ({ ...prev, source: "sales" })); setSourceOpen(false); }}>Sales</CommandItem>
                              <CommandItem value="purchase" onSelect={() => { setFilters((prev) => ({ ...prev, source: "purchase" })); setSourceOpen(false); }}>Purchase</CommandItem>
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="mb-4 text-sm text-muted-foreground" variants={itemVariants}>
          Showing {rows.length} rows ({(filters.source || "all").toUpperCase()})
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full transition-normal">
                <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Goods / Service</TableHead>
                      <TableHead>HSN/SAC</TableHead>
                      <TableHead className="text-right">TAX</TableHead>
                      <TableHead>UQC(Unit Quantity Code)</TableHead>
                      <TableHead className="text-right">Total QTY</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">TAXABLE</TableHead>
                      <TableHead className="text-right">IGST</TableHead>
                      <TableHead className="text-right">CGST_AMT</TableHead>
                      <TableHead className="text-right">SGST_AMT</TableHead>
                      <TableHead className="text-right">CESS</TableHead>
                      <TableHead className="text-right">ADD_CESS</TableHead>
                      <TableHead className="text-right">APMC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {isLoading ? (
                        <motion.tr key="loading">
                          <TableCell colSpan={13} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center">
                              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">Loading HSN summary...</p>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ) : rows.length === 0 ? (
                        <motion.tr key="no-data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                            No rows found for selected filters.
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
                              <TableCell>{row.goodsOrService}</TableCell>
                              <TableCell>{row.hsnSac}</TableCell>
                              <TableCell className="text-right">{num(row.tax)}</TableCell>
                              <TableCell>{row.uqc}</TableCell>
                              <TableCell className="text-right">{num(row.totalQty)}</TableCell>
                              <TableCell className="text-right">{num(row.totalValue)}</TableCell>
                              <TableCell className="text-right">{num(row.taxable)}</TableCell>
                              <TableCell className="text-right">{num(row.igst)}</TableCell>
                              <TableCell className="text-right">{num(row.cgstAmt)}</TableCell>
                              <TableCell className="text-right">{num(row.sgstAmt)}</TableCell>
                              <TableCell className="text-right">{num(row.cess)}</TableCell>
                              <TableCell className="text-right">{num(row.addCess)}</TableCell>
                              <TableCell className="text-right">{num(row.apmc)}</TableCell>
                            </motion.tr>
                          ))}
                          <TableRow className="bg-muted/80 font-bold border-t-2 border-border">
                            <TableCell className="font-bold">Total</TableCell>
                            <TableCell />
                            <TableCell />
                            <TableCell />
                            <TableCell className="text-right">{num(totals.totalQty)}</TableCell>
                            <TableCell className="text-right">{num(totals.totalValue)}</TableCell>
                            <TableCell className="text-right">{num(totals.taxable)}</TableCell>
                            <TableCell className="text-right">{num(totals.igst)}</TableCell>
                            <TableCell className="text-right">{num(totals.cgstAmt)}</TableCell>
                            <TableCell className="text-right">{num(totals.sgstAmt)}</TableCell>
                            <TableCell className="text-right">{num(totals.cess)}</TableCell>
                            <TableCell className="text-right">{num(totals.addCess)}</TableCell>
                            <TableCell className="text-right">{num(totals.apmc)}</TableCell>
                          </TableRow>
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
