import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../../utils/index.js";
import ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ExcelJS from "exceljs";

/**
 * Helper: Update batch stock
 * @param {PrismaClient} prisma
 * @param {number} batchId
 * @param {number} deltaQty - positive to add, negative to subtract
 */
const updateBatchStock = async (prisma, batchId, deltaQty) => {
  await prisma.batch.update({
    where: { id: batchId },
    data: { openingStock: { increment: deltaQty } },
  });
};

/**
 * Helper: Create purchase history entries for an invoice
 */
const createPurchaseHistory = async (prisma, invoice, items, supplierId) => {
  const historyData = items.map((item) => ({
    productId: item.productId,
    batchId: item.batchId,
    purchaseInvoiceId: invoice.id,
    invoiceNo: `INV-${invoice.id}`,
    invoiceDate: invoice.invoiceDate,
    supplierId,
    rate: item.rate,
    aQty: item.aQty,
    totalAmount: item.totalAmount,
  }));
  await prisma.purchaseHistory.createMany({ data: historyData });
};

// --------------------------------------------------------------------
// 1. CREATE PURCHASE INVOICE
// --------------------------------------------------------------------
export const createPurchase = asyncHandler(async (req, res) => {
  const {
    invoiceDate,
    supplierId,
    invoiceNo,
    gstDetails,
    items, // array of PurchaseInvoiceItemInput
    remarks,
    grossAmount,
    boxUnit,
    cessInsurance,
    scheme1,
    discountPercent,
    tax,
    amountAdd,
    creditAmount,
    finalAmount,
    status = "Pending",
  } = req.body;

  // --- Validation ---
  if (!invoiceDate || !supplierId || !items?.length) {
    return sendResponse(
      res,
      false,
      null,
      "Missing required fields",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Verify supplier exists and is not deleted
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, deleted: false },
  });
  if (!supplier) {
    return sendResponse(
      res,
      false,
      null,
      "Supplier not found",
      statusType.NOT_FOUND,
    );
  }

  // Verify invoice number uniqueness (per user? we'll just check globally)
  // const existing = await prisma.purchaseInvoice.findFirst({
  //   where: { invoiceNo, deleted: false },
  // });
  // if (existing) {
  //   return sendResponse(
  //     res,
  //     false,
  //     null,
  //     "Invoice number already exists",
  //     statusType.CONFLICT,
  //   );
  // }

  // Validate each item
  for (const item of items) {
    if (
      !item.productId ||
      !item.batchId ||
      item.rate == null ||
      item.aQty == null ||
      item.taxRate == null
    ) {
      return sendResponse(
        res,
        false,
        null,
        "Each item must have productId, batchId, rate, aQty, taxRate",
        statusType.BAD_REQUEST,
      );
    }
    // Check product exists
    const product = await prisma.product.findFirst({
      where: { id: item.productId, deleted: false },
    });
    if (!product) {
      return sendResponse(
        res,
        false,
        null,
        `Product ${item.productId} not found`,
        statusType.NOT_FOUND,
      );
    }
    // Check batch exists and belongs to product
    const batch = await prisma.batch.findFirst({
      where: { id: item.batchId, productId: item.productId },
    });
    if (!batch) {
      return sendResponse(
        res,
        false,
        null,
        `Batch ${item.batchId} not found for product ${item.productId}`,
        statusType.NOT_FOUND,
      );
    }
  }

  // --- Transaction ---
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create invoice
      const invoice = await tx.purchaseInvoice.create({
        data: {
          // invoiceNo,
          invoiceDate: new Date(invoiceDate),
          supplierId,
          gstDetails: gstDetails || "Against GST",
          remarks,
          grossAmount,
          boxUnit: boxUnit || 0,
          cessInsurance: cessInsurance || 0,
          scheme1: scheme1 || 0,
          discountPercent: discountPercent || 0,
          tax: tax || 0,
          amountAdd: amountAdd || 0,
          creditAmount: creditAmount || 0,
          finalAmount,
          status,
          userId: req.user?.id, // if you have authentication
        },
      });

      // 2. Create invoice items & update batch stock
      for (const item of items) {
        await tx.purchaseInvoiceItem.create({
          data: {
            purchaseInvoiceId: invoice.id,
            productId: item.productId,
            batchId: item.batchId,
            rate: item.rate,
            aQty: item.aQty,
            mQty: item.mQty || 0,
            unit: item.unit || 0,
            totalAmount: item.totalAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            // sch1Percent: item.sch1Percent || 0,
            // sch1Amount: item.sch1Amount || 0,
            // sch2Percent: item.sch2Percent || 0,
            // sch2Amount: item.sch2Amount || 0,
            fQty: item.fQty || 0,
            DQty: item.DQty || 0,
            schPercent: item.schPercent || 0,
            schAmount: item.schAmount || 0,
            finalAmount: item.finalAmount,
          },
        });

        // Increase batch stock
        await updateBatchStock(tx, item.batchId, item.aQty);
      }

      // 3. Create purchase history entries
      await createPurchaseHistory(tx, invoice, items, supplierId);

      return invoice;
    });

    const paddedId = result.id.toString().padStart(4, "0");

    const updated = await prisma.purchaseInvoice.update({
      where: { id: result.id },
      data: { invoiceNo: `INV-${paddedId}` }, // e.g. "INV-1"
    });

    return sendResponse(
      res,
      true,
      { purchase: result },
      "Purchase invoice created successfully",
      statusType.CREATED,
    );
  } catch (error) {
    console.error("Create purchase error:", error);
    return sendResponse(
      res,
      false,
      null,
      "Failed to create purchase",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
});

