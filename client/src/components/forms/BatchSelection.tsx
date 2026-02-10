// components/forms/BatchSelectionModal.tsx
import React, { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Package,
  Calendar,
  Hash,
  IndianRupee,
  X,
  Check,
  Filter,
  Download,
  Eye,
  Plus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Batch, PurchaseHistory } from "@/types/purchase";

interface BatchSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  productCode: string;
  description: string;
  onBatchSelect?: (batch: Batch, aQty: number, mQty: number) => void;
}

const mockBatches: Batch[] = [
  {
    batchNo: "250712182734",
    mfgDate: "2024-07-12",
    expDate: "2025-07-12",
    barcode: "BOUR 10RS",
    currentStock: 3384,
    tempStock: 3384,
    mrp: 9.0,
    pRate: 6.68,
    lastPRate: 6.68,
    pack: 1,
  },
  {
    batchNo: "250712182735",
    mfgDate: "2024-08-01",
    expDate: "2025-08-01",
    barcode: "BOUR 20RS",
    currentStock: 2500,
    tempStock: 2500,
    mrp: 18.0,
    pRate: 12.5,
    lastPRate: 12.5,
    pack: 1,
  },
  {
    batchNo: "250712182736",
    mfgDate: "2024-06-15",
    expDate: "2025-06-15",
    barcode: "BOUR 5RS",
    currentStock: 5000,
    tempStock: 5000,
    mrp: 4.5,
    pRate: 3.2,
    lastPRate: 3.2,
    pack: 1,
  },
  {
    batchNo: "250712182737",
    mfgDate: "2024-05-20",
    expDate: "2025-05-20",
    barcode: "BOUR 50RS",
    currentStock: 1500,
    tempStock: 1500,
    mrp: 45.0,
    pRate: 32.5,
    lastPRate: 32.5,
    pack: 1,
  },
  {
    batchNo: "250712182738",
    mfgDate: "2024-04-10",
    expDate: "2025-04-10",
    barcode: "BOUR 100RS",
    currentStock: 800,
    tempStock: 800,
    mrp: 90.0,
    pRate: 65.0,
    lastPRate: 65.0,
    pack: 1,
  },
];

const mockPurchaseHistory: PurchaseHistory[] = [
  {
    batch: "250712182734",
    invoiceNo: "INV001234",
    date: "2024-01-15",
    quantity: 100,
    rate: 6.5,
    amount: 650,
  },
  {
    batch: "250712182734",
    invoiceNo: "INV001235",
    date: "2024-01-10",
    quantity: 200,
    rate: 6.48,
    amount: 1296,
  },
  {
    batch: "250712182734",
    invoiceNo: "INV001236",
    date: "2024-01-05",
    quantity: 150,
    rate: 6.45,
    amount: 967.5,
  },
  {
    batch: "250712182735",
    invoiceNo: "INV001237",
    date: "2024-01-20",
    quantity: 300,
    rate: 12.3,
    amount: 3690,
  },
  {
    batch: "250712182736",
    invoiceNo: "INV001238",
    date: "2024-01-18",
    quantity: 500,
    rate: 3.15,
    amount: 1575,
  },
];

