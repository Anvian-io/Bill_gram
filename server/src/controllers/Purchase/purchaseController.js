import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../../utils/index.js";
import { createNotification } from "../../utils/notificationHelper.js";
import ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ExcelJS from "exceljs";
import { formatDateForFilename } from "../../helper/commonHelper.js";
import { appendSelectedIdsCondition } from "../../utils/reportQueryHelpers.js";
import {
  appendGstDetailsCondition,
  getGstDetailsFilterValue,
  normalizeGstDetails,
} from "../../utils/gstDetailsFilter.js";
import { groupByMonth } from "./purchaseHelper.js";
import QRCode from "qrcode";
import { launchPdfBrowser } from "../../utils/pdfBrowser.js";

const GST_DETAILS_LABELS = {
  0: "Both",
  1: "With GST",
  2: "Without GST",
};

const getGstDetailsLabel = (value) =>
  GST_DETAILS_LABELS[normalizeGstDetails(value)] || GST_DETAILS_LABELS[1];
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
  const isReturn = status === "Return";

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

  // Verify invoice number uniqueness when provided at creation
  if (invoiceNo && String(invoiceNo).trim()) {
    const trimmedInvoiceNo = String(invoiceNo).trim();
    const existingInvoice = await prisma.purchaseInvoice.findFirst({
      where: { invoiceNo: trimmedInvoiceNo, deleted: false },
    });
    if (existingInvoice) {
      return sendResponse(
        res,
        false,
        null,
        "Invoice number already exists",
        statusType.CONFLICT,
      );
    }
  }

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
    if (isReturn && batch.openingStock < item.aQty) {
      return sendResponse(
        res,
        false,
        null,
        `Insufficient stock for purchase return batch ${item.batchId}. Available: ${batch.openingStock}`,
        statusType.BAD_REQUEST,
      );
    }
  }

  // --- Transaction ---
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create invoice
      const invoice = await tx.purchaseInvoice.create({
        data: {
          invoiceNo: invoiceNo?.trim() || null,
          invoiceDate: new Date(invoiceDate),
          supplierId,
          gstDetails: normalizeGstDetails(gstDetails),
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

        await updateBatchStock(tx, item.batchId, isReturn ? -item.aQty : item.aQty);
      }

      // 3. Create purchase history entries
      await createPurchaseHistory(tx, invoice, items, supplierId);

      return invoice;
    });

    const trimmedInvoiceNo = invoiceNo?.trim();
    let updated;

    if (trimmedInvoiceNo) {
      updated = await prisma.purchaseInvoice.findUnique({
        where: { id: result.id },
      });
    } else {
      const paddedId = result.id.toString().padStart(4, "0");
      const invoicePrefix = isReturn ? "PRET" : "INV";

      updated = await prisma.purchaseInvoice.update({
        where: { id: result.id },
        data: { invoiceNo: `${invoicePrefix}-${paddedId}` },
      });
    }
    await createNotification({
  title: isReturn ? "New Purchase Return Created" : "New Purchase Invoice Created",
  message: `${isReturn ? "Purchase return" : "Purchase invoice"} "${updated.invoiceNo}" has been created by ${req.user?.username || 'Admin'}`,
  type: "success",
  section: null,
  page: "Purchase"
}, res);
    return sendResponse(
      res,
      true,
      { purchase: updated },
      isReturn ? "Purchase return created successfully" : "Purchase invoice created successfully",
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

export const createPurchaseReturn = asyncHandler(async (req, res, next) => {
  req.body = { ...req.body, status: "Return" };
  return createPurchase(req, res, next);
});

// --------------------------------------------------------------------
// CHECK PURCHASE INVOICE NUMBER UNIQUENESS
// --------------------------------------------------------------------
export const checkPurchaseInvoiceNumber = asyncHandler(async (req, res) => {
  const { invoiceNo } = req.query;
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  if (!invoiceNo || !String(invoiceNo).trim()) {
    return sendResponse(
      res,
      true,
      { available: true },
      "Invoice number is available",
      statusType.OK,
    );
  }

  const existing = await prisma.purchaseInvoice.findFirst({
    where: { invoiceNo: String(invoiceNo).trim(), deleted: false },
  });

  return sendResponse(
    res,
    true,
    { available: !existing },
    existing ? "Invoice number already exists" : "Invoice number is available",
    statusType.OK,
  );
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
    gstDetails,
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
  appendGstDetailsCondition(andConditions, gstDetails);

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

  if (status && status !== "all") {
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
            gstDetails !== undefined
              ? normalizeGstDetails(gstDetails)
              : existingInvoice.gstDetails,
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
    await createNotification({
  title: "Purchase Invoice Updated",
  message: `Purchase invoice "${existingInvoice.invoiceNo}" has been updated by ${req.user?.username || 'Admin'}`,
  type: "info",
  section: null,
  page: "Purchase"
}, res);
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
    await createNotification({
  title: "Purchase Invoice Deleted",
  message: `Purchase invoice "${invoice.invoiceNo}" has been deleted by ${req.user?.username || 'Admin'}`,
  type: "warning",
  section: null,
  page: "Purchase"
}, res);
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
    invoiceNo = "",
    supplierId,
    gstDetails,
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
  appendGstDetailsCondition(andConditions, gstDetails);

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
    orderBy: { invoiceDate: "desc" },
  });

  // Map to response format
  const reportData = invoices.map((invoice) => {
    let totalAmount = invoice.finalAmount; // default to invoice finalAmount

    if (productGroupId && invoice.items) {
      // Sum finalAmount of filtered items (items belonging to the product group)
      totalAmount = invoice.items.reduce(
        (sum, item) => sum + (item.finalAmount || 0),
        0,
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
    "Purchase report generated successfully",
    statusType.OK,
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
      gstDetails,
      productGroupId,
      page = 1,
      limit = 10,
      selectedIds,
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
    const normalizedGstDetails = appendGstDetailsCondition(
      andConditions,
      gstDetails,
    );
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
    appendSelectedIdsCondition(andConditions, selectedIds);
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
          gstDetails: normalizedGstDetails,
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
export const downloadPurchaseSummaryReportPDF = asyncHandler(
  async (req, res) => {
    const {
      fromDate,
      toDate,
      invoiceNo = "",
      supplierId,
      gstDetails,
      productGroupId,
      selectedIds,
    } = req.query;

    const prisma = getPrismaOrFail(res);
    if (!prisma) return;
    // console.log("hfoiwehofihoi")
    // 1. Build WHERE clause for invoices (same as preview, but no pagination)
    const andConditions = [{ deleted: false }];

    if (invoiceNo) andConditions.push({ invoiceNo: { contains: invoiceNo } });
    if (supplierId) andConditions.push({ supplierId: parseInt(supplierId) });
    const normalizedGstDetails = appendGstDetailsCondition(
      andConditions,
      gstDetails,
    );
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
    appendSelectedIdsCondition(andConditions, selectedIds);
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
        gstDetails: normalizedGstDetails,
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
    const browser = await launchPdfBrowser(puppeteer);
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
 
    const fromStr = formatDateForFilename(reportData.dateRange.from);
    const toStr = formatDateForFilename(reportData.dateRange.to);
    const pdfFileName = `purchase-summary-${fromStr}_to_${toStr}.pdf`;
    console.log(pdfFileName,"fioewhiofh")
    // 14. Save report history with template name
    await prisma.purchaseReportHistory.create({
      data: {
        userId: req.user.id,
        type: "pdf",
        template: templateName,
        fileName: pdfFileName, // <-- new field
        data: JSON.stringify(reportData), // Prisma automatically converts to JSON
      },
    });

    // 15. Send PDF as response
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdfFileName}"`,
    );
    res.setHeader("Content-Length", pdfBuffer.length); // Add content length
    return res.end(pdfBuffer, "binary"); // Use res.end with binary encoding instead of res.send
  },
);

export const downloadPurchaseSummaryReportExcel = asyncHandler(
  async (req, res) => {
    const {
      fromDate,
      toDate,
      invoiceNo = "",
      supplierId,
      gstDetails,
      productGroupId,
      selectedIds,
    } = req.query;

    const prisma = getPrismaOrFail(res);
    if (!prisma) return;

    // ----- Reuse the same data aggregation logic as PDF (steps 1-11) -----
    const andConditions = [{ deleted: false }];

    if (invoiceNo) andConditions.push({ invoiceNo: { contains: invoiceNo } });
    if (supplierId) andConditions.push({ supplierId: parseInt(supplierId) });
    const normalizedGstDetails = appendGstDetailsCondition(
      andConditions,
      gstDetails,
    );
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
    appendSelectedIdsCondition(andConditions, selectedIds);
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
        gstDetails: normalizedGstDetails,
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
    titleRow.getCell(1).alignment = { horizontal: "left" };

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

    const fromStr = formatDateForFilename(reportData.dateRange.from);
    const toStr = formatDateForFilename(reportData.dateRange.to);
    const excelFileName = `purchase-summary-${fromStr}_to_${toStr}.xlsx`;

    // ----- Save history -----
    await prisma.purchaseReportHistory.create({
      data: {
        userId: req.user.id,
        type: "excel",
        template: "purchaseSummaryReport.xlsx", // or just a descriptive string
        fileName: excelFileName, // <-- new field
        data: JSON.stringify(reportData),
      },
    });

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // ----- Send Excel file -----
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${excelFileName}"`,
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
    gstDetails,
    page = 1,
    limit = 10,
    selectedIds,
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
  const normalizedGstDetails = appendGstDetailsCondition(
    andConditions,
    gstDetails,
  );
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

  appendSelectedIdsCondition(andConditions, selectedIds);
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
        gstDetails: normalizedGstDetails,
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
// 10. GET ALL PURCHASE REPORT HISTORY (with filters & pagination)
// --------------------------------------------------------------------
export const getAllPurchaseReportHistory = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    fileName = "",
    type, // "pdf" or "excel"
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

  // Filter by userId (if you want only current user's history)
  // andConditions.push({ userId: req.user.id });

  if (fileName) {
    andConditions.push({ fileName: { contains: fileName } });
  }

  if (type) {
    andConditions.push({ type });
  }

  // Global search: fileName, template
  if (search) {
    andConditions.push({
      OR: [
        { fileName: { contains: search } },
        { template: { contains: search } },
      ],
    });
  }

  const where = andConditions.length ? { AND: andConditions } : {};

  // Sorting
  const validSortFields = ["fileName", "type", "createdAt"];
  const orderBy = {
    [validSortFields.includes(sortBy) ? sortBy : "createdAt"]:
      sortOrder === "asc" ? "asc" : "desc",
  };

  // Fetch records
  const [histories, total] = await Promise.all([
    prisma.purchaseReportHistory.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      include: {
        user: { select: { id: true, username: true, shop_name: true } },
      },
    }),
    prisma.purchaseReportHistory.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      histories,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Purchase report history retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 11. DOWNLOAD PURCHASE REPORT HISTORY AS PDF (by history id)
// --------------------------------------------------------------------
export const downloadPurchaseReportHistoryPDF = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    const prisma = getPrismaOrFail(res);
    if (!prisma) return;

    // Fetch history record
    const history = await prisma.purchaseReportHistory.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { shop_name: true } } },
    });

    if (!history) {
      return sendResponse(
        res,
        false,
        null,
        "Report history not found",
        statusType.NOT_FOUND,
      );
    }

    // Parse stored data
    let reportData;
    try {
      reportData = JSON.parse(history.data);
    } catch (error) {
      console.error("Failed to parse report data:", error);
      return sendResponse(
        res,
        false,
        null,
        "Invalid report data",
        statusType.INTERNAL_SERVER_ERROR,
      );
    }

    // Reuse the same template that was originally used
    const templateName = history.template; // e.g. "purchaseSummaryReport.ejs"
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const templatePath = path.join(
      __dirname,
      "../../views/purchase",
      templateName,
    );

    // Helper for date formatting (same as in original PDF function)
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

    // Render HTML
    const html = await ejs.renderFile(templatePath, {
      ...reportData,
      formatDate,
    });

    // Generate PDF
    const browser = await launchPdfBrowser(puppeteer);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const footerTemplate = `
      <div style="font-size: 10px; width: 100%; display: flex; justify-content: space-between; padding: 0 20px; margin-top: 5px;">
        <span>${reportData.user?.shop_name || "Your Shop"}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
    const headerTemplate = "<div></div>";

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0.5cm", bottom: "0.5cm", left: "0.2cm", right: "0.2cm" },
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
    });

    await browser.close();

    // Use stored filename or generate a new one
    const pdfFileName = history.fileName || `report-${history.id}.pdf`;

    // Send PDF
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.end(pdfBuffer, "binary");
  },
);

// --------------------------------------------------------------------
// 12. DOWNLOAD PURCHASE REPORT HISTORY AS EXCEL (by history id)
// --------------------------------------------------------------------
export const downloadPurchaseReportHistoryExcel = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    const prisma = getPrismaOrFail(res);
    if (!prisma) return;

    const history = await prisma.purchaseReportHistory.findUnique({
      where: { id: parseInt(id) },
    });

    if (!history) {
      return sendResponse(
        res,
        false,
        null,
        "Report history not found",
        statusType.NOT_FOUND,
      );
    }

    let reportData;
    try {
      reportData = JSON.parse(history.data);
    } catch (error) {
      console.error("Failed to parse report data:", error);
      return sendResponse(
        res,
        false,
        null,
        "Invalid report data",
        statusType.INTERNAL_SERVER_ERROR,
      );
    }

    // Rebuild Excel exactly as in downloadPurchaseSummaryReportExcel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Purchase Summary");

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
    titleRow.getCell(1).alignment = { horizontal: "left" };

    // Shop name & date range
    worksheet.mergeCells("A2:L2");
    worksheet.getRow(2).getCell(1).value =
      `Shop: ${reportData.user?.shop_name || "Your Shop"} | Date: ${formatDate(reportData.dateRange?.from)} to ${formatDate(reportData.dateRange?.to)}`;
    worksheet.getRow(2).getCell(1).alignment = { horizontal: "center" };

    // Filter details
    worksheet.addRow([]);
    worksheet.addRow([
      `INVOICE: ${reportData.invoiceRange?.start || "—"} to ${reportData.invoiceRange?.end || "—"}`,
    ]);
    worksheet.addRow([
      `AREA: ${reportData.areas?.length ? reportData.areas.join(", ") : "All"}`,
    ]);
    worksheet.addRow([]);

    // Headers
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
    reportData.products?.forEach((product, index) => {
      const row = worksheet.addRow([
        index + 1,
        product.productCode,
        product.description || "No description",
        (product.mrp || 0).toFixed(2),
        product.totalMqty || 0,
        product.totalUnit || 0,
        product.totalUnitsPurchased || 0,
        product.fQty || 0,
        0, // REP
        product.dQty || 0,
        (product.purchaseRate || 0).toFixed(2),
        (product.finalAmount || 0).toFixed(2),
      ]);

      [4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((colIndex) => {
        const cell = row.getCell(colIndex);
        cell.alignment = { horizontal: "right" };
        cell.numFmt = "#,##0.00";
      });

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
        `Total ${reportData.products?.length || 0} products`,
        "",
        "",
        "",
        reportData.totals.totalMqty || 0,
        reportData.totals.totalUnit || 0,
        reportData.totals.totalUnitsPurchased || 0,
        reportData.totals.fQty || 0,
        reportData.totals.rep || 0,
        reportData.totals.dQty || 0,
        "",
        (reportData.totals.finalAmount || 0).toFixed(2),
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
      worksheet.mergeCells(`A${totalRow.number}:D${totalRow.number}`);
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength + 2, 20);
    });

    const excelFileName = history.fileName || `report-${history.id}.xlsx`;

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${excelFileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  },
);

// --------------------------------------------------------------------
// GET PURCHASE WITH GST DETAILS (for GST reporting/returns)
// --------------------------------------------------------------------
export const getPurchaseWithGST = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    supplierId,
    gstDetails,
    fromDate,
    toDate,
    sortBy = "invoiceDate",
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
  const andConditions = [{ deleted: false }]; // always exclude deleted records

  if (supplierId) {
    andConditions.push({ supplierId: parseInt(supplierId) });
  }
  appendGstDetailsCondition(andConditions, gstDetails);

  // Date range filter
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
    [validSortFields.includes(sortBy) ? sortBy : "invoiceDate"]:
      sortOrder === "asc" ? "asc" : "desc",
  };

  // Fetch invoices with items for GST calculation
  const [invoices, total] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phoneNo: true,
            email: true,
            address: true,
            gstIN: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                description: true,
                hsnSacCode: true,
                gstRate: true,
                gstInclusive: true,
                cessRate: true,
              },
            },
            batch: {
              select: {
                id: true,
                batchNo: true,
                mrp: true,
                basicPrice: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            shop_name: true,
            company_name: true,
            // GSTIN will be added here when user model is updated
          },
        },
      },
    }),
    prisma.purchaseInvoice.count({ where }),
  ]);

  // Transform data to GST format (unchanged)
  const gstPurchases = invoices.map((invoice) => {
    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalCess = 0;
    let totalGSTAmount = 0;
    let totalSchemeAmount = 0;
    let totalDiscountAmount = 0;
    let totalDamageAmount = 0;

    const itemDetails = invoice.items.map((item) => {
      const taxableValue = item.rate * item.aQty;
      const gstRate = item.product?.gstRate || 18;
      const cessRate = item.product?.cessRate || 0;
      const gstInclusive = item.product?.gstInclusive ?? true;

      let itemTaxableValue = taxableValue;
      let itemGSTAmount = item.taxAmount || (taxableValue * gstRate) / 100;
      let itemCGST = 0;
      let itemSGST = 0;
      let itemIGST = 0;
      let itemCess = (taxableValue * cessRate) / 100;

      if (gstInclusive) {
        itemTaxableValue = taxableValue - itemGSTAmount;
      }

      itemCGST = itemGSTAmount / 2;
      itemSGST = itemGSTAmount / 2;

      totalTaxableValue += itemTaxableValue;
      totalCGST += itemCGST;
      totalSGST += itemSGST;
      totalCess += itemCess;
      totalGSTAmount += itemGSTAmount;
      totalSchemeAmount += item.schAmount || 0;
      totalDiscountAmount +=
        (item.rate * item.aQty * (invoice.discountPercent || 0)) / 100;
      totalDamageAmount += (item.DQty || 0) * item.rate;

      return {
        itemId: item.id,
        productId: item.productId,
        productCode: item.product?.productCode,
        description: item.product?.description,
        hsnSacCode: item.product?.hsnSacCode,
        gstRate: gstRate,
        cessRate: cessRate,
        quantity: item.aQty,
        unit: item.unit,
        rate: item.rate,
        taxableValue: itemTaxableValue,
        cgstAmount: itemCGST,
        sgstAmount: itemSGST,
        igstAmount: itemIGST,
        cessAmount: itemCess,
        totalGST: itemGSTAmount,
        schemeAmount: item.schAmount || 0,
        schemePercent: item.schPercent || 0,
        freeQuantity: item.fQty || 0,
        damagedQuantity: item.DQty || 0,
        finalAmount: item.finalAmount || 0,
      };
    });

    return {
      purchaseId: invoice.id,
      invoiceId: invoice.invoiceNo,
      customerName: invoice.supplier?.name || "",
      gstin: invoice.supplier?.gstIN || "",
      invoiceDate: invoice.invoiceDate,
      refInvoiceId: "",
      refDate: null,
      grossAmount: invoice.grossAmount || totalTaxableValue + totalGSTAmount,
      schemeAmount: totalSchemeAmount || invoice.scheme1 || 0,
      discountAmount:
        (invoice.finalAmount * (invoice.discountPercent || 0)) / 100,
      damageAmount: totalDamageAmount,
      finalAmount: invoice.finalAmount,
      taxableValue: totalTaxableValue,
      cgstAmount: totalCGST,
      sgstAmount: totalSGST,
      igstAmount: totalIGST,
      cessAmount: totalCess || invoice.cessInsurance || 0,
      totalGSTAmount: totalGSTAmount,
      cess: invoice.cessInsurance || 0,
      addAmount: invoice.amountAdd || 0,
      creditAmount: invoice.creditAmount || 0,
      boxUnit: invoice.boxUnit || 0,
      remarks: invoice.remarks || "",
      status: invoice.status,
      supplierDetails: invoice.supplier,
      userDetails: {
        shopName: invoice.user?.shop_name,
        companyName: invoice.user?.company_name,
      },
      items: itemDetails,
      itemCount: itemDetails.length,
    };
  });

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      purchases: gstPurchases,
      summary: {
        totalRecords: total,
        totalGrossAmount: gstPurchases.reduce(
          (sum, p) => sum + p.grossAmount,
          0,
        ),
        totalSchemeAmount: gstPurchases.reduce(
          (sum, p) => sum + p.schemeAmount,
          0,
        ),
        totalDiscountAmount: gstPurchases.reduce(
          (sum, p) => sum + p.discountAmount,
          0,
        ),
        totalDamageAmount: gstPurchases.reduce(
          (sum, p) => sum + p.damageAmount,
          0,
        ),
        totalTaxableValue: gstPurchases.reduce(
          (sum, p) => sum + p.taxableValue,
          0,
        ),
        totalCGST: gstPurchases.reduce((sum, p) => sum + p.cgstAmount, 0),
        totalSGST: gstPurchases.reduce((sum, p) => sum + p.sgstAmount, 0),
        totalIGST: gstPurchases.reduce((sum, p) => sum + p.igstAmount, 0),
        totalCess: gstPurchases.reduce((sum, p) => sum + p.cessAmount, 0),
        totalFinalAmount: gstPurchases.reduce(
          (sum, p) => sum + p.finalAmount,
          0,
        ),
      },
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Purchase GST data retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// GET PURCHASE B2B REPORT (supplier-wise)
// --------------------------------------------------------------------
export const getPurchaseB2B = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    supplierId,
    gstDetails,
    fromDate,
    toDate,
    sortBy = "invoiceDate",
    sortOrder = "desc",
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const { page: validatedPage, limit: validatedLimit } = validatePagination(
    page,
    limit,
  );
  const skip = (validatedPage - 1) * validatedLimit;

  const andConditions = [{ deleted: false }];
  if (supplierId) {
    andConditions.push({ supplierId: parseInt(supplierId) });
  }
  appendGstDetailsCondition(andConditions, gstDetails);
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
  const validSortFields = [
    "invoiceNo",
    "invoiceDate",
    "finalAmount",
    "grossAmount",
    "createdAt",
    "updatedAt",
  ];
  const orderBy = {
    [validSortFields.includes(sortBy) ? sortBy : "invoiceDate"]:
      sortOrder === "asc" ? "asc" : "desc",
  };

  const [invoices, total] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            gstIN: true,
            address: true,
          },
        },
        items: {
          select: {
            id: true,
            rate: true,
            aQty: true,
            taxRate: true,
            taxAmount: true,
            product: {
              select: {
                gstRate: true,
                cessRate: true,
              },
            },
          },
        },
      },
    }),
    prisma.purchaseInvoice.count({ where }),
  ]);

  const numberOrZero = (value) => (Number.isFinite(value) ? value : 0);
  const rows = invoices.flatMap((invoice) =>
    invoice.items.map((item) => {
      const gstRate = numberOrZero(item.taxRate) || numberOrZero(item.product?.gstRate);
      const taxable = numberOrZero(item.rate) * numberOrZero(item.aQty);
      const taxValue = numberOrZero(item.taxAmount) || (taxable * gstRate) / 100;
      const cessValue = taxable * (numberOrZero(item.product?.cessRate) / 100);

      return {
        id: `${invoice.id}-${item.id}`,
        party: invoice.supplier?.name || "",
        gstinNumber: invoice.supplier?.gstIN || "",
        invoiceNo: invoice.invoiceNo || "",
        invoiceDate: invoice.invoiceDate,
        place: invoice.supplier?.address || "",
        invoiceType: getGstDetailsLabel(invoice.gstDetails),
        finalAmount: numberOrZero(invoice.finalAmount),
        rate: gstRate,
        taxable,
        taxValue,
        cess: numberOrZero(invoice.cessInsurance) || cessValue,
        addCess: 0,
        apmc: 0,
      };
    }),
  );

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      rows,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Purchase B2B data retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// DOWNLOAD PURCHASE B2B REPORT AS EXCEL
// --------------------------------------------------------------------
export const downloadPurchaseB2BExcel = asyncHandler(async (req, res) => {
  const {
    supplierId,
    gstDetails,
    fromDate,
    toDate,
    sortBy = "invoiceDate",
    sortOrder = "desc",
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const andConditions = [{ deleted: false }];
  if (supplierId) {
    andConditions.push({ supplierId: parseInt(supplierId) });
  }
  const normalizedGstDetails = appendGstDetailsCondition(
    andConditions,
    gstDetails,
  );
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
  const validSortFields = [
    "invoiceNo",
    "invoiceDate",
    "finalAmount",
    "grossAmount",
    "createdAt",
    "updatedAt",
  ];
  const orderBy = {
    [validSortFields.includes(sortBy) ? sortBy : "invoiceDate"]:
      sortOrder === "asc" ? "asc" : "desc",
  };

  const invoices = await prisma.purchaseInvoice.findMany({
    where,
    orderBy,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          gstIN: true,
          address: true,
        },
      },
      items: {
        select: {
          id: true,
          rate: true,
          aQty: true,
          taxRate: true,
          taxAmount: true,
          product: {
            select: {
              gstRate: true,
              cessRate: true,
            },
          },
        },
      },
    },
  });

  const numberOrZero = (value) => (Number.isFinite(value) ? value : 0);
  const rows = invoices.flatMap((invoice) =>
    invoice.items.map((item) => {
      const gstRate = numberOrZero(item.taxRate) || numberOrZero(item.product?.gstRate);
      const taxable = numberOrZero(item.rate) * numberOrZero(item.aQty);
      const taxValue = numberOrZero(item.taxAmount) || (taxable * gstRate) / 100;
      const cessValue = taxable * (numberOrZero(item.product?.cessRate) / 100);

      return {
        party: invoice.supplier?.name || "",
        gstinNumber: invoice.supplier?.gstIN || "",
        invoiceNo: invoice.invoiceNo || "",
        invoiceDate: invoice.invoiceDate,
        place: invoice.supplier?.address || "",
        invoiceType: getGstDetailsLabel(invoice.gstDetails),
        finalAmount: numberOrZero(invoice.finalAmount),
        rate: gstRate,
        taxable,
        taxValue,
        cess: numberOrZero(invoice.cessInsurance) || cessValue,
        addCess: 0,
        apmc: 0,
      };
    }),
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("B2B Report");

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  worksheet.mergeCells("A1:M1");
  worksheet.getCell("A1").value = "B2B Report";
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "left" };

  const selectedSupplier = supplierId
    ? await prisma.supplier.findUnique({
        where: { id: parseInt(supplierId) },
        select: { name: true },
      })
    : null;
  const reportUser = req.user?.id
    ? await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { company_name: true, shop_name: true },
      })
    : null;

  worksheet.getCell("A2").value =
    `Company Name: ${reportUser?.company_name || reportUser?.shop_name || "N/A"}`;
  worksheet.getCell("A3").value = `Supplier: ${selectedSupplier?.name || "All"}`;
  worksheet.getCell("A4").value = `From Date: ${formatDate(fromDate) || "All"}`;
  worksheet.getCell("A5").value = `To Date: ${formatDate(toDate) || "All"}`;
  worksheet.getCell("A6").value =
    `Sort By: ${sortBy} (${(sortOrder || "desc").toUpperCase()})`;
  worksheet.addRow([]);

  const headers = [
    "Party",
    "GSTIN Number",
    "Invoice No",
    "Invoice Date",
    "Place",
    "Invoice Type",
    "Final Amount",
    "Rate",
    "Taxable",
    "Tax Value",
    "CESS",
    "Add Cess",
    "APMC",
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEAEAEA" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  rows.forEach((rowData) => {
    const row = worksheet.addRow([
      rowData.party,
      rowData.gstinNumber,
      rowData.invoiceNo,
      formatDate(rowData.invoiceDate),
      rowData.place,
      rowData.invoiceType,
      rowData.finalAmount,
      rowData.rate,
      rowData.taxable,
      rowData.taxValue,
      rowData.cess,
      rowData.addCess,
      rowData.apmc,
    ]);

    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (colNumber >= 7 && colNumber <= 13) {
        cell.alignment = { horizontal: "right" };
        cell.numFmt = "#,##0.00";
      }
    });
  });

  worksheet.views = [{ state: "frozen", ySplit: 8 }];
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const val = cell.value?.toString() || "";
      maxLength = Math.max(maxLength, val.length + 2);
    });
    column.width = Math.min(maxLength, 28);
  });

  const fromStr = formatDateForFilename(fromDate || new Date().toISOString());
  const toStr = formatDateForFilename(toDate || new Date().toISOString());
  const excelFileName = `b2b-report-${fromStr}_to_${toStr}.xlsx`;

  await prisma.purchaseReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      template: "b2bReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          supplierId: supplierId ? parseInt(supplierId) : null,
          gstDetails: normalizedGstDetails,
          fromDate: fromDate || null,
          toDate: toDate || null,
          sortBy,
          sortOrder,
        },
        totalRows: rows.length,
      }),
    },
  });
  await prisma.gstReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      source: "purchase",
      reportKey: "b2b",
      template: "b2bReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          supplierId: supplierId ? parseInt(supplierId) : null,
          gstDetails: normalizedGstDetails,
          fromDate: fromDate || null,
          toDate: toDate || null,
          sortBy,
          sortOrder,
        },
        totalRows: rows.length,
      }),
    },
  });

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${excelFileName}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// --------------------------------------------------------------------
// DOWNLOAD PURCHASE GST AS EXCEL
// --------------------------------------------------------------------
export const downloadPurchaseGSTExcel = asyncHandler(async (req, res) => {
  const {
    supplierId,
    gstDetails,
    fromDate,
    toDate,
    sortBy = "invoiceDate",
    sortOrder = "desc",
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const andConditions = [{ deleted: false }];

  if (supplierId) {
    andConditions.push({ supplierId: parseInt(supplierId) });
  }
  const normalizedGstDetails = appendGstDetailsCondition(
    andConditions,
    gstDetails,
  );

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
  const validSortFields = [
    "invoiceNo",
    "invoiceDate",
    "grossAmount",
    "finalAmount",
    "createdAt",
    "updatedAt",
  ];
  const orderBy = {
    [validSortFields.includes(sortBy) ? sortBy : "invoiceDate"]:
      sortOrder === "asc" ? "asc" : "desc",
  };

  const invoices = await prisma.purchaseInvoice.findMany({
    where,
    orderBy,
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          gstIN: true,
        },
      },
      items: {
        select: {
          id: true,
          rate: true,
          aQty: true,
          taxRate: true,
          taxAmount: true,
          schAmount: true,
          DQty: true,
          product: {
            select: {
              gstRate: true,
              cessRate: true,
            },
          },
        },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Purchase GST");

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const numberOrZero = (value) => (Number.isFinite(value) ? value : 0);

  worksheet.mergeCells("A1:AJ1");
  worksheet.getCell("A1").value = "Purchase GST Report";
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "left" };

  const selectedSupplier = supplierId
    ? await prisma.supplier.findUnique({
        where: { id: parseInt(supplierId) },
        select: { name: true },
      })
    : null;
  const reportUser = req.user?.id
    ? await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { company_name: true, shop_name: true },
      })
    : null;

  worksheet.getCell("A2").value =
    `Company Name: ${reportUser?.company_name || reportUser?.shop_name || "N/A"}`;
  worksheet.getCell("A3").value = `Supplier: ${selectedSupplier?.name || "All"}`;
  worksheet.getCell("A4").value = `From Date: ${formatDate(fromDate) || "All"}`;
  worksheet.getCell("A5").value = `To Date: ${formatDate(toDate) || "All"}`;
  worksheet.getCell("A6").value =
    `Sort By: ${sortBy} (${(sortOrder || "desc").toUpperCase()})`;

  worksheet.addRow([]);

  const headers = [
    "Purchase ID",
    "Date of Invoice",
    "Party Name",
    "Invoice No",
    "GSTIN Number",
    "Gross",
    "Scheme",
    "Discount Amount",
    "TCS Amt",
    "Add Less",
    "Final Amount",
    "Taxable 0%",
    "INTER_STATE_TAXABLE 5%",
    "INTER_STATE_TAXABLE 12%",
    "INTER_STATE_TAXABLE 18%",
    "INTER_STATE_TAXABLE 28%",
    "INTRA_STATE_TAXABLE 5%",
    "INTRA_STATE_TAXABLE 12%",
    "INTRA_STATE_TAXABLE 18%",
    "INTRA_STATE_TAXABLE 28%",
    "IGST 5%",
    "IGST 12%",
    "IGST 18%",
    "IGST 28%",
    "SGST 2.5%",
    "SGST 6%",
    "SGST 9%",
    "SGST 14%",
    "CGST 2.5%",
    "CGST 6%",
    "CGST 9%",
    "CGST 14%",
    "CESS",
    "Add Cess",
    "APMC",
    "Remark",
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEAEAEA" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  invoices.forEach((invoice) => {
    const byRateTaxable = { 5: 0, 12: 0, 18: 0, 28: 0 };
    const byRateIGST = { 5: 0, 12: 0, 18: 0, 28: 0 };
    const byRateSGST = { 5: 0, 12: 0, 18: 0, 28: 0 };
    const byRateCGST = { 5: 0, 12: 0, 18: 0, 28: 0 };
    let cessTotal = 0;
    let schemeTotal = 0;

    invoice.items.forEach((item) => {
      const gstRate = [5, 12, 18, 28].includes(Number(item.taxRate))
        ? Number(item.taxRate)
        : [5, 12, 18, 28].includes(Number(item.product?.gstRate))
          ? Number(item.product?.gstRate)
          : 0;

      const taxable = numberOrZero(item.rate) * numberOrZero(item.aQty);
      const taxAmount =
        numberOrZero(item.taxAmount) ||
        (gstRate > 0 ? (taxable * gstRate) / 100 : 0);
      const cessAmount =
        taxable * (numberOrZero(item.product?.cessRate) / 100);

      if (gstRate && byRateTaxable[gstRate] !== undefined) {
        byRateTaxable[gstRate] += taxable;
        byRateSGST[gstRate] += taxAmount / 2;
        byRateCGST[gstRate] += taxAmount / 2;
      }

      cessTotal += cessAmount;
      schemeTotal += numberOrZero(item.schAmount);
    });

    const discountAmount =
      (numberOrZero(invoice.finalAmount) * numberOrZero(invoice.discountPercent)) /
      100;

    const row = worksheet.addRow([
      invoice.id,
      formatDate(invoice.invoiceDate),
      invoice.supplier?.name || "",
      invoice.invoiceNo || "",
      invoice.supplier?.gstIN || "",
      numberOrZero(invoice.grossAmount),
      numberOrZero(invoice.scheme1) || schemeTotal,
      discountAmount,
      0,
      numberOrZero(invoice.amountAdd),
      numberOrZero(invoice.finalAmount),
      0,
      0,
      0,
      0,
      0,
      numberOrZero(byRateTaxable[5]),
      numberOrZero(byRateTaxable[12]),
      numberOrZero(byRateTaxable[18]),
      numberOrZero(byRateTaxable[28]),
      numberOrZero(byRateIGST[5]),
      numberOrZero(byRateIGST[12]),
      numberOrZero(byRateIGST[18]),
      numberOrZero(byRateIGST[28]),
      numberOrZero(byRateSGST[5]),
      numberOrZero(byRateSGST[12]),
      numberOrZero(byRateSGST[18]),
      numberOrZero(byRateSGST[28]),
      numberOrZero(byRateCGST[5]),
      numberOrZero(byRateCGST[12]),
      numberOrZero(byRateCGST[18]),
      numberOrZero(byRateCGST[28]),
      numberOrZero(invoice.cessInsurance) || cessTotal,
      0,
      0,
      invoice.remarks || "",
    ]);

    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (colNumber >= 6 && colNumber <= 35) {
        cell.alignment = { horizontal: "right" };
        cell.numFmt = "#,##0.00";
      }
    });

  });

  worksheet.views = [{ state: "frozen", ySplit: 7 }];
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const val = cell.value?.toString() || "";
      maxLength = Math.max(maxLength, val.length + 2);
    });
    column.width = Math.min(maxLength, 28);
  });

  const fromStr = formatDateForFilename(fromDate || new Date().toISOString());
  const toStr = formatDateForFilename(toDate || new Date().toISOString());
  const excelFileName = `purchase-gst-${fromStr}_to_${toStr}.xlsx`;

  await prisma.purchaseReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      template: "purchaseGSTReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          supplierId: supplierId ? parseInt(supplierId) : null,
          gstDetails: normalizedGstDetails,
          fromDate: fromDate || null,
          toDate: toDate || null,
          sortBy,
          sortOrder,
        },
        totalInvoices: invoices.length,
      }),
    },
  });
  await prisma.gstReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      source: "purchase",
      reportKey: "purchase-gst",
      template: "purchaseGSTReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          supplierId: supplierId ? parseInt(supplierId) : null,
          gstDetails: normalizedGstDetails,
          fromDate: fromDate || null,
          toDate: toDate || null,
          sortBy,
          sortOrder,
        },
        totalInvoices: invoices.length,
      }),
    },
  });

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${excelFileName}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// --------------------------------------------------------------------
// DOWNLOAD GSTR2 REPORT AS EXCEL
// --------------------------------------------------------------------
export const downloadGSTR2Excel = asyncHandler(async (req, res) => {
  const {
    supplierId,
    gstDetails,
    fromDate,
    toDate,
    sortBy = "invoiceDate",
    sortOrder = "desc",
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const andConditions = [{ deleted: false }];

  if (supplierId) {
    andConditions.push({ supplierId: parseInt(supplierId) });
  }
  const normalizedGstDetails = appendGstDetailsCondition(
    andConditions,
    gstDetails,
  );

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
  const validSortFields = [
    "invoiceNo",
    "invoiceDate",
    "grossAmount",
    "finalAmount",
    "createdAt",
    "updatedAt",
  ];
  const orderBy = {
    [validSortFields.includes(sortBy) ? sortBy : "invoiceDate"]:
      sortOrder === "asc" ? "asc" : "desc",
  };

  const invoices = await prisma.purchaseInvoice.findMany({
    where,
    orderBy,
    include: {
      supplier: {
        select: {
          name: true,
          gstIN: true,
          address: true,
        },
      },
      items: {
        select: {
          id: true,
          rate: true,
          aQty: true,
          unit: true,
          taxRate: true,
          taxAmount: true,
          schAmount: true,
          product: {
            select: {
              description: true,
              hsnSacCode: true,
              gstRate: true,
              gstInclusive: true,
              cessRate: true,
              unit: {
                select: { name: true, symbol: true },
              },
            },
          },
        },
      },
    },
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("GSTR2 Report");
  const numberOrZero = (value) => (Number.isFinite(value) ? value : 0);
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB");
    } catch {
      return "";
    }
  };
  const getStateName = (address) => {
    if (!address) return "";
    const parts = address
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
  };

  const headers = [
    "INVOICE_NO",
    "PUR_DATE",
    "SUPPLIER_NAME",
    "STATE_NAME",
    "GST_NO",
    "FINAL",
    "GROSS",
    "SCHEME",
    "DISCOUNT",
    "QTY",
    "RATE",
    "TAXABLE",
    "GST%",
    "SGST",
    "CGST",
    "IGST",
    "CESS",
    "ADD_CESS",
    "APMC",
    "DESCRIPTION",
    "HSN_CODE",
    "UNIT",
  ];

  worksheet.mergeCells("A1:V1");
  worksheet.getCell("A1").value = "GSTR2 REPORT";
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "left" };

  const selectedSupplier = supplierId
    ? await prisma.supplier.findUnique({
        where: { id: parseInt(supplierId) },
        select: { name: true },
      })
    : null;
  const reportUser = req.user?.id
    ? await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { company_name: true, shop_name: true },
      })
    : null;

  worksheet.getCell("A2").value =
    `Company Name: ${reportUser?.company_name || reportUser?.shop_name || "N/A"}`;
  worksheet.getCell("A3").value = `Supplier: ${selectedSupplier?.name || "All"}`;
  worksheet.getCell("A4").value = `From Date: ${formatDate(fromDate) || "All"}`;
  worksheet.getCell("A5").value = `To Date: ${formatDate(toDate) || "All"}`;
  worksheet.getCell("A6").value =
    `Sort By: ${sortBy} (${(sortOrder || "desc").toUpperCase()})`;
  worksheet.addRow([]);

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEAEAEA" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  invoices.forEach((invoice) => {
    invoice.items.forEach((item) => {
      const gstRate = numberOrZero(item.taxRate) || numberOrZero(item.product?.gstRate);
      const baseTaxable = numberOrZero(item.rate) * numberOrZero(item.aQty);
      const taxAmount =
        numberOrZero(item.taxAmount) ||
        (gstRate > 0 ? (baseTaxable * gstRate) / 100 : 0);
      const isInclusive = item.product?.gstInclusive ?? true;
      const taxableValue = isInclusive ? baseTaxable - taxAmount : baseTaxable;
      const sgst = taxAmount / 2;
      const cgst = taxAmount / 2;
      const igst = 0;
      const cess =
        taxableValue * (numberOrZero(item.product?.cessRate) / 100);
      const discount =
        (numberOrZero(invoice.finalAmount) * numberOrZero(invoice.discountPercent)) /
        100;

      const row = worksheet.addRow([
        invoice.invoiceNo || "",
        formatDate(invoice.invoiceDate),
        invoice.supplier?.name || "",
        getStateName(invoice.supplier?.address),
        invoice.supplier?.gstIN || "",
        numberOrZero(invoice.finalAmount),
        numberOrZero(invoice.grossAmount),
        numberOrZero(item.schAmount || invoice.scheme1),
        discount,
        numberOrZero(item.aQty),
        numberOrZero(item.rate),
        taxableValue,
        gstRate,
        sgst,
        cgst,
        igst,
        cess,
        0,
        0,
        item.product?.description || "",
        item.product?.hsnSacCode || "",
        item.product?.unit?.symbol || item.product?.unit?.name || String(item.unit || ""),
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        if ([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].includes(colNumber)) {
          cell.alignment = { horizontal: "right" };
          cell.numFmt = "#,##0.00";
        }
      });
    });
  });

  worksheet.views = [{ state: "frozen", ySplit: 8 }];
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const val = cell.value?.toString() || "";
      maxLength = Math.max(maxLength, val.length + 2);
    });
    column.width = Math.min(maxLength, 28);
  });

  const fromStr = formatDateForFilename(fromDate || new Date().toISOString());
  const toStr = formatDateForFilename(toDate || new Date().toISOString());
  const excelFileName = `gstr2-report-${fromStr}_to_${toStr}.xlsx`;

  await prisma.purchaseReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      template: "gstr2Report.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          supplierId: supplierId ? parseInt(supplierId) : null,
          gstDetails: normalizedGstDetails,
          fromDate: fromDate || null,
          toDate: toDate || null,
          sortBy,
          sortOrder,
        },
        totalInvoices: invoices.length,
      }),
    },
  });
  await prisma.gstReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      source: "purchase",
      reportKey: "gstr2",
      template: "gstr2Report.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          supplierId: supplierId ? parseInt(supplierId) : null,
          gstDetails: normalizedGstDetails,
          fromDate: fromDate || null,
          toDate: toDate || null,
          sortBy,
          sortOrder,
        },
        totalInvoices: invoices.length,
      }),
    },
  });

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${excelFileName}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// --------------------------------------------------------------------
// GET PURCHASE GST MONTHLY REPORT
// --------------------------------------------------------------------
export const getPurchaseGSTMonthly = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    gstDetails,
  } = req.query;

  // Validation
  if (!fromDate || !toDate) {
    return sendResponse(
      res,
      false,
      null,
      "Both fromDate and toDate are required",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Build date filter
  const startDate = new Date(fromDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(toDate);
  endDate.setHours(23, 59, 59, 999);

  const where = {
    deleted: false,
    invoiceDate: {
      gte: startDate.toISOString(),
      lte: endDate.toISOString(),
    },
  };
  const normalizedGstDetails = getGstDetailsFilterValue(gstDetails);
  if (normalizedGstDetails !== null) {
    where.gstDetails = normalizedGstDetails;
  }

  // Fetch all invoices in date range with related data
  const invoices = await prisma.purchaseInvoice.findMany({
    where,
    orderBy: { invoiceDate: 'asc' },
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
              hsnSacCode: true,
              gstRate: true,
              gstInclusive: true,
              cessRate: true,
              unit: { select: { name: true, symbol: true } },
            },
          },
          batch: {
            select: {
              id: true,
              batchNo: true,
              mrp: true,
              basicPrice: true,
              purchaseRate: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          shop_name: true,
          company_name: true,
        },
      },
    },
  });

  // Group by month
  const monthlyData = groupByMonth(invoices, 'purchase');

  // Calculate grand totals across all months
  const grandTotals = monthlyData.reduce(
    (acc, month) => {
      acc.totalGrossAmount += month.totalGrossAmount;
      acc.totalSchemeAmount += month.totalSchemeAmount;
      acc.totalDiscountAmount += month.totalDiscountAmount;
      acc.totalDamageAmount += month.totalDamageAmount;
      acc.totalTaxableValue += month.totalTaxableValue;
      acc.totalCGST += month.totalCGST;
      acc.totalSGST += month.totalSGST;
      acc.totalIGST += month.totalIGST;
      acc.totalCess += month.totalCess;
      acc.totalGSTAmount += month.totalGSTAmount;
      acc.totalCessCharge += month.totalCessCharge;
      acc.totalAddAmount += month.totalAddAmount;
      acc.totalCreditAmount += month.totalCreditAmount;
      acc.totalFinalAmount += month.totalFinalAmount;
      acc.totalInvoices += month.invoiceCount;
      return acc;
    },
    {
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
      totalInvoices: 0,
    },
  );

  return sendResponse(
    res,
    true,
    {
      filters: {
        fromDate,
        toDate,
        gstDetails: normalizedGstDetails,
      },
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        totalMonths: monthlyData.length,
      },
      monthlyData,
      grandTotals,
    },
    "Purchase GST monthly report retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// DOWNLOAD PURCHASE GST MONTHLY REPORT AS EXCEL
// --------------------------------------------------------------------
export const downloadPurchaseGSTMonthlyExcel = asyncHandler(async (req, res) => {
  const { fromDate, toDate, gstDetails } = req.query;

  if (!fromDate || !toDate) {
    return sendResponse(
      res,
      false,
      null,
      "Both fromDate and toDate are required",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const startDate = new Date(fromDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(toDate);
  endDate.setHours(23, 59, 59, 999);

  const where = {
    deleted: false,
    invoiceDate: {
      gte: startDate.toISOString(),
      lte: endDate.toISOString(),
    },
  };
  const normalizedGstDetails = getGstDetailsFilterValue(gstDetails);
  if (normalizedGstDetails !== null) {
    where.gstDetails = normalizedGstDetails;
  }

  const invoices = await prisma.purchaseInvoice.findMany({
    where,
    orderBy: { invoiceDate: "asc" },
    include: {
      supplier: {
        select: { id: true, name: true, phoneNo: true, email: true, address: true },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              productCode: true,
              description: true,
              hsnSacCode: true,
              gstRate: true,
              gstInclusive: true,
              cessRate: true,
              unit: { select: { name: true, symbol: true } },
            },
          },
          batch: {
            select: {
              id: true,
              batchNo: true,
              mrp: true,
              basicPrice: true,
              purchaseRate: true,
            },
          },
        },
      },
      user: { select: { id: true, shop_name: true, company_name: true } },
    },
  });

  const monthlyData = groupByMonth(invoices, "purchase");
  const grandTotals = monthlyData.reduce(
    (acc, month) => {
      acc.totalGrossAmount += month.totalGrossAmount;
      acc.totalSchemeAmount += month.totalSchemeAmount;
      acc.totalDiscountAmount += month.totalDiscountAmount;
      acc.totalDamageAmount += month.totalDamageAmount;
      acc.totalTaxableValue += month.totalTaxableValue;
      acc.totalCGST += month.totalCGST;
      acc.totalSGST += month.totalSGST;
      acc.totalIGST += month.totalIGST;
      acc.totalCess += month.totalCess;
      acc.totalAddAmount += month.totalAddAmount;
      acc.totalCreditAmount += month.totalCreditAmount;
      acc.totalFinalAmount += month.totalFinalAmount;
      acc.totalInvoices += month.invoiceCount;
      return acc;
    },
    {
      totalGrossAmount: 0,
      totalSchemeAmount: 0,
      totalDiscountAmount: 0,
      totalDamageAmount: 0,
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalCess: 0,
      totalAddAmount: 0,
      totalCreditAmount: 0,
      totalFinalAmount: 0,
      totalInvoices: 0,
    },
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Purchase Monthly GST");
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };
  const formatMonthYear = (monthKey) => {
    try {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    } catch {
      return monthKey;
    }
  };

  worksheet.mergeCells("A1:N1");
  worksheet.getCell("A1").value = "Purchase Monthly GST Report";
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "left" };

  const reportUser = req.user?.id
    ? await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { company_name: true, shop_name: true },
      })
    : null;

  worksheet.getCell("A2").value =
    `Company Name: ${reportUser?.company_name || reportUser?.shop_name || "N/A"}`;
  worksheet.getCell("A3").value = `From Date: ${formatDate(fromDate)}`;
  worksheet.getCell("A4").value = `To Date: ${formatDate(toDate)}`;
  worksheet.addRow([]);

  const headers = [
    "Month",
    "Invoices",
    "Gross Amount",
    "Scheme",
    "Discount",
    "Damage",
    "Taxable Value",
    "CGST",
    "SGST",
    "IGST",
    "Cess",
    "Add Amt",
    "Credit",
    "Final Amount",
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAEAEA" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  monthlyData.forEach((month) => {
    const row = worksheet.addRow([
      formatMonthYear(month.monthKey),
      month.invoiceCount,
      month.totalGrossAmount,
      month.totalSchemeAmount,
      month.totalDiscountAmount,
      month.totalDamageAmount,
      month.totalTaxableValue,
      month.totalCGST,
      month.totalSGST,
      month.totalIGST,
      month.totalCess,
      month.totalAddAmount,
      month.totalCreditAmount,
      month.totalFinalAmount,
    ]);
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (colNumber >= 3 && colNumber <= 14) {
        cell.alignment = { horizontal: "right" };
        cell.numFmt = "#,##0.00";
      }
    });
  });

  const totalRow = worksheet.addRow([
    "GRAND TOTAL",
    grandTotals.totalInvoices,
    grandTotals.totalGrossAmount,
    grandTotals.totalSchemeAmount,
    grandTotals.totalDiscountAmount,
    grandTotals.totalDamageAmount,
    grandTotals.totalTaxableValue,
    grandTotals.totalCGST,
    grandTotals.totalSGST,
    grandTotals.totalIGST,
    grandTotals.totalCess,
    grandTotals.totalAddAmount,
    grandTotals.totalCreditAmount,
    grandTotals.totalFinalAmount,
  ]);
  totalRow.font = { bold: true };
  totalRow.eachCell((cell, colNumber) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    if (colNumber >= 3 && colNumber <= 14) {
      cell.alignment = { horizontal: "right" };
      cell.numFmt = "#,##0.00";
    }
  });

  worksheet.views = [{ state: "frozen", ySplit: 6 }];
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const val = cell.value?.toString() || "";
      maxLength = Math.max(maxLength, val.length + 2);
    });
    column.width = Math.min(maxLength, 24);
  });

  const fromStr = formatDateForFilename(fromDate);
  const toStr = formatDateForFilename(toDate);
  const excelFileName = `purchase-monthly-gst-${fromStr}_to_${toStr}.xlsx`;

  await prisma.purchaseReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      template: "purchaseMonthlyGST.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: { fromDate, toDate, gstDetails: normalizedGstDetails },
        totalMonths: monthlyData.length,
      }),
    },
  });
  await prisma.gstReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      source: "purchase",
      reportKey: "purchase-monthly-gst",
      template: "purchaseMonthlyGST.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: { fromDate, toDate, gstDetails: normalizedGstDetails },
        totalMonths: monthlyData.length,
      }),
    },
  });

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${excelFileName}"`);
  await workbook.xlsx.write(res);
  res.end();
});