// --------------------------------------------------------------------
// 2. GET ALL PURCHASES (with filters, pagination)
// --------------------------------------------------------------------
export const getAllPurchases = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    invoiceNo = "",
    supplierId,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    status,
    showDeleted = "false",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const { page: validatedPage, limit: validatedLimit } = validatePagination(
    page,
    limit,
  );
  const skip = (validatedPage - 1) * validatedLimit;

  // Build WHERE clause
  const andConditions = [];

  if (showDeleted !== "true") {
    andConditions.push({ deleted: false });
  }

  if (invoiceNo) {
    andConditions.push({ invoiceNo: { contains: invoiceNo } });
  }

  if (supplierId) {
    andConditions.push({ supplierId: parseInt(supplierId) });
  }

  // Date range filter
  if (fromDate || toDate) {
    const dateFilter = {};

    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0); // Start of day
      dateFilter.gte = start.toISOString();
    }

    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999); // End of day
      dateFilter.lte = end.toISOString();
    }

    andConditions.push({ invoiceDate: dateFilter });
  }

  // Amount range filter (on finalAmount)
  if (minAmount || maxAmount) {
    const amountFilter = {};
    if (minAmount) {
      amountFilter.gte = parseFloat(minAmount);
    }
    if (maxAmount) {
      amountFilter.lte = parseFloat(maxAmount);
    }
    andConditions.push({ finalAmount: amountFilter });
  }

  if (status) {
    andConditions.push({ status });
  }

  // Global search: invoiceNo, supplier.name, remarks
  if (search) {
    andConditions.push({
      OR: [
        { invoiceNo: { contains: search } },
        { supplier: { name: { contains: search } } },
        { remarks: { contains: search } },
      ],
    });
  }

  const where = andConditions.length ? { AND: andConditions } : {};

  // Sorting
  const validSortFields = [
    "invoiceNo",
    "invoiceDate",
    "grossAmount",
    "finalAmount",
    "createdAt",
    "updatedAt",
  ];
  const orderBy = {
    [validSortFields.includes(sortBy) ? sortBy : "createdAt"]:
      sortOrder === "asc" ? "asc" : "desc",
  };

  // Include relations for items count and supplier name
  const [purchases, total] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      include: {
        supplier: { select: { id: true, name: true, phoneNo: true } },
        items: {
          select: {
            id: true,
            productId: true,
            aQty: true,
            rate: true,
            totalAmount: true,
          },
        },
        _count: { select: { items: true } },
      },
    }),
    prisma.purchaseInvoice.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      purchases,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Purchases retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 3. GET SINGLE PURCHASE BY ID
