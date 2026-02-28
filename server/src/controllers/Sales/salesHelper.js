// --------------------------------------------------------------------
// HELPER: Group data by month
// --------------------------------------------------------------------
export const groupByMonth = (invoices, type = "sales") => {
  const monthMap = new Map();

  invoices.forEach((invoice) => {
    const date = new Date(invoice.invoiceDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthName = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        monthKey,
        monthName,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        invoices: [],
        // Aggregated fields
        totalGrossAmount: 0,
        totalSchemeAmount: 0,
        totalDiscountAmount: 0,
        totalDamageAmount: 0,
        totalTaxableValue: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
        totalCess: 0,
        totalGSTAmount: 0,
        totalCessCharge: 0,
        totalAddAmount: 0,
        totalCreditAmount: 0,
        totalFinalAmount: 0,
        invoiceCount: 0,
      });
    }

    const monthData = monthMap.get(monthKey);

    // Calculate invoice level GST totals
    let invoiceTaxableValue = 0;
    let invoiceCGST = 0;
    let invoiceSGST = 0;
    let invoiceIGST = 0;
    let invoiceCess = 0;
    let invoiceGSTAmount = 0;
    let invoiceSchemeAmount = 0;
    let invoiceDamageAmount = 0;

    const itemDetails = invoice.items.map((item) => {
      const taxableValue = item.rate * item.aQty;
      const gstRate = item.product?.gstRate || 18;
      const cessRate = item.product?.cessRate || 0;
      const gstInclusive = item.product?.gstInclusive ?? true;

      let itemTaxableValue = taxableValue;
      let itemGSTAmount = item.taxAmount || (taxableValue * gstRate) / 100;
      let itemCGST = itemGSTAmount / 2;
      let itemSGST = itemGSTAmount / 2;
      let itemCess = (taxableValue * cessRate) / 100;

      if (gstInclusive) {
        itemTaxableValue = taxableValue - itemGSTAmount;
      }

      // Accumulate invoice totals
      invoiceTaxableValue += itemTaxableValue;
      invoiceCGST += itemCGST;
      invoiceSGST += itemSGST;
      invoiceCess += itemCess;
      invoiceGSTAmount += itemGSTAmount;
      invoiceSchemeAmount += item.schAmount || 0;
      invoiceDamageAmount += (item.DQty || 0) * item.rate;

      return {
        itemId: item.id,
        productId: item.productId,
        productCode: item.product?.productCode,
        description: item.product?.description,
        hsnSacCode: item.product?.hsnSacCode,
        gstRate: gstRate,
        cessRate: cessRate,
        unitName: item.product?.unit?.name,
        unitSymbol: item.product?.unit?.symbol,
        quantity: item.aQty,
        unit: item.unit,
        rate: item.rate,
        mrp: item.batch?.mrp,
        taxableValue: itemTaxableValue,
        cgstAmount: itemCGST,
        sgstAmount: itemSGST,
        igstAmount: 0,
        cessAmount: itemCess,
        totalGST: itemGSTAmount,
        schemeAmount: item.schAmount || 0,
        schemePercent: item.schPercent || 0,
        freeQuantity: item.fQty || 0,
        damagedQuantity: item.DQty || 0,
        finalAmount: item.finalAmount || 0,
      };
    });

    const discountAmount =
      (invoice.finalAmount * (invoice.discountPercent || 0)) / 100;
    const grossAmount =
      invoice.grossAmount || invoiceTaxableValue + invoiceGSTAmount;

    const invoiceData = {
      saleId: invoice.id,
      invoiceId: invoice.invoiceNo,
      customerName:
        invoice.customer?.companyName || invoice.customer?.personName || "",
      gstin: "", // Placeholder
      invoiceDate: invoice.invoiceDate,
      refInvoiceId: "",
      refDate: null,
      grossAmount: grossAmount,
      schemeAmount: invoiceSchemeAmount || invoice.scheme1 || 0,
      discountAmount: discountAmount,
      damageAmount: invoiceDamageAmount,
      finalAmount: invoice.finalAmount,
      taxableValue: invoiceTaxableValue,
      cgstAmount: invoiceCGST,
      sgstAmount: invoiceSGST,
      igstAmount: invoiceIGST,
      cessAmount: invoiceCess || invoice.cessInsurance || 0,
      totalGSTAmount: invoiceGSTAmount,
      cess: invoice.cessInsurance || 0,
      addAmount: invoice.amountAdd || 0,
      creditAmount: invoice.creditAmount || 0,
      boxUnit: invoice.boxUnit || 0,
      remarks: invoice.remarks || "",
      status: invoice.status,
      customerDetails: invoice.customer,
      areaDetails: invoice.area,
      vanDetails: invoice.van,
      salesmanDetails: invoice.salesman,
      itemCount: itemDetails.length,
      items: itemDetails,
    };

    // Add to month data
    monthData.invoices.push(invoiceData);
    monthData.totalGrossAmount += grossAmount;
    monthData.totalSchemeAmount += invoiceData.schemeAmount;
    monthData.totalDiscountAmount += discountAmount;
    monthData.totalDamageAmount += invoiceDamageAmount;
    monthData.totalTaxableValue += invoiceTaxableValue;
    monthData.totalCGST += invoiceCGST;
    monthData.totalSGST += invoiceSGST;
    monthData.totalIGST += invoiceIGST;
    monthData.totalCess += invoiceCess;
    monthData.totalGSTAmount += invoiceGSTAmount;
    monthData.totalCessCharge += invoice.cessInsurance || 0;
    monthData.totalAddAmount += invoice.amountAdd || 0;
    monthData.totalCreditAmount += invoice.creditAmount || 0;
    monthData.totalFinalAmount += invoice.finalAmount;
    monthData.invoiceCount += 1;
  });

  // Convert to array and sort by monthKey
  return Array.from(monthMap.values()).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey),
  );
};
