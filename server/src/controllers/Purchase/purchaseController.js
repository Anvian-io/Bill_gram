import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../../utils/index.js";

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
            totalAmount: item.totalAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            // sch1Percent: item.sch1Percent || 0,
            // sch1Amount: item.sch1Amount || 0,
            // sch2Percent: item.sch2Percent || 0,
            // sch2Amount: item.sch2Amount || 0,
            fQty: item.fQty || 0,
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
              totalAmount: item.totalAmount,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              // sch1Percent: item.sch1Percent || 0,
              // sch1Amount: item.sch1Amount || 0,
              // sch2Percent: item.sch2Percent || 0,
              // sch2Amount: item.sch2Amount || 0,
              fQty: item.fQty || 0,
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
// Export all functions as a controller object (like areaController)
// --------------------------------------------------------------------
export const purchaseController = {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getActivePurchases,
};