// --------------------------------------------------------------------
export const getPurchaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const purchase = await prisma.purchaseInvoice.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          phoneNo: true,
          email: true,
          address: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              productCode: true,
              description: true,
              productBrand: true,
            },
          },
          batch: {
            select: {
              id: true,
              batchNo: true,
              barcode: true,
              mrp: true,
              purchaseRate: true,
              openingStock: true,
            },
          },
        },
      },
    },
  });

  if (!purchase) {
    return sendResponse(
      res,
      false,
      null,
      "Purchase invoice not found",
      statusType.NOT_FOUND,
    );
  }

  return sendResponse(
    res,
    true,
    { purchase },
    "Purchase retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 4. UPDATE PURCHASE INVOICE
// --------------------------------------------------------------------
export const updatePurchase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    invoiceDate,
    supplierId,
    invoiceNo,
    gstDetails,
    items,
    remarks,
    grossAmount,
    boxUnit,
    cessInsurance,
    scheme1,
    discountPercent,
    tax,
    amountAdd,
    creditAmount,
    finalAmount,
    status,
  } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check invoice exists and not deleted
  const existingInvoice = await prisma.purchaseInvoice.findFirst({
    where: { id: parseInt(id), deleted: false },
    include: { items: { include: { batch: true } } },
  });
  if (!existingInvoice) {
    return sendResponse(
      res,
      false,
      null,
      "Purchase invoice not found",
      statusType.NOT_FOUND,
    );
  }

  // If invoiceNo changed, check uniqueness
  if (invoiceNo && invoiceNo !== existingInvoice.invoiceNo) {
    const conflict = await prisma.purchaseInvoice.findFirst({
      where: { invoiceNo, deleted: false, NOT: { id: parseInt(id) } },
    });
    if (conflict) {
      return sendResponse(
        res,
        false,
        null,
        "Invoice number already exists",
        statusType.CONFLICT,
      );
    }
  }

  // Validate supplier if changed
  if (supplierId && supplierId !== existingInvoice.supplierId) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, deleted: false },
    });
    if (!supplier) {
      return sendResponse(
        res,
        false,
        null,
        "Supplier not found",
        statusType.NOT_FOUND,
      );
    }
  }

  // Validate new items (similar to create)
  if (items) {
    for (const item of items) {
      if (
        !item.productId ||
        !item.batchId ||
        item.rate == null ||
        item.aQty == null
      ) {
        return sendResponse(
          res,
          false,
          null,
          "Each item must have productId, batchId, rate, aQty",
          statusType.BAD_REQUEST,
        );
      }
      const product = await prisma.product.findFirst({
        where: { id: item.productId, deleted: false },
      });
      if (!product) {
        return sendResponse(
          res,
          false,
          null,
          `Product ${item.productId} not found`,
          statusType.NOT_FOUND,
        );
      }
      const batch = await prisma.batch.findFirst({
        where: { id: item.batchId, productId: item.productId },
      });
      if (!batch) {
        return sendResponse(
          res,
          false,
          null,
          `Batch ${item.batchId} not found for product ${item.productId}`,
          statusType.NOT_FOUND,
        );
      }
    }
  }

  // --- Transaction ---
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Reverse stock from old items
      for (const oldItem of existingInvoice.items) {
        if (oldItem.batchId) {
          await updateBatchStock(tx, oldItem.batchId, -oldItem.aQty);
        }
      }

      // 2. Delete old items and history (will cascade? We'll delete explicitly)
      await tx.purchaseInvoiceItem.deleteMany({
        where: { purchaseInvoiceId: existingInvoice.id },
      });
      await tx.purchaseHistory.deleteMany({
        where: { purchaseInvoiceId: existingInvoice.id },
      });

      // 3. Update invoice header
      await tx.purchaseInvoice.update({
        where: { id: existingInvoice.id },
        data: {
          invoiceDate: invoiceDate
            ? new Date(invoiceDate)
            : existingInvoice.invoiceDate,
          supplierId: supplierId || existingInvoice.supplierId,
          invoiceNo: invoiceNo || existingInvoice.invoiceNo,
          gstDetails:
            gstDetails !== undefined ? gstDetails : existingInvoice.gstDetails,
          remarks: remarks !== undefined ? remarks : existingInvoice.remarks,
          grossAmount:
            grossAmount !== undefined
              ? grossAmount
              : existingInvoice.grossAmount,
          boxUnit: boxUnit !== undefined ? boxUnit : existingInvoice.boxUnit,
          cessInsurance:
            cessInsurance !== undefined
              ? cessInsurance
              : existingInvoice.cessInsurance,
          scheme1: scheme1 !== undefined ? scheme1 : existingInvoice.scheme1,
          discountPercent:
            discountPercent !== undefined
              ? discountPercent
              : existingInvoice.discountPercent,
          tax: tax !== undefined ? tax : existingInvoice.tax,
          amountAdd:
            amountAdd !== undefined ? amountAdd : existingInvoice.amountAdd,
          creditAmount:
            creditAmount !== undefined
              ? creditAmount
              : existingInvoice.creditAmount,
          finalAmount:
            finalAmount !== undefined
              ? finalAmount
              : existingInvoice.finalAmount,
          status: status || existingInvoice.status,
        },
      });

      // 4. Create new items & add stock
      if (items) {
        for (const item of items) {
          await tx.purchaseInvoiceItem.create({
            data: {
              purchaseInvoiceId: existingInvoice.id,
              productId: item.productId,
              batchId: item.batchId,
              rate: item.rate,
              aQty: item.aQty,
              mQty: item.mQty || 0,
              unit: item.unit || 0,
              totalAmount: item.totalAmount,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              // sch1Percent: item.sch1Percent || 0,
              // sch1Amount: item.sch1Amount || 0,
              // sch2Percent: item.sch2Percent || 0,
              // sch2Amount: item.sch2Amount || 0,
              fQty: item.fQty || 0,
              DQty: item.DQty || 0,
              schPercent: item.schPercent || 0,
              schAmount: item.schAmount || 0,
              finalAmount: item.finalAmount || 0,
            },
          });
          await updateBatchStock(tx, item.batchId, item.aQty);
        }

        // 5. Create new history entries
        await createPurchaseHistory(
          tx,
          {
            id: existingInvoice.id,
            invoiceNo: invoiceNo || existingInvoice.invoiceNo,
            invoiceDate: invoiceDate
              ? new Date(invoiceDate)
              : existingInvoice.invoiceDate,
          },
          items,
          supplierId || existingInvoice.supplierId,
        );
      }
    });

    return sendResponse(
      res,
      true,
      { message: "Purchase invoice updated successfully" },
      "Update successful",
      statusType.OK,
    );
  } catch (error) {
    console.error("Update purchase error:", error);
    return sendResponse(
      res,
      false,
      null,
      "Failed to update purchase",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
});

// --------------------------------------------------------------------
// 5. DELETE PURCHASE INVOICE (soft delete & reverse stock)
// --------------------------------------------------------------------
export const deletePurchase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { id: parseInt(id), deleted: false },
    include: { items: true },
  });
  if (!invoice) {
    return sendResponse(
      res,
      false,
      null,
      "Purchase invoice not found",
      statusType.NOT_FOUND,
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Reverse stock
      for (const item of invoice.items) {
        if (item.batchId) {
          await updateBatchStock(tx, item.batchId, -item.aQty);
        }
      }

      // Soft delete invoice
      await tx.purchaseInvoice.update({
        where: { id: invoice.id },
        data: { deleted: true, status: "Cancelled" },
      });

      // Optionally: soft delete items? They are not soft-deleted, but cascade delete will remove them.
      // We keep history as is (audit log).
    });

    return sendResponse(
      res,
      true,
      { message: "Purchase invoice deleted successfully" },
      "Delete successful",
      statusType.OK,
    );
  } catch (error) {
    console.error("Delete purchase error:", error);
    return sendResponse(
      res,
      false,
      null,
      "Failed to delete purchase",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
});

