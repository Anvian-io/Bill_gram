import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
import { useState, useEffect, type KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Package,
  Calendar,
  IndianRupee,
  X,
  Check,
  Filter,
  AlertCircle,
  Loader2,
  Eye,
  Hash,
} from "lucide-react";
import { parseNumberInputValue } from "@/lib/numberInput";
import { toast } from "sonner";
import { productService, type ProductBatchHistoryEntry } from "@/services/productService";
import type { Batch } from "@/types/product";

interface BatchSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  productCode: string;
  description: string;
  cartonPack: number;
  conversionFactor: number;
  onBatchSelect?: (batch: Batch, aQty: number, mQty: number) => void;
}

export default function BatchSelectionModal({
  open,
  onOpenChange,
  productId,
  productCode,
  description,
  cartonPack,
  conversionFactor,
  onBatchSelect,
}: BatchSelectionModalProps) {
  const { layoutMode } = useTheme();
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [aQty, setAQty] = useState<number>(0);
  const [mQty, setMQty] = useState<number>(0);
  const [searchBatch, setSearchBatch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("batch");
  const [showBatchError, setShowBatchError] = useState<boolean>(false);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [salesHistory, setSalesHistory] = useState<ProductBatchHistoryEntry[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch batches when modal opens
  useEffect(() => {
    if (open && productId) {
      fetchBatches();
      fetchSalesHistory();
    }
  }, [open, productId]);

  const fetchSalesHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await productService.getProductSalesHistory(productId);
      setSalesHistory(response.histories ?? []);
    } catch (err) {
      console.error("Failed to fetch sales history:", err);
      setSalesHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProductBatches(productId);
      setBatches(response.batches);
    } catch (err) {
      console.error("Failed to fetch batches:", err);
      setError("Failed to load batches. Please try again.");
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  // Calculate M Qty
  useEffect(() => {
    const calculatedMQty = aQty * cartonPack * conversionFactor;
    setMQty(calculatedMQty);
  }, [aQty, cartonPack, conversionFactor]);

  // Clamp A Qty when selected batch changes or stock updates
  useEffect(() => {
    if (selectedBatch && selectedBatch.openingStock !== undefined) {
      if (aQty > selectedBatch.openingStock) {
        setAQty(selectedBatch.openingStock);
        toast.warning(
          `Quantity adjusted to available stock (${selectedBatch.openingStock})`,
          {
            description: `Maximum A Qty for batch ${selectedBatch.batchNo} is ${selectedBatch.openingStock}`,
          },
        );
      }
    }
  }, [selectedBatch, aQty]);

  // Auto-select when only one batch is available (e.g. pinned batch)
  useEffect(() => {
    if (open && batches.length === 1) {
      setSelectedBatch(batches[0]);
      setShowBatchError(false);
    }
  }, [open, batches]);

  const filteredBatches = batches.filter(
    (batch) =>
      batch.batchNo.toLowerCase().includes(searchBatch.toLowerCase()) ||
      (batch.barcode &&
        batch.barcode.toLowerCase().includes(searchBatch.toLowerCase())),
  );

  const handleBatchSelect = (batch: Batch) => {
    setSelectedBatch(batch);
    setShowBatchError(false);
    // If current aQty > stock, adjust it
    if (batch.openingStock !== undefined && aQty > batch.openingStock) {
      setAQty(batch.openingStock);
      toast.info(`Quantity adjusted to ${batch.openingStock} based on stock`, {
        description: `Batch ${batch.batchNo} has only ${batch.openingStock} available.`,
      });
    }
    toast.success(`Batch ${batch.batchNo} selected`, {
      description: `Rate: ₹${batch.saleRate?.toFixed(2) || "N/A"} | MRP: ₹${batch.mrp.toFixed(2)} | Stock: ${batch.openingStock}`,
    });
  };

  const handleApplyBatch = () => {
    const batch =
      selectedBatch ??
      (filteredBatches.length > 0 ? filteredBatches[0] : null);

    if (!batch) {
      setShowBatchError(true);
      toast.error("Please select a batch", {
        description: "Batch selection is required to proceed",
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }

    // Double-check stock before applying (only when quantity entered)
    if (
      aQty > 0 &&
      batch.openingStock !== undefined &&
      aQty > batch.openingStock
    ) {
      toast.error(`Only ${batch.openingStock} stock available`, {
        description: `Cannot apply A Qty of ${aQty}. Adjust quantity.`,
      });
      return;
    }

    if (onBatchSelect) {
      onBatchSelect(batch, aQty, mQty);
      onOpenChange(false);
      toast.success(`Batch ${batch.batchNo} applied`, {
        description: `Quantity: A=${aQty}, M=${mQty} | Total: ₹${((batch.saleRate || 0) * aQty).toFixed(2)}`,
      });
    }
  };

  const handleEnterApply = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleApplyBatch();
  };

  const handleDialogKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter" || activeTab !== "batch") return;
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "BUTTON"
    ) {
      return;
    }
    e.preventDefault();
    handleApplyBatch();
  };

  const handleCancel = () => {
    if (selectedBatch) {
      onOpenChange(false);
    } else {
      toast.error("Cannot cancel without selecting a batch", {
        description: "You must select a batch before closing the modal",
        icon: <AlertCircle className="h-4 w-4" />,
      });
    }
  };

  const handleNewBatch = () => {
    toast.info("New Batch feature", {
      description: "Create new batch functionality would open here",
    });
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedBatch(null);
      setAQty(0);
      setMQty(1 * cartonPack * conversionFactor);
      setSearchBatch("");
      setActiveTab("batch");
      setShowBatchError(false);
    }
  }, [open, cartonPack, conversionFactor]);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && !selectedBatch) {
          toast.error("Cannot close without selecting a batch", {
            description: "You must select a batch before closing the modal",
            icon: <AlertCircle className="h-4 w-4" />,
          });
          return;
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent
        className="min-w-[90vw] min-h-[40vh] overflow-y-auto"
        onKeyDown={handleDialogKeyDown}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5" />
              Batch Selection - {productCode}: {description}
            </DialogTitle>
          </div>
          <DialogDescription>
            Select a batch and quantity for {description}.{" "}
            <span className="text-destructive font-semibold">
              Batch selection is required.
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* New Batch Button and Quantity Inputs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={handleNewBatch}
              variant="outline"
              className="gap-2 border-primary/50 hover:border-primary hover:bg-primary/5"
            >
              <Package className="h-4 w-4" />
              New Batch
            </Button>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="aQty" className="text-sm font-medium">
                  A Qty
                </Label>
                <div className="flex items-center">
                  <Input
                    id="aQty"
                    type="number"
                    min="0"
                    max={selectedBatch?.openingStock ?? 999999}
                    value={aQty}
                    onChange={(e) => {
                      const newVal = Math.max(
                        0,
                        parseNumberInputValue(e.target.value),
                      );
                      if (
                        selectedBatch &&
                        selectedBatch.openingStock !== undefined &&
                        newVal > selectedBatch.openingStock
                      ) {
                        toast.error(
                          `Only ${selectedBatch.openingStock} stock available`,
                          {
                            description: `Batch ${selectedBatch.batchNo} has only ${selectedBatch.openingStock} items.`,
                          },
                        );
                        setAQty(selectedBatch.openingStock);
                      } else {
                        setAQty(newVal);
                      }
                    }}
                    className="w-24"
                    onKeyDown={handleEnterApply}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="mQty" className="text-sm font-medium">
                  M Qty (Weight/Volume)
                </Label>
                <div className="flex items-center">
                  <Input
                    id="mQty"
                    type="number"
                    min="0"
                    value={mQty}
                    readOnly
                    disabled
                    className="w-24 bg-muted cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {selectedBatch && (
            <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-md">
              <Badge variant="secondary" className="font-mono text-sm">
                {selectedBatch.batchNo}
              </Badge>
              <span className="text-sm font-medium flex items-center">
                <IndianRupee className="h-3 w-3 mr-1" />
                {selectedBatch.saleRate?.toFixed(2) || "0.00"} × {aQty} =
                <span className="ml-1 font-bold">
                  ₹{((selectedBatch.saleRate || 0) * aQty).toFixed(2)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  Stock: {selectedBatch.openingStock}
                </span>
              </span>
            </div>
          )}
        </div>

        {showBatchError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Please select a batch to continue
            </span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              SELECT BATCH
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              SALES HISTORY
            </TabsTrigger>
          </TabsList>

          {/* SELECT BATCH TAB */}
          <TabsContent value="batch" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="searchBatch"
                  placeholder="Search by batch number or barcode..."
                  className="pl-10"
                  value={searchBatch}
                  onChange={(e) => setSearchBatch(e.target.value)}
                  onKeyDown={handleEnterApply}
                />
                {searchBatch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchBatch("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-md border max-h-50 overflow-y-auto">
              <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="font-semibold">Select</TableHead>
                    <TableHead className="font-semibold">Batch No</TableHead>
                    <TableHead className="font-semibold">MFG Date</TableHead>
                    <TableHead className="font-semibold">EXP Date</TableHead>
                    <TableHead className="font-semibold">Barcode</TableHead>
                    <TableHead className="font-semibold">
                      Current Stock
                    </TableHead>
                    <TableHead className="font-semibold">MRP</TableHead>
                    <TableHead className="font-semibold">S. Rate</TableHead>
                    <TableHead className="font-semibold">Pack</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading batches...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-destructive"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-8 w-8" />
                          <p>{error}</p>
                          <Button variant="outline" onClick={fetchBatches}>
                            Retry
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No active batches found for this product
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNewBatch}
                          >
                            Create New Batch
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBatches.map((batch) => (
                      <TableRow
                        key={batch.id}
                        className={`hover:bg-secondary/30 cursor-pointer ${
                          selectedBatch?.id === batch.id
                            ? "bg-primary/10 border-l-4 border-l-primary"
                            : ""
                        }`}
                        onClick={() => handleBatchSelect(batch)}
                      >
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <div
                              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                selectedBatch?.id === batch.id
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground"
                              }`}
                            >
                              {selectedBatch?.id === batch.id && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          {batch.batchNo}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {batch.mfgDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {batch.expDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {batch.barcode}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            {batch.openingStock?.toLocaleString() || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <IndianRupee className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="font-medium">
                              {batch.mrp.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <IndianRupee className="h-3 w-3 mr-1 text-green-600" />
                            <span className="font-bold text-green-700">
                              {batch.saleRate?.toFixed(2) || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">1</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* SALES HISTORY TAB */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">
                Sales History for {productCode} (active batches only)
              </h3>
            </div>

            <div className="rounded-md border max-h-50 overflow-y-auto">
              <Table className={cn(layoutMode === "classic" && "classic-table", layoutMode === "classic" && "classic-table")}>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="font-semibold">Batch</TableHead>
                    <TableHead className="font-semibold">Invoice No</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Quantity</TableHead>
                    <TableHead className="font-semibold">Hist. Rate</TableHead>
                    <TableHead className="font-semibold">Curr. Rate</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading sales history...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : salesHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No sales history found for active batches
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell className="font-mono">
                          <Badge variant="outline">{history.batchNo}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            {history.invoiceNo}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(history.invoiceDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            {history.quantity.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {history.rate.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-green-700 font-medium">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {history.currentRate.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            <span className="font-medium">
                              {history.amount.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const batch = batches.find(
                                (b) => b.id === history.batchId,
                              );
                              if (batch) {
                                setSelectedBatch(batch);
                                setActiveTab("batch");
                                const qty = Math.min(
                                  history.quantity,
                                  batch.openingStock ?? history.quantity,
                                );
                                setAQty(Math.max(0, qty));
                                setShowBatchError(false);
                                toast.info("Batch selected from history", {
                                  description: `Batch ${batch.batchNo} loaded with qty ${Math.max(0, qty)} at current rate ₹${(batch.saleRate || 0).toFixed(2)}`,
                                });
                              } else {
                                toast.error("Batch not available", {
                                  description: `Batch ${history.batchNo} is not in active stock`,
                                });
                              }
                            }}
                          >
                            Use
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-muted-foreground">
              {selectedBatch ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Selected Batch: </span>
                  <Badge variant="secondary" className="font-mono">
                    {selectedBatch.batchNo}
                  </Badge>
                  <span className="flex items-center">
                    <IndianRupee className="h-3 w-3 mr-1" />
                    <span className="font-medium">
                      {selectedBatch.saleRate?.toFixed(2) || "0.00"} × {aQty} =
                      ₹{((selectedBatch.saleRate || 0) * aQty).toFixed(2)}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      Stock: {selectedBatch.openingStock}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">No batch selected</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={!selectedBatch}
              >
                Cancel
              </Button>
              <Button
                id="applyBatchBtn"
                onClick={handleApplyBatch}
                disabled={!selectedBatch}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Apply Batch
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