// --------------------------------------------------------------------
// DOWNLOAD PURCHASE REGISTER AS PDF
// --------------------------------------------------------------------
export const downloadPurchaseRegisterPDF = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    supplierId,
    gstDetails,
    selectedIds,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // 1. Build WHERE clause (same as preview, but no pagination)
  const andConditions = [{ deleted: false }];

  if (invoiceNo) andConditions.push({ invoiceNo: { contains: invoiceNo } });
  if (supplierId) andConditions.push({ supplierId: parseInt(supplierId) });
  const normalizedGstDetails = appendGstDetailsCondition(
    andConditions,
    gstDetails,
  );
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

  appendSelectedIdsCondition(andConditions, selectedIds);
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

  // 6. Fetch ALL invoices with supplier name (no pagination)
  const invoices = await prisma.purchaseInvoice.findMany({
    where,
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

  // 7. Compute total finalAmount and invoice count
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
  const totalInvoices = invoices.length;

  // 8. Format data for template
  const formattedInvoices = invoices.map((inv) => ({
    invoiceNo: inv.invoiceNo,
    invoiceDate: inv.invoiceDate,
    supplierName: inv.supplier.name,
    amount: inv.finalAmount,
    balance: inv.finalAmount,
  }));

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
    invoices: formattedInvoices,
    totals: { totalAmount, totalInvoices },
    filters: {
      fromDate: fromDate || null,
      toDate: toDate || null,
      invoiceNo: invoiceNo || null,
      supplierId: supplierId ? parseInt(supplierId) : null,
      gstDetails: normalizedGstDetails,
    },
  };

  // 9. Render HTML using EJS
  const templateName = "purchaseRegisterReport.ejs";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const templatePath = path.join(__dirname, "../../views/purchase", templateName);

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

  // 10. Generate PDF with Puppeteer
  const browser = await launchPdfBrowser(puppeteer);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const footerTemplate = `
    <div style="font-size: 10px; width: 100%; display: flex; justify-content: space-between; padding: 0 20px; margin-top: 5px;">
      <span>${user?.shop_name || "Your Shop"}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;
  const headerTemplate = "<div></div>";

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "0.5cm", bottom: "0.5cm", left: "0.2cm", right: "0.2cm" },
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
  });

  await browser.close();

  // 11. Generate filename and save history
  const fromStr = formatDateForFilename(reportData.dateRange.from);
  const toStr = formatDateForFilename(reportData.dateRange.to);
  const pdfFileName = `purchase-register-${fromStr}_to_${toStr}.pdf`;

  await prisma.purchaseReportHistory.create({
    data: {
      userId: req.user.id,
      type: "pdf",
      template: templateName,
      fileName: pdfFileName,
      data: JSON.stringify(reportData),
    },
  });

  // 12. Send PDF
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  return res.end(pdfBuffer, "binary");
});

// --------------------------------------------------------------------
// DOWNLOAD PURCHASE REGISTER AS EXCEL
// --------------------------------------------------------------------
export const downloadPurchaseRegisterExcel = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    supplierId,
    gstDetails,
    selectedIds,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // 1. Build WHERE clause (same as preview, but no pagination)
  const andConditions = [{ deleted: false }];

  if (invoiceNo) andConditions.push({ invoiceNo: { contains: invoiceNo } });
  if (supplierId) andConditions.push({ supplierId: parseInt(supplierId) });
  const normalizedGstDetails = appendGstDetailsCondition(
    andConditions,
    gstDetails,
  );
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

  appendSelectedIdsCondition(andConditions, selectedIds);
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

  // 6. Fetch ALL invoices with supplier name (no pagination)
  const invoices = await prisma.purchaseInvoice.findMany({
    where,
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

  // 7. Compute total finalAmount and invoice count
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.finalAmount, 0);
  const totalInvoices = invoices.length;

  // 8. Format data for template
  const formattedInvoices = invoices.map((inv) => ({
    invoiceNo: inv.invoiceNo,
    invoiceDate: inv.invoiceDate,
    supplierName: inv.supplier.name,
    amount: inv.finalAmount,
    balance: inv.finalAmount,
  }));

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
    invoices: formattedInvoices,
    totals: { totalAmount, totalInvoices },
    filters: {
      fromDate: fromDate || null,
      toDate: toDate || null,
      invoiceNo: invoiceNo || null,
      supplierId: supplierId ? parseInt(supplierId) : null,
      gstDetails: normalizedGstDetails,
    },
  };

  // ----- Generate Excel -----
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Purchase Register");

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
  worksheet.mergeCells("A1:G1");
  const titleRow = worksheet.getRow(1);
  titleRow.getCell(1).value = "Purchase Register";
  titleRow.getCell(1).font = { size: 16, bold: true };
  titleRow.getCell(1).alignment = { horizontal: "left" };

  // Shop & date range
  worksheet.mergeCells("A2:G2");
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

  // Headers
  const headers = ["Invoice No", "Date", "Supplier", "Amount (₹)", "Cash", "Cheque", "Balance"];
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
  reportData.invoices.forEach((invoice) => {
    const row = worksheet.addRow([
      invoice.invoiceNo,
      formatDate(invoice.invoiceDate),
      invoice.supplierName,
      invoice.amount,
      "", // Cash
      "", // Cheque
      invoice.balance,
    ]);

    // Align numeric columns right
    [4, 7].forEach((colIndex) => {
      const cell = row.getCell(colIndex);
      cell.alignment = { horizontal: "right" };
      cell.numFmt = "#,##0.00";
    });

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
      `Total ${reportData.totals.totalInvoices} invoices`,
      "",
      "",
      reportData.totals.totalAmount,
      "",
      "",
      reportData.totals.totalAmount,
    ]);

    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if ([4, 7].includes(colNumber)) {
        cell.alignment = { horizontal: "right" };
        cell.numFmt = "#,##0.00";
      } else {
        cell.alignment = { horizontal: "left" };
      }
    });
    // Merge first three cells for the label
    worksheet.mergeCells(`A${totalRow.number}:C${totalRow.number}`);
  }

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, cellValue.length);
    });
    column.width = Math.min(maxLength + 2, 20);
  });

  const fromStr = formatDateForFilename(reportData.dateRange.from);
  const toStr = formatDateForFilename(reportData.dateRange.to);
  const excelFileName = `purchase-register-${fromStr}_to_${toStr}.xlsx`;

  // Save history
  await prisma.purchaseReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      template: "purchaseRegisterReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify(reportData),
    },
  });

  // Send Excel
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${excelFileName}"`);

  await workbook.xlsx.write(res);
  res.end();
});