// --------------------------------------------------------------------
// 6. GET ACTIVE PURCHASES (for dropdowns, etc.)
// --------------------------------------------------------------------
export const getActivePurchases = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const purchases = await prisma.purchaseInvoice.findMany({
    where: { deleted: false, status: { not: "Cancelled" } },
    select: {
      id: true,
      invoiceNo: true,
      invoiceDate: true,
      finalAmount: true,
      supplier: { select: { name: true } },
    },
    orderBy: { invoiceDate: "desc" },
    take: 100, // limit for dropdowns
  });

  return sendResponse(
    res,
    true,
    { purchases },
    "Active purchases retrieved",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 7. GET PURCHASE REPORT (with product group filter and custom total)
// --------------------------------------------------------------------
export const getPurchaseReport = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = '',
    supplierId,
    productGroupId,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Build WHERE clause for invoices
  const andConditions = [{ deleted: false }];

  if (invoiceNo) {
    andConditions.push({ invoiceNo: { contains: invoiceNo } });
  }

  if (supplierId) {
    andConditions.push({ supplierId: parseInt(supplierId) });
  }

  // Date range filter (both optional)
  if (fromDate || toDate) {
    const dateFilter = {};
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start.toISOString();
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end.toISOString();
    }
    andConditions.push({ invoiceDate: dateFilter });
  }

  // If productGroupId is provided, restrict invoices to those having at least one item from that group
  if (productGroupId) {
    andConditions.push({
      items: {
        some: {
          product: {
            productGroupId: parseInt(productGroupId),
          },
        },
      },
    });
  }

  const where = { AND: andConditions };

  // Include supplier details
  const include = {
    supplier: {
      select: {
        id: true,
        name: true,
        phoneNo: true,
        email: true,
        address: true,
      },
    },
  };

  // If productGroupId is provided, also include filtered items to compute custom total
  if (productGroupId) {
    include.items = {
      where: {
        product: {
          productGroupId: parseInt(productGroupId),
        },
      },
      select: {
        finalAmount: true,
      },
    };
  }

  // Fetch invoices
  const invoices = await prisma.purchaseInvoice.findMany({
    where,
    include,
    orderBy: { invoiceDate: 'desc' },
  });

  // Map to response format
  const reportData = invoices.map((invoice) => {
    let totalAmount = invoice.finalAmount; // default to invoice finalAmount

    if (productGroupId && invoice.items) {
      // Sum finalAmount of filtered items (items belonging to the product group)
      totalAmount = invoice.items.reduce(
        (sum, item) => sum + (item.finalAmount || 0),
        0
      );
    }

    return {
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate,
      supplier: invoice.supplier,
      totalAmount,
    };
  });

  return sendResponse(
    res,
    true,
    { report: reportData },
    'Purchase report generated successfully',
    statusType.OK
  );
});

// --------------------------------------------------------------------
// 8. GET PURCHASE SUMMARY REPORT FOR PDF (with product grouping and pagination)
// --------------------------------------------------------------------

export const getPurchaseSummaryReport_pdf_data = asyncHandler(
  async (req, res) => {
    const {
      fromDate,
      toDate,
      invoiceNo = "",
      supplierId,
      productGroupId,
      page = 1,
      limit = 10,
    } = req.query;

    const prisma = getPrismaOrFail(res);
    if (!prisma) return;

    const { page: validatedPage, limit: validatedLimit } = validatePagination(
      page,
      limit,
    );
    const skip = (validatedPage - 1) * validatedLimit;

    // 1. Build WHERE clause for invoices
    const andConditions = [{ deleted: false }];

    if (invoiceNo) andConditions.push({ invoiceNo: { contains: invoiceNo } });
    if (supplierId) andConditions.push({ supplierId: parseInt(supplierId) });
    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start.toISOString();
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end.toISOString();
      }
      andConditions.push({ invoiceDate: dateFilter });
    }
    if (productGroupId) {
      andConditions.push({
        items: {
          some: { product: { productGroupId: parseInt(productGroupId) } },
        },
      });
    }
    const where = { AND: andConditions };

    // 2. Get actual min and max invoice dates
    const dateRange = await prisma.purchaseInvoice.aggregate({
      where,
      _min: { invoiceDate: true },
      _max: { invoiceDate: true },
    });

    // 3. Get user shop_name
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { shop_name: true },
    });

    // 4. Invoice number range
    const invoiceRange = await prisma.purchaseInvoice.aggregate({
      where,
      _min: { invoiceNo: true },
      _max: { invoiceNo: true },
    });

    // 5. Distinct areas
    const suppliersWithAddress = await prisma.purchaseInvoice.findMany({
      where,
      select: { supplier: { select: { address: true } } },
      distinct: ["supplierId"],
    });
    const areas = [
      ...new Set(
        suppliersWithAddress
          .map((s) => s.supplier?.address?.split(",").pop()?.trim())
          .filter((city) => city && city.length > 0),
      ),
    ];

    // 6. Fetch all items with product and batch
    const items = await prisma.purchaseInvoiceItem.findMany({
      where: { purchaseInvoice: where },
      include: {
        product: {
          select: {
            id: true,
            productCode: true,
            description: true,
            unit: { select: { name: true } },
          },
        },
        batch: { select: { mrp: true } },
      },
    });

    // 7. Aggregate by productId
    const productMap = new Map();

    for (const item of items) {
      const pid = item.productId;
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          productCode: item.product.productCode,
          description: item.product.description,
          unitName: item.product.unit?.name || null,
          totalRate: 0,
          rateCount: 0,
          totalMrp: 0,
          mrpCount: 0,
          totalUnits: 0,
          totalMqty: 0,
          totalUnit: 0,
          totalFQty: 0,
          totalDQty: 0,
          totalFinalAmount: 0,
        });
      }
      const agg = productMap.get(pid);
      agg.totalRate += item.rate;
      agg.rateCount += 1;
      if (item.batch?.mrp) {
        agg.totalMrp += item.batch.mrp;
        agg.mrpCount += 1;
      }
      agg.totalUnits += item.aQty;
      agg.totalMqty += item.mQty || 0;
      agg.totalUnit += item.unit || 0;
      agg.totalFQty += item.fQty || 0;
      agg.totalDQty += item.DQty || 0;
      agg.totalFinalAmount += item.finalAmount || 0;
    }

    // 8. Convert map to array (all products)
    let allProducts = Array.from(productMap, ([, data]) => ({
      productCode: data.productCode,
      description: data.description,
      totalUnit: data.totalUnit,
      purchaseRate: data.rateCount > 0 ? data.totalRate / data.rateCount : 0,
      mrp: data.mrpCount > 0 ? data.totalMrp / data.mrpCount : 0,
      totalUnitsPurchased: data.totalUnits,
      totalMqty: data.totalMqty,
      fQty: data.totalFQty,
      dQty: data.totalDQty,
      finalAmount: data.totalFinalAmount,
    }));

    // 9. Compute totals for all products
    const totals = allProducts.reduce(
      (acc, product) => {
        acc.totalMqty += product.totalMqty;
        acc.totalUnit += product.totalUnit;
        acc.totalUnitsPurchased += product.totalUnitsPurchased;
        acc.fQty += product.fQty;
        acc.rep += 0; // REP is always 0 in current data model
        acc.dQty += product.dQty;
        acc.finalAmount += product.finalAmount;
        return acc;
      },
      {
        totalMqty: 0,
        totalUnit: 0,
        totalUnitsPurchased: 0,
        fQty: 0,
        rep: 0,
        dQty: 0,
        finalAmount: 0,
      },
    );

    // 10. Sort and paginate
    allProducts.sort((a, b) => a.productCode.localeCompare(b.productCode));
    const totalProducts = allProducts.length;
    const totalPages = Math.ceil(totalProducts / validatedLimit);
    const paginatedProducts = allProducts.slice(skip, skip + validatedLimit);

    // 11. Build response
    return sendResponse(
      res,
      true,
      {
        filters: {
          fromDate: fromDate || null,
          toDate: toDate || null,
          invoiceNo: invoiceNo || null,
          supplierId: supplierId ? parseInt(supplierId) : null,
          productGroupId: productGroupId ? parseInt(productGroupId) : null,
          page: validatedPage,
          limit: validatedLimit,
        },
        dateRange: {
          from: dateRange._min?.invoiceDate || null,
          to: dateRange._max?.invoiceDate || null,
        },
        user: { shop_name: user?.shop_name || null },
        invoiceRange: {
          start: invoiceRange._min?.invoiceNo || null,
          end: invoiceRange._max?.invoiceNo || null,
        },
        areas,
        products: paginatedProducts,
        totals, // <-- new totals field
        pagination: {
          total: totalProducts,
          totalPages,
          currentPage: validatedPage,
          limit: validatedLimit,
          hasNextPage: validatedPage < totalPages,
          hasPrevPage: validatedPage > 1,
        },
      },
      "Purchase summary report data retrieved successfully",
      statusType.OK,
    );
  },
);

