import { Fragment, useEffect, useState } from "react";
import { purchaseService } from "@/services/purchaseService";
import type { PurchaseBillPreviewData } from "@/types/purchase";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomPagination } from "@/components/custom_ui";
import { getFullImageUrl } from "@/utils/imageUtils";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: number;
}

export default function PurchaseInvoicePreview({
  open,
  onOpenChange,
  purchaseId,
}: Props) {
  const [previewData, setPreviewData] = useState<PurchaseBillPreviewData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchPreview = async () => {
      if (!open || !purchaseId) return;
      try {
        setLoading(true);
        const data = await purchaseService.getPurchaseBillPreview(purchaseId);
        setPreviewData(data);
      } catch (error) {
        console.error("Failed to load purchase preview", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [purchaseId, open]);

  useEffect(() => {
    if (!open) {
      setPreviewData(null);
      setLoading(true);
      setCurrentPage(1);
    }
  }, [open]);

  if (!previewData && !loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p className="text-center text-red-500">Invoice not found</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (loading || !previewData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { purchase, upiQrCode } = previewData;
  const companyName =
    purchase.user?.company_name ||
    purchase.user?.shop_name ||
    "Purchase Invoice";
  const companyAddress = purchase.user?.address || "";
  const companyPhone = purchase.user?.phone || "";
  const companyGstin = "";
  const companyFssai = "";

  const companyLogoUrl = purchase.user?.company_logo
    ? getFullImageUrl(purchase.user.company_logo)
    : null;
  const signatureUrl = previewData.signature
    ? getFullImageUrl(previewData.signature)
    : null;

  const supplier = purchase.supplier;
  const supplierName = supplier?.name || "";
  const supplierAddress = supplier?.address || "";
  const supplierPhone = supplier?.phoneNo || "";
  const supplierGstin = supplier?.gstIN || "";

  const invoiceDate = purchase.invoiceDate
    ? format(new Date(purchase.invoiceDate), "dd/MM/yyyy")
    : "";

  const items = purchase.items || [];
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const isLastPage = currentPage === totalPages;

  const defaultTaxRates = [2.5, 6, 9, 14];
  const taxBreakdown = previewData.taxBreakdown || [];
  const taxRates = Array.from(
    new Set([
      ...defaultTaxRates,
      ...taxBreakdown
        .map((entry) => Number(entry.rate) || 0)
        .filter((rate) => rate > 0),
    ]),
  ).sort((a, b) => a - b);
  const cgstAmounts = new Map<number, number>();
  const sgstAmounts = new Map<number, number>();
  taxBreakdown.forEach((entry) => {
    cgstAmounts.set(
      Number(entry.rate),
      (cgstAmounts.get(Number(entry.rate)) || 0) + (entry.cgstAmount || 0),
    );
    sgstAmounts.set(
      Number(entry.rate),
      (sgstAmounts.get(Number(entry.rate)) || 0) + (entry.sgstAmount || 0),
    );
  });

  const gross = purchase.grossAmount || 0;
  const discountPercent = purchase.discountPercent || 0;
  const discountAmount = gross * (discountPercent / 100);
  const schemeTotal = purchase.scheme1 || 0;
  const damageAmount = items.reduce(
    (sum, item) => sum + (item.DQty || 0) * (item.rate || 0),
    0,
  );
  const amountAdd = purchase.amountAdd || 0;
  const creditAmount = purchase.creditAmount || 0;
  const totalGst = purchase.tax || 0;
  const roundOff = 0;
  const finalAmount = purchase.finalAmount || 0;

  const handleDownloadPdf = async () => {
    if (!purchaseId || downloadingPdf) return;

    setDownloadingPdf(true);
    try {
      const blob = await purchaseService.downloadPurchaseBillPreviewPDF(purchaseId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeInvoiceNo = (purchase.invoiceNo || `purchase-${purchaseId}`)
        .toString()
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `purchase-invoice-${safeInvoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Purchase invoice PDF downloaded");
    } catch (error) {
      console.error("Failed to download purchase invoice PDF", error);
      toast.error("Failed to download purchase invoice PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle>Purchase Invoice Preview</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="mr-8"
          >
            {downloadingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {downloadingPdf ? "Generating..." : "Download PDF"}
          </Button>
        </DialogHeader>

        <div className="bg-white text-gray-800 border border-gray-700 font-mono text-sm">
          <div className="flex justify-between items-start p-2 gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
              <div className="text-left pr-4">
                <div className="flex items-start gap-2">
                  {companyLogoUrl && (
                    <img
                      src={companyLogoUrl}
                      alt="Company Logo"
                      className="h-32 w-32 object-contain shrink-0"
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-bold uppercase">
                      {companyName}
                    </h1>
                    <p className="text-xs">Address : {companyAddress}</p>
                    <p className="text-xs">Phone : {companyPhone}</p>
                    <p className="text-xs">GSTIN : {companyGstin}</p>
                    <p className="text-xs">FSSAI NO : {companyFssai}</p>
                  </div>
                </div>
              </div>

              <div className="text-left pl-4 border-l border-gray-400 h-full">
                <h2 className="text-lg font-bold uppercase">{supplierName}</h2>
                <p className="text-xs">Address : {supplierAddress}</p>
                <p className="text-xs">Phone : {supplierPhone}</p>
                <p className="text-xs">GSTIN : {supplierGstin}</p>
                <p className="text-xs">FSSAI NO :</p>
              </div>
            </div>

            <div className="border border-gray-400 w-32 h-32 flex items-center justify-center text-gray-500 text-xs">
              {upiQrCode ? (
                <img
                  src={upiQrCode}
                  alt="UPI QR"
                  className="w-full h-full object-contain"
                />
              ) : (
                "QR Code"
              )}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-b border-gray-400 py-2 px-4">
            <h3 className="text-lg font-bold uppercase">Tax Invoice</h3>
            <p className="text-base font-semibold">
              Inv. No. : {purchase.invoiceNo} | Date : {invoiceDate}
            </p>
          </div>

          <table className="w-full border-collapse border border-gray-400 text-xs">
            <thead>
              <tr className="border border-gray-400 bg-gray-100">
                <th className="border border-gray-400 px-1 py-1">Sr</th>
                <th className="border border-gray-400 px-1 py-1">HSN</th>
                <th className="border border-gray-400 px-1 py-1">
                  Prod Description
                </th>
                <th className="border border-gray-400 px-1 py-1">MRP</th>
                <th className="border border-gray-400 px-1 py-1">Bx/Qty</th>
                <th className="border border-gray-400 px-1 py-1">FR</th>
                <th className="border border-gray-400 px-1 py-1">Rate</th>
                <th className="border border-gray-400 px-1 py-1">Scheme</th>
                <th className="border border-gray-400 px-1 py-1">Amount</th>
                <th className="border border-gray-400 px-1 py-1">GST%</th>
                <th className="border border-gray-400 px-1 py-1">GST Amt</th>
                <th className="border border-gray-400 px-1 py-1">Net Amt</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item: any, idx) => {
                const product = item.product || {};
                const batch = item.batch || {};
                const srNo = (currentPage - 1) * itemsPerPage + idx + 1;
                const bxQty = `${item.mQty || 0}/${item.aQty || 0}`;
                return (
                  <tr key={item.id || idx} className="border border-gray-400">
                    <td className="border border-gray-400 px-1 py-1">{srNo}</td>
                    <td className="border border-gray-400 px-1 py-1">
                      {product.hsnSacCode || ""}
                    </td>
                    <td className="border border-gray-400 px-1 py-1">
                      {product.description || ""}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-right">
                      {batch.mrp || ""}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-right">
                      {bxQty}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-right">
                      {item.fQty || 0}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-right">
                      {item.rate || 0}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-right">
                      {item.schAmount || 0}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-right">
                      {item.totalAmount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-right">
                      {item.taxRate || 0}%
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-right">
                      {item.taxAmount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-right">
                      {item.finalAmount?.toFixed(2) || "0.00"}
                    </td>
                  </tr>
                );
              })}

              {!isLastPage &&
                Array.from({ length: Math.max(0, itemsPerPage - paginatedItems.length) }).map(
                  (_, i) => (
                    <tr key={`empty-${i}`} className="border border-gray-400 h-6">
                      {Array.from({ length: 12 }).map((__, j) => (
                        <td
                          key={`empty-cell-${i}-${j}`}
                          className="border border-gray-400 px-1 py-1"
                        />
                      ))}
                    </tr>
                  ),
                )}
            </tbody>
          </table>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-gray-400">
            <table className="w-full border-collapse text-xs">
              <tbody>
                <tr className="border border-gray-400">
                  <td className="border border-gray-400 px-2 py-1 font-semibold">
                    CGST
                  </td>
                  {taxRates.map((rate) => (
                    <Fragment key={`cgst-${rate}`}>
                      <td className="border border-gray-400 px-2 py-1 text-right">
                        {rate}%
                      </td>
                      <td className="border border-gray-400 px-2 py-1 text-right">
                        {(cgstAmounts.get(rate) || 0).toFixed(2)}
                      </td>
                    </Fragment>
                  ))}
                </tr>
                <tr className="border border-gray-400">
                  <td className="border border-gray-400 px-2 py-1 font-semibold">
                    SGST
                  </td>
                  {taxRates.map((rate) => (
                    <Fragment key={`sgst-${rate}`}>
                      <td className="border border-gray-400 px-2 py-1 text-right">
                        {rate}%
                      </td>
                      <td className="border border-gray-400 px-2 py-1 text-right">
                        {(sgstAmounts.get(rate) || 0).toFixed(2)}
                      </td>
                    </Fragment>
                  ))}
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border border-gray-400 bg-gray-100">
                  <th className="border border-gray-400 px-2 py-1 text-right">
                    GROSS
                  </th>
                  <th className="border border-gray-400 px-2 py-1 text-right">
                    Disc-0%
                  </th>
                  <th className="border border-gray-400 px-2 py-1 text-right">
                    Tot Sch
                  </th>
                  <th className="border border-gray-400 px-2 py-1 text-right">
                    Damage
                  </th>
                  <th className="border border-gray-400 px-2 py-1 text-right">
                    Add/Less
                  </th>
                  <th className="border border-gray-400 px-2 py-1 text-right">
                    Total Gst
                  </th>
                  <th className="border border-gray-400 px-2 py-1 text-right">
                    R/O
                  </th>
                  <th className="border border-gray-400 px-2 py-1 text-right">
                    Total Pay
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border border-gray-400">
                  <td className="border border-gray-400 px-2 py-1 text-right">
                    {gross.toFixed(2)}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right">
                    {discountAmount.toFixed(2)}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right">
                    {schemeTotal.toFixed(2)}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right">
                    {damageAmount.toFixed(2)}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right">
                    {amountAdd.toFixed(2)}/{creditAmount.toFixed(2)}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right">
                    {totalGst.toFixed(2)}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right">
                    {roundOff.toFixed(2)}
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right font-semibold">
                    {finalAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between border-t border-gray-400 mt-2">
            <div className="w-2/3 p-2 text-xs">
              <p>Cheque Return Charges Rs.500/-</p>
              <p>Remarks : {purchase.remarks || ""}</p>
              <p className="mt-2 text-[10px] leading-4">
                We hereby certify that our Registration Certificate under the GST
                Act 2017 is in force on the date on which sale of this goods
                specified in this Tax Invoice is made by us and that the
                transaction of sale covered by this Tax invoice has been effected
                by us and it shall be accounted for in the turnover of sales while
                filing of return and the due tax, if any payable on the sale has
                been paid or shall be paid.
              </p>
            </div>
            <div className="w-1/3 border-l border-gray-400 flex flex-col justify-end items-center p-2 min-h-[120px]">
              {signatureUrl && (
                <img
                  src={signatureUrl}
                  alt="Signature"
                  className="max-h-20 object-contain mb-2"
                />
              )}
              <p className="text-xs border-t border-gray-400 pt-1 w-full text-center">
                For {companyName}
              </p>
            </div>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="pt-3">
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