export default function BatchSelectionModal({
  open,
  onOpenChange,
  productId,
  productCode,
  description,
  onBatchSelect,
}: BatchSelectionModalProps) {
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [aQty, setAQty] = useState<number>(1);
  const [mQty, setMQty] = useState<number>(1);
  const [searchBatch, setSearchBatch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("batch");
  const [showBatchError, setShowBatchError] = useState<boolean>(false);

  const filteredBatches = mockBatches.filter(
    (batch) =>
      batch.batchNo.toLowerCase().includes(searchBatch.toLowerCase()) ||
      batch.barcode.toLowerCase().includes(searchBatch.toLowerCase()),
  );

  const handleBatchSelect = (batch: Batch) => {
    setSelectedBatch(batch);
    setShowBatchError(false);
    toast.success(`Batch ${batch.batchNo} selected`, {
      description: `Rate: ₹${batch.pRate.toFixed(2)} | MRP: ₹${batch.mrp.toFixed(2)}`,
    });
  };

  const handleApplyBatch = () => {
    if (!selectedBatch) {
      setShowBatchError(true);
      toast.error("Please select a batch", {
        description: "Batch selection is required to proceed",
        icon: <AlertCircle className="h-4 w-4" />,
      });
      return;
    }

    if (selectedBatch && onBatchSelect) {
      onBatchSelect(selectedBatch, aQty, mQty);
      onOpenChange(false);
      toast.success(`Batch ${selectedBatch.batchNo} applied`, {
        description: `Quantity: A=${aQty}, M=${mQty} | Total: ₹${(selectedBatch.pRate * aQty).toFixed(2)}`,
      });
    }
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
    // In a real app, you would open a form to create a new batch
    // This could be another modal or a form within this modal
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedBatch(null);
      setAQty(1);
      setMQty(1);
      setSearchBatch("");
      setActiveTab("batch");
      setShowBatchError(false);
    }
  }, [open]);

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
      <DialogContent className="min-w-[90vw] min-h-[40vh] overflow-y-auto">
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
              <Plus className="h-4 w-4" />
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
                    min="1"
                    value={aQty}
                    onChange={(e) =>
                      setAQty(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-24"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="mQty" className="text-sm font-medium">
                  M Qty
                </Label>
                <div className="flex items-center">
                  <Input
                    id="mQty"
                    type="number"
                    min="1"
                    value={mQty}
                    onChange={(e) =>
                      setMQty(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-24"
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
                {selectedBatch.pRate.toFixed(2)} × {aQty} =
                <span className="ml-1 font-bold">
                  ₹{(selectedBatch.pRate * aQty).toFixed(2)}
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
              PURCHASE HISTORY
            </TabsTrigger>
          </TabsList>

          {/* SELECT BATCH TAB */}
          <TabsContent value="batch" className="space-y-4">
            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by batch number or barcode..."
                  className="pl-10"
                  value={searchBatch}
                  onChange={(e) => setSearchBatch(e.target.value)}
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

            {/* Batch Selection Table */}
            <div className="rounded-md border max-h-50 overflow-y-auto">
              <Table className="">
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="font-semibold">Select</TableHead>
                    <TableHead className="font-semibold">Batch</TableHead>
                    <TableHead className="font-semibold">MFG Date</TableHead>
                    <TableHead className="font-semibold">EXP Date</TableHead>
                    <TableHead className="font-semibold">Barcode</TableHead>
                    <TableHead className="font-semibold">
                      Current Stock
                    </TableHead>
                    <TableHead className="font-semibold">Temp Stock</TableHead>
                    <TableHead className="font-semibold">MRP</TableHead>
                    <TableHead className="font-semibold">P.Rate</TableHead>
                    <TableHead className="font-semibold">Last P.Rate</TableHead>
                    <TableHead className="font-semibold">Pack</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            No batches found
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchBatch("")}
                          >
                            Clear search
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBatches.map((batch) => (
                      <TableRow
                        key={batch.batchNo}
                        className={`hover:bg-secondary/30 cursor-pointer ${
                          selectedBatch?.batchNo === batch.batchNo
                            ? "bg-primary/10 border-l-4 border-l-primary"
                            : ""
                        }`}
                        onClick={() => handleBatchSelect(batch)}
                      >
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <div
                              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                selectedBatch?.batchNo === batch.batchNo
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground"
                              }`}
                            >
                              {selectedBatch?.batchNo === batch.batchNo && (
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
                            {batch.currentStock.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            {batch.tempStock.toLocaleString()}
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
                              {batch.pRate.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <IndianRupee className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="font-medium">
                              {batch.lastPRate.toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{batch.pack}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* PURCHASE HISTORY TAB */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">
                Purchase History for {productCode}
              </h3>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export History
              </Button>
            </div>

            <div className="rounded-md border max-h-50 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="font-semibold">Batch</TableHead>
                    <TableHead className="font-semibold">Invoice No</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Quantity</TableHead>
                    <TableHead className="font-semibold">Rate</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPurchaseHistory
                    .filter((history) => {
                      // Filter by selected batch if any, otherwise show all
                      if (selectedBatch) {
                        return history.batch === selectedBatch.batchNo;
                      }
                      return true;
                    })
                    .map((history, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          <Badge variant="outline">{history.batch}</Badge>
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
                            {history.date}
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
                              const batch = mockBatches.find(
                                (b) => b.batchNo === history.batch,
                              );
                              if (batch) {
                                setSelectedBatch(batch);
                                setActiveTab("batch");
                                setAQty(history.quantity);
                                setShowBatchError(false);
                                toast.info("Batch selected from history", {
                                  description: `Batch ${batch.batchNo} loaded with quantity ${history.quantity}`,
                                });
                              }
                            }}
                          >
                            Use
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
                      {selectedBatch.pRate.toFixed(2)} × {aQty} = ₹
                      {(selectedBatch.pRate * aQty).toFixed(2)}
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