// --------------------------------------------------------------------
// DOWNLOAD PURCHASE SUMMARY REPORT AS PDF (with history save)
// --------------------------------------------------------------------
export const downloadPurchaseSummaryReportPDF = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    supplierId,
    productGroupId,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;
  // console.log("hfoiwehofihoi")
  // 1. Build WHERE clause for invoices (same as preview, but no pagination)
  const andConditions = [{ deleted: false }];

  if (invoiceNo) andConditions.push({ invoiceNo: { contains: invoiceNo } });
  if (supplierId) andConditions.push({ supplierId: parseInt(supplierId) });
  if (fromDate || toDate) {
    const dateFilter = {};
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start.toISOString();
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end.toISOString();
    }
    andConditions.push({ invoiceDate: dateFilter });
  }
  if (productGroupId) {
    andConditions.push({
      items: {
        some: { product: { productGroupId: parseInt(productGroupId) } },
      },
    });
  }
  const where = { AND: andConditions };

  // 2. Get date ranges
  const dateRange = await prisma.purchaseInvoice.aggregate({
    where,
    _min: { invoiceDate: true },
    _max: { invoiceDate: true },
  });

  // 3. Get user shop_name
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { shop_name: true },
  });

  // 4. Invoice number range
  const invoiceRange = await prisma.purchaseInvoice.aggregate({
    where,
    _min: { invoiceNo: true },
    _max: { invoiceNo: true },
  });

  // 5. Distinct areas
  const suppliersWithAddress = await prisma.purchaseInvoice.findMany({
    where,
    select: { supplier: { select: { address: true } } },
    distinct: ["supplierId"],
  });
  const areas = [
    ...new Set(
      suppliersWithAddress
        .map((s) => s.supplier?.address?.split(",").pop()?.trim())
        .filter((city) => city && city.length > 0),
    ),
  ];

  // 6. Fetch all items with product and batch (no pagination)
  const items = await prisma.purchaseInvoiceItem.findMany({
    where: { purchaseInvoice: where },
    include: {
      product: {
        select: {
          id: true,
          productCode: true,
          description: true,
          unit: { select: { name: true } },
        },
      },
      batch: { select: { mrp: true } },
    },
  });

  // 7. Aggregate by productId
  const productMap = new Map();

  for (const item of items) {
    const pid = item.productId;
    if (!productMap.has(pid)) {
      productMap.set(pid, {
        productCode: item.product.productCode,
        description: item.product.description,
        unitName: item.product.unit?.name || null,
        totalRate: 0,
        rateCount: 0,
        totalMrp: 0,
        mrpCount: 0,
        totalUnits: 0,
        totalMqty: 0,
        totalUnit: 0,
        totalFQty: 0,
        totalDQty: 0,
        totalFinalAmount: 0,
      });
    }
    const agg = productMap.get(pid);
    agg.totalRate += item.rate;
    agg.rateCount += 1;
    if (item.batch?.mrp) {
      agg.totalMrp += item.batch.mrp;
      agg.mrpCount += 1;
    }
    agg.totalUnits += item.aQty;
    agg.totalMqty += item.mQty || 0;
    agg.totalUnit += item.unit || 0;
    agg.totalFQty += item.fQty || 0;
    agg.totalDQty += item.DQty || 0;
    agg.totalFinalAmount += item.finalAmount || 0;
  }

  // 8. Convert map to array (all products)
  let allProducts = Array.from(productMap, ([, data]) => ({
    productCode: data.productCode,
    description: data.description,
    totalUnit: data.totalUnit,
    purchaseRate: data.rateCount > 0 ? data.totalRate / data.rateCount : 0,
    mrp: data.mrpCount > 0 ? data.totalMrp / data.mrpCount : 0,
    totalUnitsPurchased: data.totalUnits,
    totalMqty: data.totalMqty,
    fQty: data.totalFQty,
    dQty: data.totalDQty,
    finalAmount: data.totalFinalAmount,
  }));

  // 9. Sort by product code
  allProducts.sort((a, b) => a.productCode.localeCompare(b.productCode));

  // 10. Compute totals for all products
  const totals = allProducts.reduce(
    (acc, product) => {
      acc.totalMqty += product.totalMqty;
      acc.totalUnit += product.totalUnit;
      acc.totalUnitsPurchased += product.totalUnitsPurchased;
      acc.fQty += product.fQty;
      acc.rep += 0; // REP is always 0
      acc.dQty += product.dQty;
      acc.finalAmount += product.finalAmount;
      return acc;
    },
    {
      totalMqty: 0,
      totalUnit: 0,
      totalUnitsPurchased: 0,
      fQty: 0,
      rep: 0,
      dQty: 0,
      finalAmount: 0,
    },
  );

  // 11. Prepare data object for template and history
  const reportData = {
    user: { shop_name: user?.shop_name || null },
    dateRange: {
      from: dateRange._min?.invoiceDate || null,
      to: dateRange._max?.invoiceDate || null,
    },
    invoiceRange: {
      start: invoiceRange._min?.invoiceNo || null,
      end: invoiceRange._max?.invoiceNo || null,
    },
    areas,
    products: allProducts,
    totals,
    filters: {
      fromDate: fromDate || null,
      toDate: toDate || null,
      invoiceNo: invoiceNo || null,
      supplierId: supplierId ? parseInt(supplierId) : null,
      productGroupId: productGroupId ? parseInt(productGroupId) : null,
    },
  };

  // 12. Render HTML using EJS
  // const ejs = require('ejs');
  // const path = require('path');
  const templateName = "purchaseSummaryReport.ejs"; // store this
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const templatePath = path.join(
    __dirname,
    "../../views/purchase",
    templateName,
  );

  // Helper function for date formatting (to match the preview modal)
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const html = await ejs.renderFile(templatePath, {
    ...reportData,
    formatDate,
  });

  // 13. Generate PDF with Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  // Footer template for page numbers and shop name (exactly like the modal)
  const footerTemplate = `
    <div style="font-size: 10px; width: 100%; display: flex; justify-content: space-between; padding: 0 20px; margin-top: 5px;">
      <span>${user?.shop_name || "Your Shop"}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;
  const headerTemplate = "<div></div>"; // empty header

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "0.5cm", bottom: "0.5cm", left: "0.2cm", right: "0.2cm" },
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
  });

  await browser.close();

  // 14. Save report history with template name
  await prisma.purchaseReportHistory.create({
    data: {
      userId: req.user.id,
      type: "pdf",
      template: templateName,
      data: JSON.stringify(reportData), // Prisma automatically converts to JSON
    },
  });

  // 15. Send PDF as response
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="purchase-summary-report.pdf"',
  );
  res.setHeader("Content-Length", pdfBuffer.length); // Add content length
  return res.end(pdfBuffer, "binary"); // Use res.end with binary encoding instead of res.send
});

export const downloadPurchaseSummaryReportExcel = asyncHandler(
  async (req, res) => {
    const {
      fromDate,
      toDate,
      invoiceNo = "",
      supplierId,
      productGroupId,
    } = req.query;

    const prisma = getPrismaOrFail(res);
    if (!prisma) return;

    // ----- Reuse the same data aggregation logic as PDF (steps 1-11) -----
    const andConditions = [{ deleted: false }];

    if (invoiceNo) andConditions.push({ invoiceNo: { contains: invoiceNo } });
    if (supplierId) andConditions.push({ supplierId: parseInt(supplierId) });
    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start.toISOString();
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end.toISOString();
      }
      andConditions.push({ invoiceDate: dateFilter });
    }
    if (productGroupId) {
      andConditions.push({
        items: {
          some: { product: { productGroupId: parseInt(productGroupId) } },
        },
      });
    }
    const where = { AND: andConditions };

    // 2. Get date ranges
    const dateRange = await prisma.purchaseInvoice.aggregate({
      where,
      _min: { invoiceDate: true },
      _max: { invoiceDate: true },
    });

    // 3. Get user shop_name
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { shop_name: true },
    });

    // 4. Invoice number range
    const invoiceRange = await prisma.purchaseInvoice.aggregate({
      where,
      _min: { invoiceNo: true },
      _max: { invoiceNo: true },
    });

    // 5. Distinct areas
    const suppliersWithAddress = await prisma.purchaseInvoice.findMany({
      where,
      select: { supplier: { select: { address: true } } },
      distinct: ["supplierId"],
    });
    const areas = [
      ...new Set(
        suppliersWithAddress
          .map((s) => s.supplier?.address?.split(",").pop()?.trim())
          .filter((city) => city && city.length > 0),
      ),
    ];

    // 6. Fetch all items with product and batch
    const items = await prisma.purchaseInvoiceItem.findMany({
      where: { purchaseInvoice: where },
      include: {
        product: {
          select: {
            id: true,
            productCode: true,
            description: true,
            unit: { select: { name: true } },
          },
        },
        batch: { select: { mrp: true } },
      },
    });

    // 7. Aggregate by productId
    const productMap = new Map();
    for (const item of items) {
      const pid = item.productId;
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          productCode: item.product.productCode,
          description: item.product.description,
          unitName: item.product.unit?.name || null,
          totalRate: 0,
          rateCount: 0,
          totalMrp: 0,
          mrpCount: 0,
          totalUnits: 0,
          totalMqty: 0,
          totalUnit: 0,
          totalFQty: 0,
          totalDQty: 0,
          totalFinalAmount: 0,
        });
      }
      const agg = productMap.get(pid);
      agg.totalRate += item.rate;
      agg.rateCount += 1;
      if (item.batch?.mrp) {
        agg.totalMrp += item.batch.mrp;
        agg.mrpCount += 1;
      }
      agg.totalUnits += item.aQty;
      agg.totalMqty += item.mQty || 0;
      agg.totalUnit += item.unit || 0;
      agg.totalFQty += item.fQty || 0;
      agg.totalDQty += item.DQty || 0;
      agg.totalFinalAmount += item.finalAmount || 0;
    }

    // 8. Convert map to array
    let allProducts = Array.from(productMap, ([, data]) => ({
      productCode: data.productCode,
      description: data.description,
      totalUnit: data.totalUnit,
      purchaseRate: data.rateCount > 0 ? data.totalRate / data.rateCount : 0,
      mrp: data.mrpCount > 0 ? data.totalMrp / data.mrpCount : 0,
      totalUnitsPurchased: data.totalUnits,
      totalMqty: data.totalMqty,
      fQty: data.totalFQty,
      dQty: data.totalDQty,
      finalAmount: data.totalFinalAmount,
    }));

    // 9. Sort by product code
    allProducts.sort((a, b) => a.productCode.localeCompare(b.productCode));

    // 10. Compute totals
    const totals = allProducts.reduce(
      (acc, product) => {
        acc.totalMqty += product.totalMqty;
        acc.totalUnit += product.totalUnit;
        acc.totalUnitsPurchased += product.totalUnitsPurchased;
        acc.fQty += product.fQty;
        acc.rep += 0;
        acc.dQty += product.dQty;
        acc.finalAmount += product.finalAmount;
        return acc;
      },
      {
        totalMqty: 0,
        totalUnit: 0,
        totalUnitsPurchased: 0,
        fQty: 0,
        rep: 0,
        dQty: 0,
        finalAmount: 0,
      },
    );

    // 11. Prepare data object (same as PDF but no pagination)
    const reportData = {
      user: { shop_name: user?.shop_name || null },
      dateRange: {
        from: dateRange._min?.invoiceDate || null,
        to: dateRange._max?.invoiceDate || null,
      },
      invoiceRange: {
        start: invoiceRange._min?.invoiceNo || null,
        end: invoiceRange._max?.invoiceNo || null,
      },
      areas,
      products: allProducts,
      totals,
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        invoiceNo: invoiceNo || null,
        supplierId: supplierId ? parseInt(supplierId) : null,
        productGroupId: productGroupId ? parseInt(productGroupId) : null,
      },
    };
    // ----- End of data aggregation -----

    // ----- Generate Excel -----
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Purchase Summary");

    // Helper to format dates
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      try {
        return new Date(dateStr).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } catch {
        return "";
      }
    };

    // Title
    worksheet.mergeCells("A1:L1");
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = "Purchase Summary Report";
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.getCell(1).alignment = { horizontal: "center" };

    // Shop name & date range
    worksheet.mergeCells("A2:L2");
    worksheet.getRow(2).getCell(1).value =
      `Shop: ${reportData.user.shop_name || "Your Shop"} | Date: ${formatDate(reportData.dateRange.from)} to ${formatDate(reportData.dateRange.to)}`;
    worksheet.getRow(2).getCell(1).alignment = { horizontal: "center" };

    // Filter details
    worksheet.addRow([]);
    worksheet.addRow([
      `INVOICE: ${reportData.invoiceRange.start || "—"} to ${reportData.invoiceRange.end || "—"}`,
    ]);
    worksheet.addRow([
      `AREA: ${reportData.areas.length ? reportData.areas.join(", ") : "All"}`,
    ]);
    worksheet.addRow([]);

    // Table headers
    const headers = [
      "Sr.",
      "P.Code",
      "Description",
      "MRP",
      "BOX",
      "UNIT",
      "QTY",
      "FR",
      "REP",
      "DMG",
      "RATE",
      "AMT",
    ];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center" };
    });

    // Data rows
    reportData.products.forEach((product, index) => {
      const row = worksheet.addRow([
        index + 1,
        product.productCode,
        product.description ? product.description : "No description",
        product.mrp.toFixed(2),
        product.totalMqty,
        product.totalUnit,
        product.totalUnitsPurchased,
        product.fQty,
        0, // REP
        product.dQty,
        product.purchaseRate.toFixed(2),
        product.finalAmount.toFixed(2),
      ]);

      // Align numeric columns right
      [4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((colIndex) => {
        const cell = row.getCell(colIndex);
        cell.alignment = { horizontal: "right" };
        cell.numFmt = "#,##0.00";
      });

      // Add thin borders to all cells in this row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Totals row
    if (reportData.totals) {
      const totalRow = worksheet.addRow([
        `Total ${reportData.products.length} products`,
        "",
        "",
        "",
        reportData.totals.totalMqty,
        reportData.totals.totalUnit,
        reportData.totals.totalUnitsPurchased,
        reportData.totals.fQty,
        reportData.totals.rep,
        reportData.totals.dQty,
        "",
        reportData.totals.finalAmount.toFixed(2),
      ]);

      totalRow.font = { bold: true };
      totalRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        if ([5, 6, 7, 8, 9, 10, 12].includes(colNumber)) {
          cell.alignment = { horizontal: "right" };
          if (colNumber === 12) cell.numFmt = "#,##0.00";
        } else {
          cell.alignment = { horizontal: "left" };
        }
      });
      // Merge first four cells for the label
      worksheet.mergeCells(`A${totalRow.number}:D${totalRow.number}`);
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength + 2, 20); // cap at 30
    });

    // ----- Save history -----
    await prisma.purchaseReportHistory.create({
      data: {
        userId: req.user.id,
        type: "excel",
        template: "purchaseSummaryReport.xlsx", // or just a descriptive string
        data: JSON.stringify(reportData),
      },
    });

    // ----- Send Excel file -----
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="purchase-summary-report.xlsx"',
    );

    await workbook.xlsx.write(res);
    res.end();
  },
);

// --------------------------------------------------------------------
// 9. GET PURCHASE REGISTER PDF DATA
// --------------------------------------------------------------------
export const getPurchaseRegisterPDFData = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    supplierId,
    page = 1,
    limit = 10,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const { page: validatedPage, limit: validatedLimit } = validatePagination(
    page,
    limit,
  );
  const skip = (validatedPage - 1) * validatedLimit;

  // 1. Build WHERE clause for invoices
  const andConditions = [{ deleted: false }];

  if (invoiceNo) andConditions.push({ invoiceNo: { contains: invoiceNo } });
  if (supplierId) andConditions.push({ supplierId: parseInt(supplierId) });
  if (fromDate || toDate) {
    const dateFilter = {};
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start.toISOString();
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end.toISOString();
    }
    andConditions.push({ invoiceDate: dateFilter });
  }

  const where = { AND: andConditions };

  // 2. Get actual min and max invoice dates
  const dateRange = await prisma.purchaseInvoice.aggregate({
    where,
    _min: { invoiceDate: true },
    _max: { invoiceDate: true },
  });

  // 3. Get user shop_name
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { shop_name: true },
  });

  // 4. Invoice number range
  const invoiceRange = await prisma.purchaseInvoice.aggregate({
    where,
    _min: { invoiceNo: true },
    _max: { invoiceNo: true },
  });

  // 5. Distinct areas (from supplier addresses)
  const suppliersWithAddress = await prisma.purchaseInvoice.findMany({
    where,
    select: { supplier: { select: { address: true } } },
    distinct: ["supplierId"],
  });
  const areas = [
    ...new Set(
      suppliersWithAddress
        .map((s) => s.supplier?.address?.split(",").pop()?.trim())
        .filter((city) => city && city.length > 0),
    ),
  ];

  // 6. Get paginated invoices with supplier name
  const invoices = await prisma.purchaseInvoice.findMany({
    where,
    skip,
    take: validatedLimit,
    orderBy: { invoiceDate: "desc" },
    select: {
      invoiceNo: true,
      invoiceDate: true,
      finalAmount: true,
      supplier: {
        select: { name: true },
      },
    },
  });

  // 7. Compute total finalAmount for all filtered invoices (overall total)
  const totalAggregate = await prisma.purchaseInvoice.aggregate({
    where,
    _sum: { finalAmount: true },
    _count: true,
  });
  const overallTotalAmount = totalAggregate._sum.finalAmount || 0;
  const totalInvoices = totalAggregate._count;

  // 8. Format response data
  const formattedInvoices = invoices.map((inv) => ({
    invoiceNo: inv.invoiceNo,
    invoiceDate: inv.invoiceDate,
    supplierName: inv.supplier.name,
    amount: inv.finalAmount,
    cash: "", // always empty
    cheque: "", // always empty
    balance: inv.finalAmount, // same as amount
  }));

  const totalPages = Math.ceil(totalInvoices / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        invoiceNo: invoiceNo || null,
        supplierId: supplierId ? parseInt(supplierId) : null,
        page: validatedPage,
        limit: validatedLimit,
      },
      dateRange: {
        from: dateRange._min?.invoiceDate || null,
        to: dateRange._max?.invoiceDate || null,
      },
      user: { shop_name: user?.shop_name || null },
      invoiceRange: {
        start: invoiceRange._min?.invoiceNo || null,
        end: invoiceRange._max?.invoiceNo || null,
      },
      areas,
      invoices: formattedInvoices,
      totals: {
        totalAmount: overallTotalAmount,
        totalInvoices,
      },
      pagination: {
        total: totalInvoices,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Purchase register data retrieved successfully",
    statusType.OK,
  );
});
// --------------------------------------------------------------------
// Export all functions as a controller object (like areaController)
// --------------------------------------------------------------------
export const purchaseController = {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getActivePurchases,
  getPurchaseReport,
  getPurchaseSummaryReport_pdf_data, // new function
  downloadPurchaseSummaryReportPDF,
  downloadPurchaseSummaryReportExcel,
  getPurchaseRegisterPDFData,
};