// --------------------------------------------------------------------
// GET PURCHASE INVOICE BILL PREVIEW (with UPI QR code)
// --------------------------------------------------------------------
const getPurchaseBillPreviewPayload = async (prisma, purchaseId) => {
  const purchase = await prisma.purchaseInvoice.findFirst({
    where: {
      id: purchaseId,
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
          gstIN: true,
        },
      },
      user: {
        select: {
          id: true,
          username: true,
          company_name: true,
          shop_name: true,
          phone: true,
          email: true,
          upi_id: true,
          signature: true,
          company_logo: true,
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
              unit: true,
              hsnSacCode: true,
            },
          },
          batch: {
            select: {
              id: true,
              batchNo: true,
              barcode: true,
              mrp: true,
              purchaseRate: true,
            },
          },
        },
      },
    },
  });

  if (!purchase) return null;

  const taxBreakdownMap = new Map();
  (purchase.items || []).forEach((item) => {
    const totalRate = Number(item.taxRate) || 0;
    const totalTaxAmount = Number(item.taxAmount) || 0;
    if (totalRate <= 0 || totalTaxAmount <= 0) return;

    const halfRate = Number((totalRate / 2).toFixed(2));
    const prev = taxBreakdownMap.get(halfRate) || {
      rate: halfRate,
      cgstAmount: 0,
      sgstAmount: 0,
      totalTaxAmount: 0,
    };

    prev.cgstAmount += totalTaxAmount / 2;
    prev.sgstAmount += totalTaxAmount / 2;
    prev.totalTaxAmount += totalTaxAmount;
    taxBreakdownMap.set(halfRate, prev);
  });

  const taxBreakdown = Array.from(taxBreakdownMap.values())
    .map((entry) => ({
      rate: entry.rate,
      cgstAmount: Number(entry.cgstAmount.toFixed(2)),
      sgstAmount: Number(entry.sgstAmount.toFixed(2)),
      totalTaxAmount: Number(entry.totalTaxAmount.toFixed(2)),
    }))
    .sort((a, b) => a.rate - b.rate);

  let upiQrCode = null;
  if (purchase.user?.upi_id) {
    const payeeName = encodeURIComponent(
      purchase.user.company_name || purchase.user.shop_name || "Payee",
    );
    const upiString = `upi://pay?pa=${purchase.user.upi_id}&pn=${payeeName}&am=${purchase.finalAmount}&cu=INR`;

    try {
      upiQrCode = await QRCode.toDataURL(upiString);
    } catch (qrError) {
      console.error("QR generation error:", qrError);
    }
  }

  return {
    purchase,
    taxBreakdown,
    upiQrCode,
    signature: purchase.user?.signature || null,
    companyLogo: purchase.user?.company_logo || null,
  };
};

const getPublicImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  if (imagePath.startsWith("/")) {
    return `${baseUrl}${imagePath}`;
  }
  if (imagePath.startsWith("api/")) {
    return `${baseUrl}/${imagePath}`;
  }
  return `${baseUrl}/api/images/${imagePath}`;
};

export const getPurchaseBillPreview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const purchaseId = parseInt(id, 10);
  if (Number.isNaN(purchaseId)) {
    return sendResponse(
      res,
      false,
      null,
      "Invalid purchase invoice id",
      statusType.BAD_REQUEST,
    );
  }

  const responseData = await getPurchaseBillPreviewPayload(prisma, purchaseId);
  if (!responseData) {
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
    responseData,
    "Bill preview data retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// DOWNLOAD PURCHASE INVOICE BILL PREVIEW AS PDF
// --------------------------------------------------------------------
export const downloadPurchaseBillPreviewPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const purchaseId = parseInt(id, 10);
  if (Number.isNaN(purchaseId)) {
    return sendResponse(
      res,
      false,
      null,
      "Invalid purchase invoice id",
      statusType.BAD_REQUEST,
    );
  }

  const previewData = await getPurchaseBillPreviewPayload(prisma, purchaseId);
  if (!previewData) {
    return sendResponse(
      res,
      false,
      null,
      "Purchase invoice not found",
      statusType.NOT_FOUND,
    );
  }

  const templateName = "purchaseInvoicePreview.ejs";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const templatePath = path.join(
    __dirname,
    "../../views/purchase",
    templateName,
  );

  const { purchase, upiQrCode, taxBreakdown } = previewData;

  const companyName =
    purchase.user?.company_name || purchase.user?.shop_name || "Purchase Invoice";

  const html = await ejs.renderFile(templatePath, {
    purchase,
    taxBreakdown: taxBreakdown || [],
    upiQrCode,
    companyName,
    companyAddress: purchase.user?.address || "",
    companyPhone: purchase.user?.phone || "",
    supplierName: purchase.supplier?.name || "",
    supplierAddress: purchase.supplier?.address || "",
    supplierPhone: purchase.supplier?.phoneNo || "",
    supplierGstin: purchase.supplier?.gstIN || "",
    companyLogoUrl: getPublicImageUrl(req, purchase.user?.company_logo || null),
    signatureUrl: getPublicImageUrl(req, purchase.user?.signature || null),
    formatDate: (dateStr) => {
      if (!dateStr) return "";
      try {
        return new Date(dateStr).toLocaleDateString("en-GB");
      } catch {
        return "";
      }
    },
    formatAmount: (value) => Number(value || 0).toFixed(2),
  });

  const browser = await launchPdfBrowser(puppeteer);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const footerTemplate = `
    <div style="font-size: 10px; width: 100%; display: flex; justify-content: space-between; padding: 0 20px;">
      <span>${companyName}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;

  const pdfBuffer = await page.pdf({
    width: "297mm",
    height: "210mm",
    printBackground: true,
    margin: { top: "0.5cm", bottom: "0.8cm", left: "0.4cm", right: "0.4cm" },
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate,
  });

  await browser.close();

  const safeInvoiceNo = (purchase.invoiceNo || `purchase-${purchase.id}`)
    .toString()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const pdfFileName = `purchase-invoice-${safeInvoiceNo}.pdf`;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);
  res.setHeader("Content-Length", pdfBuffer.length);

  return res.end(pdfBuffer, "binary");
});

// --------------------------------------------------------------------
// Export all functions as a controller object (like areaController)
// --------------------------------------------------------------------
export const purchaseController = {
  createPurchase,
  createPurchaseReturn,
  getAllPurchases,
  downloadPurchaseRegisterPDF,   
  downloadPurchaseRegisterExcel, 
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getActivePurchases,
  getPurchaseReport,
  getPurchaseSummaryReport_pdf_data, // new function
  downloadPurchaseSummaryReportPDF,
  downloadPurchaseSummaryReportExcel,
  getPurchaseRegisterPDFData,

  // New history endpoints
  getAllPurchaseReportHistory,
  downloadPurchaseReportHistoryPDF,
  downloadPurchaseReportHistoryExcel,
  getPurchaseWithGST,
  getPurchaseB2B,
  downloadPurchaseB2BExcel,
  downloadPurchaseGSTExcel,
  downloadGSTR2Excel,
  getPurchaseGSTMonthly,
  downloadPurchaseGSTMonthlyExcel,
  getPurchaseBillPreview,
  downloadPurchaseBillPreviewPDF,
  checkPurchaseInvoiceNumber,
};
