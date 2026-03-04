import { useEffect, useState } from "react";
import { salesService } from "@/services/salesService";
import type { SalesBillPreviewData } from "@/types/sales";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomPagination } from "@/components/custom_ui";
import { getFullImageUrl } from "@/utils/imageUtils"; // <-- ADD THIS IMPORT

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number;
}

export default function SalesInvoicePreview({
  open,
  onOpenChange,
  saleId,
}: Props) {
  const [previewData, setPreviewData] = useState<SalesBillPreviewData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchPreview = async () => {
      if (!open || !saleId) return;
      try {
        setLoading(true);
        const data = await salesService.getSalesBillPreview(saleId);
        setPreviewData(data);
      } catch (error) {
        console.error("Failed to load sale preview", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [saleId, open]);

  // Reset state when dialog closes
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
            <DialogTitle>Sales Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { sale, upiQrCode } = previewData;
  const user = sale.user || {};
  const companyName = user.company_name || user.shop_name || "SS MARKETING";
  const companyAddress = user.address || "";
  const companyPhone = user.phone || "";
  const companyGstin = user.gstin || ""; // you might need to fetch from elsewhere
  const companyFssai = user.fssai || ""; // same

  // Get full image URLs
  const companyLogoUrl = user.company_logo
    ? getFullImageUrl(user.company_logo)
    : null;
  const signatureUrl = previewData.signature
    ? getFullImageUrl(previewData.signature)
    : null;

  const customer = sale.customer;
  const customerName = customer?.companyName || customer?.personName || "";
  const customerAddress = customer?.address || "";
  const customerPhone = customer?.phoneNo || "";
  const customerGstin = customer?.gstIN || ""; // adjust if field name differs

  const invoiceDate = sale.invoiceDate
    ? format(new Date(sale.invoiceDate), "dd/MM/yyyy")
    : "";

  const items = sale.items || [];
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const isLastPage = currentPage === totalPages;

  // Compute GST breakdown per tax rate (assuming intra-state: CGST & SGST split equally)
  const taxRateMap = new Map<number, { cgst: number; sgst: number }>();
  items.forEach((item) => {
    const rate = item.taxRate || 0;
    const taxAmount = item.taxAmount || 0;
    const half = taxAmount / 2;
    const existing = taxRateMap.get(rate);
    if (existing) {
      existing.cgst += half;
      existing.sgst += half;
    } else {
      taxRateMap.set(rate, { cgst: half, sgst: half });
    }
  });

  // Summary calculations
  const gross = sale.grossAmount || 0;
  const discountPercent = sale.discountPercent || 0;
  const discountAmount = gross * (discountPercent / 100);
  const schemeTotal = sale.scheme1 || 0;
  const damageAmount = items.reduce(
    (sum, item) => sum + (item.DQty || 0) * (item.rate || 0),
    0,
  );
  const amountAdd = sale.amountAdd || 0;
  const creditAmount = sale.creditAmount || 0;
  const totalGst = sale.tax || 0;
  const roundOff = 0; // Not present in data, can be omitted or computed if needed
  const finalAmount = sale.finalAmount || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sales Invoice Preview</DialogTitle>
        </DialogHeader>

        <div className="bg-white text-gray-800 border border-gray-700 font-mono text-sm">
          {/* Header with two columns + QR */}
          <div className="flex justify-between items-start p-4">
            <div className="text-left">
              {companyLogoUrl && (
                <img
                  src={companyLogoUrl}
                  alt="Company Logo"
                  className="h-12 mb-2 object-contain"
                />
              )}
              <h1 className="text-xl font-bold uppercase">{companyName}</h1>
              <p className="text-xs">Address : {companyAddress}</p>
              <p className="text-xs">Phone : {companyPhone}</p>
              <p className="text-xs">GSTIN : {companyGstin}</p>
              <p className="text-xs">FSSAI NO : {companyFssai}</p>
            </div>

            <div className="text-right">
              <h2 className="text-lg font-bold uppercase">{customerName}</h2>
              <p className="text-xs">Address : {customerAddress}</p>
              <p className="text-xs">Phone : {customerPhone}</p>
              <p className="text-xs">GSTIN : {customerGstin}</p>
            </div>

            <div className="border border-gray-400 w-20 h-20 flex items-center justify-center text-gray-500 text-xs">
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

          {/* Tax Invoice title and invoice no */}
          <div className="flex justify-between items-center border-t border-b border-gray-400 py-2 px-4">
            <h3 className="text-lg font-bold uppercase">Tax Invoice</h3>
            <p className="text-base font-semibold">
              Inv. No. : {sale.invoiceNo} | Date : {invoiceDate}
            </p>
          </div>

          {/* Items table */}
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <thead>
              <tr className="border border-gray-400 bg-gray-100">
                <th className="border border-gray-400 px-1 py-1">Sr</th>
                <th className="border border-gray-400 px-1 py-1">HSN</th>
                <th className="border border-gray-400 px-1 py-1">
                  Prod Description
                </th>
                <th className="border border-gray-400 px-1 py-1">MRP</th>
                <th className="border border-gray-400 px-1 py-1">Qty</th>
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
                      {item.aQty || 0}
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
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {/* Footer (only on last page) */}
          {isLastPage && (
            <>
              {/* CGST / SGST table */}
              <table className="w-full border-collapse border border-gray-400 text-xs mt-2">
                <tbody>
                  {Array.from(taxRateMap.entries()).map(([rate, amounts]) => (
                    <tr key={rate}>
                      <td className="border border-gray-400 px-2 py-1 font-bold">
                        CGST @ {rate}%
                      </td>
                      <td className="border border-gray-400 px-2 py-1 text-right">
                        {amounts.cgst.toFixed(2)}
                      </td>
                      <td className="border border-gray-400 px-2 py-1 font-bold">
                        SGST @ {rate}%
                      </td>
                      <td className="border border-gray-400 px-2 py-1 text-right">
                        {amounts.sgst.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary table (single row) */}
              <table className="w-full border-collapse border border-gray-400 text-xs mt-2">
                <thead>
                  <tr>
                    <th className="border border-gray-400 px-2 py-1">GROSS</th>
                    <th className="border border-gray-400 px-2 py-1">Disc</th>
                    <th className="border border-gray-400 px-2 py-1">
                      Tot Sch
                    </th>
                    <th className="border border-gray-400 px-2 py-1">Damage</th>
                    <th className="border border-gray-400 px-2 py-1">
                      Add/Less
                    </th>
                    <th className="border border-gray-400 px-2 py-1">
                      Total Gst
                    </th>
                    <th className="border border-gray-400 px-2 py-1">R/O</th>
                    <th className="border border-gray-400 px-2 py-1">
                      Total Pay
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
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
                      {amountAdd.toFixed(2)} / {creditAmount.toFixed(2)}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-right">
                      {totalGst.toFixed(2)}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-right">
                      {roundOff.toFixed(2)}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-right">
                      {finalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signature and footer notes */}
              <div className="flex justify-between mt-4 border-t border-gray-400 pl-4">
                <div className="text-xs w-2/3 p-2">
                  <p>Cheque Return Charges Rs.500/-</p>
                  <p>Remarks : {sale.remarks || ""}</p>
                  <p className="mt-2 text-[10px] max-w-3xl">
                    We hereby certify that our Registration Certificate under
                    the GST Act 2017 is in force on the date on which sale of
                    this goods specified in this Tax Invoice is made by us and
                    that the transaction of sale covered by this Tax invoice has
                    been effected by us & it shall be accounted for in the
                    turnover of sales while filing of return and the due tax, if
                    any payable on the sale has been paid or shall be paid.
                  </p>
                </div>

                <div className="w-1/3 border-t-0 border border-gray-400 flex flex-col justify-end pt-2 pb-1">
                  {signatureUrl ? (
                    <img
                      src={signatureUrl}
                      alt="Signature"
                      className="h-12 object-contain mx-auto"
                    />
                  ) : (
                    <p className="border-t border-gray-400 pt-1 text-xs text-center">
                      For {companyName}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
