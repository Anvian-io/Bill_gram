import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../../utils/index.js";

/**
 * Helper: Update batch stock (decrement for sales)
 * @param {PrismaClient} prisma
 * @param {number} batchId
 * @param {number} deltaQty - positive to add, negative to subtract (for sales: use negative)
 */
const updateBatchStock = async (prisma, batchId, deltaQty) => {
  await prisma.batch.update({
    where: { id: batchId },
    data: { openingStock: { increment: deltaQty } },
  });
};

/**
 * Helper: Create sales history entries for an invoice
 */
const createSalesHistory = async (
  prisma,
  invoice,
  items,
  customerId,
  areaId,
  vanId,
  salesmanId,
) => {
  const historyData = items.map((item) => ({
    productId: item.productId,
    batchId: item.batchId,
    salesInvoiceId: invoice.id,
    invoiceNo: `SINV-${invoice.id}`, // or use invoice.invoiceNo if already updated
    invoiceDate: invoice.invoiceDate,
    customerId,
    areaId,
    vanId,
    salesmanId,
    rate: item.rate,
    aQty: item.aQty,
    totalAmount: item.totalAmount,
  }));
  await prisma.salesHistory.createMany({ data: historyData });
};

// --------------------------------------------------------------------
// 1. CREATE SALES INVOICE
// --------------------------------------------------------------------
export const createSale = asyncHandler(async (req, res) => {
  const {
    invoiceDate,
    customerId,
    areaId,
    vanId,
    salesmanId,
    address,
    invoiceNo,
    gstDetails,
    items, // array of SalesInvoiceItemInput
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
  if (!invoiceDate || !customerId || !items?.length) {
    return sendResponse(
      res,
      false,
      null,
      "Missing required fields (invoiceDate, customerId, items)",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Verify customer exists and is not deleted
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, deleted: false },
  });
  if (!customer) {
    return sendResponse(
      res,
      false,
      null,
      "Customer not found",
      statusType.NOT_FOUND,
    );
  }

  // Verify invoice number uniqueness (global)
  // const existing = await prisma.salesInvoice.findFirst({
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

  // Validate optional foreign keys if provided
  if (areaId) {
    const area = await prisma.area.findFirst({
      where: { id: areaId, deleted: false },
    });
    if (!area) {
      return sendResponse(
        res,
        false,
        null,
        "Area not found",
        statusType.NOT_FOUND,
      );
    }
  }
  if (vanId) {
    const van = await prisma.van.findFirst({
      where: { id: vanId, deleted: false },
    });
    if (!van) {
      return sendResponse(
        res,
        false,
        null,
        "Van not found",
        statusType.NOT_FOUND,
      );
    }
  }
  if (salesmanId) {
    const salesman = await prisma.salesman.findFirst({
      where: { id: salesmanId, deleted: false },
    });
    if (!salesman) {
      return sendResponse(
        res,
        false,
        null,
        "Salesman not found",
        statusType.NOT_FOUND,
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
    // Ensure sufficient stock (optional, can be enforced later)
    if (batch.openingStock < item.aQty) {
      return sendResponse(
        res,
        false,
        null,
        `Insufficient stock for batch ${item.batchId}. Available: ${batch.openingStock}`,
        statusType.BAD_REQUEST,
      );
    }
  }

  // --- Transaction ---
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create invoice
      const invoice = await tx.salesInvoice.create({
        data: {
          // invoiceNo,
          invoiceDate: new Date(invoiceDate),
          customerId,
          areaId: areaId || null,
          vanId: vanId || null,
          salesmanId: salesmanId || null,
          address: address || null,
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
          userId: req.user?.id, // if authentication is used
        },
      });

      // 2. Create invoice items & decrease batch stock
      for (const item of items) {
        await tx.salesInvoiceItem.create({
          data: {
            salesInvoiceId: invoice.id,
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

        // Decrease batch stock (negative delta)
        await updateBatchStock(tx, item.batchId, -item.aQty);
      }

      // 3. Create sales history entries
      await createSalesHistory(
        tx,
        invoice,
        items,
        customerId,
        areaId,
        vanId,
        salesmanId,
      );

      return invoice;
    });

    // Optional: update invoiceNo with prefix (like purchase controller does)
    const paddedId = result.id.toString().padStart(4, "0");

    const updated = await prisma.salesInvoice.update({
      where: { id: result.id },
      data: { invoiceNo: `SINV-${paddedId}` },
    });

    return sendResponse(
      res,
      true,
      { sale: updated },
      "Sales invoice created successfully",
      statusType.CREATED,
    );
  } catch (error) {
    console.error("Create sale error:", error);
    return sendResponse(
      res,
      false,
      null,
      "Failed to create sale",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
});

// --------------------------------------------------------------------
// 2. GET ALL SALES (with filters, pagination)
// --------------------------------------------------------------------
export const getAllSales = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    invoiceNo = "",
    customerId,
    areaId,
    vanId,
    salesmanId,
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

  if (customerId) {
    andConditions.push({ customerId: parseInt(customerId) });
  }
  if (areaId) {
    andConditions.push({ areaId: parseInt(areaId) });
  }
  if (vanId) {
    andConditions.push({ vanId: parseInt(vanId) });
  }
  if (salesmanId) {
    andConditions.push({ salesmanId: parseInt(salesmanId) });
  }

  // Date range filter (invoiceDate)
  if (fromDate || toDate) {
    const dateFilter = {};
    if (fromDate) {
      dateFilter.gte = new Date(fromDate);
    }
    if (toDate) {
      dateFilter.lte = new Date(toDate);
    }
    andConditions.push({ invoiceDate: dateFilter });
  }

  // Amount range filter (finalAmount)
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

  // Global search: invoiceNo, customer.name, remarks, area.name, van.name, salesman.name
  if (search) {
    andConditions.push({
      OR: [
        { invoiceNo: { contains: search } },
        { customer: { companyName: { contains: search } } },
        { customer: { personName: { contains: search } } },
        { remarks: { contains: search } },
        { area: { name: { contains: search } } },
        { van: { name: { contains: search } } },
        { salesman: { name: { contains: search } } },
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

  // Include relations
  const [sales, total] = await Promise.all([
    prisma.salesInvoice.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            personName: true,
            phoneNo: true,
          },
        },
        area: { select: { id: true, name: true } },
        van: { select: { id: true, name: true, vehicleNo: true } },
        salesman: { select: { id: true, name: true, phoneNo: true } },
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
    prisma.salesInvoice.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      sales,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Sales retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 3. GET SINGLE SALE BY ID
// --------------------------------------------------------------------
export const getSaleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const sale = await prisma.salesInvoice.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
          personName: true,
          phoneNo: true,
          email: true,
          address: true,
        },
      },
      area: { select: { id: true, name: true } },
      van: { select: { id: true, name: true, vehicleNo: true } },
      salesman: { select: { id: true, name: true, phoneNo: true } },
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
              saleRate: true,
              openingStock: true,
            },
          },
        },
      },
    },
  });

  if (!sale) {
    return sendResponse(
      res,
      false,
      null,
      "Sales invoice not found",
      statusType.NOT_FOUND,
    );
  }

  return sendResponse(
    res,
    true,
    { sale },
    "Sale retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 4. UPDATE SALES INVOICE (FIXED)
// --------------------------------------------------------------------
export const updateSale = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    invoiceDate,
    customerId,
    areaId,
    vanId,
    salesmanId,
    address,
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

  // Check invoice exists and is not deleted
  const existingInvoice = await prisma.salesInvoice.findFirst({
    where: { id: parseInt(id), deleted: false },
    include: { items: { include: { batch: true } } },
  });
  if (!existingInvoice) {
    return sendResponse(
      res,
      false,
      null,
      "Sales invoice not found",
      statusType.NOT_FOUND,
    );
  }

  // --- VALIDATION OF REQUIRED FIELDS (cannot be null) ---
  // These fields are mandatory in the schema. If they are provided in the request,
  // they must be non‑null. If not provided, the existing value will be kept.
  const requiredFields = [
    { name: "areaId", value: areaId },
    { name: "vanId", value: vanId },
    { name: "salesmanId", value: salesmanId },
    { name: "address", value: address },
  ];
  for (const field of requiredFields) {
    if (field.value === null) {
      return sendResponse(
        res,
        false,
        null,
        `${field.name} cannot be set to null`,
        statusType.BAD_REQUEST,
      );
    }
  }

  // If invoiceNo is changed, check uniqueness
  if (invoiceNo && invoiceNo !== existingInvoice.invoiceNo) {
    const conflict = await prisma.salesInvoice.findFirst({
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

  // Validate customer if changed
  if (customerId && customerId !== existingInvoice.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, deleted: false },
    });
    if (!customer) {
      return sendResponse(
        res,
        false,
        null,
        "Customer not found",
        statusType.NOT_FOUND,
      );
    }
  }

  // Validate optional foreign keys if changed
  if (areaId !== undefined && areaId !== existingInvoice.areaId) {
    const area = await prisma.area.findFirst({
      where: { id: areaId, deleted: false },
    });
    if (!area) {
      return sendResponse(
        res,
        false,
        null,
        "Area not found",
        statusType.NOT_FOUND,
      );
    }
  }
  if (vanId !== undefined && vanId !== existingInvoice.vanId) {
    const van = await prisma.van.findFirst({
      where: { id: vanId, deleted: false },
    });
    if (!van) {
      return sendResponse(
        res,
        false,
        null,
        "Van not found",
        statusType.NOT_FOUND,
      );
    }
  }
  if (salesmanId !== undefined && salesmanId !== existingInvoice.salesmanId) {
    const salesman = await prisma.salesman.findFirst({
      where: { id: salesmanId, deleted: false },
    });
    if (!salesman) {
      return sendResponse(
        res,
        false,
        null,
        "Salesman not found",
        statusType.NOT_FOUND,
      );
    }
  }

  // Validate new items if provided
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
      // Stock check will be done inside transaction
    }
  }

  // --- TRANSACTION ---
  try {
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // 1. Reverse stock from old items (add back)
      for (const oldItem of existingInvoice.items) {
        if (oldItem.batchId) {
          await updateBatchStock(tx, oldItem.batchId, oldItem.aQty); // positive delta
        }
      }

      // 2. Delete old items and history
      await tx.salesInvoiceItem.deleteMany({
        where: { salesInvoiceId: existingInvoice.id },
      });
      await tx.salesHistory.deleteMany({
        where: { salesInvoiceId: existingInvoice.id },
      });

      // 3. Update invoice header
      const updated = await tx.salesInvoice.update({
        where: { id: existingInvoice.id },
        data: {
          invoiceDate: invoiceDate
            ? new Date(invoiceDate)
            : existingInvoice.invoiceDate,
          customerId: customerId || existingInvoice.customerId,
          areaId: areaId !== undefined ? areaId : existingInvoice.areaId,
          vanId: vanId !== undefined ? vanId : existingInvoice.vanId,
          salesmanId:
            salesmanId !== undefined ? salesmanId : existingInvoice.salesmanId,
          address: address !== undefined ? address : existingInvoice.address,
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

      // 4. Create new items & deduct stock
      if (items) {
        for (const item of items) {
          // Check stock sufficiency
          const batch = await tx.batch.findUnique({
            where: { id: item.batchId },
          });
          if (batch.openingStock < item.aQty) {
            throw new Error(
              `Insufficient stock for batch ${item.batchId}. Available: ${batch.openingStock}`,
            );
          }

          await tx.salesInvoiceItem.create({
            data: {
              salesInvoiceId: existingInvoice.id,
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

          // Decrease batch stock
          await updateBatchStock(tx, item.batchId, -item.aQty);
        }

        // 5. Create new history entries
        await createSalesHistory(
          tx,
          {
            id: existingInvoice.id,
            invoiceNo: invoiceNo || existingInvoice.invoiceNo,
            invoiceDate: invoiceDate
              ? new Date(invoiceDate)
              : existingInvoice.invoiceDate,
          },
          items,
          customerId || existingInvoice.customerId,
          areaId !== undefined ? areaId : existingInvoice.areaId,
          vanId !== undefined ? vanId : existingInvoice.vanId,
          salesmanId !== undefined ? salesmanId : existingInvoice.salesmanId,
        );
      }

      // Return the updated invoice with relations (optional)
      return await tx.salesInvoice.findUnique({
        where: { id: existingInvoice.id },
        include: {
          customer: true,
          area: true,
          van: true,
          salesman: true,
          items: {
            include: {
              product: true,
              batch: true,
            },
          },
        },
      });
    });

    return sendResponse(
      res,
      true,
      { sale: updatedInvoice },
      "Sales invoice updated successfully",
      statusType.OK,
    );
  } catch (error) {
    console.error("Update sale error:", error);
    if (error.message.startsWith("Insufficient stock")) {
      return sendResponse(
        res,
        false,
        null,
        error.message,
        statusType.BAD_REQUEST,
      );
    }
    return sendResponse(
      res,
      false,
      null,
      "Failed to update sale",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
});

// --------------------------------------------------------------------
// 5. DELETE SALES INVOICE (soft delete & reverse stock)
// --------------------------------------------------------------------
export const deleteSale = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const invoice = await prisma.salesInvoice.findFirst({
    where: { id: parseInt(id), deleted: false },
    include: { items: true },
  });
  if (!invoice) {
    return sendResponse(
      res,
      false,
      null,
      "Sales invoice not found",
      statusType.NOT_FOUND,
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Reverse stock (add back)
      for (const item of invoice.items) {
        if (item.batchId) {
          await updateBatchStock(tx, item.batchId, item.aQty);
        }
      }

      // Soft delete invoice
      await tx.salesInvoice.update({
        where: { id: invoice.id },
        data: { deleted: true, status: "Cancelled" },
      });

      // Items are cascade deleted (hard delete), history remains.
    });

    return sendResponse(
      res,
      true,
      { message: "Sales invoice deleted successfully" },
      "Delete successful",
      statusType.OK,
    );
  } catch (error) {
    console.error("Delete sale error:", error);
    return sendResponse(
      res,
      false,
      null,
      "Failed to delete sale",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
});

// --------------------------------------------------------------------
// 6. GET ACTIVE SALES (for dropdowns, etc.)
// --------------------------------------------------------------------
export const getActiveSales = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const sales = await prisma.salesInvoice.findMany({
    where: { deleted: false, status: { not: "Cancelled" } },
    select: {
      id: true,
      invoiceNo: true,
      invoiceDate: true,
      finalAmount: true,
      customer: { select: { companyName: true, personName: true } },
    },
    orderBy: { invoiceDate: "desc" },
    take: 100,
  });

  return sendResponse(
    res,
    true,
    { sales },
    "Active sales retrieved",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 7. GET SALES REPORT (with filters)
// --------------------------------------------------------------------
export const getSalesReport = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = '',
    customerId,
    areaId,
    vanId,
    salesmanId,
    productGroupId,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Build WHERE clause for invoices
  const andConditions = [{ deleted: false }];

  if (invoiceNo) {
    andConditions.push({ invoiceNo: { contains: invoiceNo } });
  }

  if (customerId) {
    andConditions.push({ customerId: parseInt(customerId) });
  }
  if (areaId) {
    andConditions.push({ areaId: parseInt(areaId) });
  }
  if (vanId) {
    andConditions.push({ vanId: parseInt(vanId) });
  }
  if (salesmanId) {
    andConditions.push({ salesmanId: parseInt(salesmanId) });
  }

  // Date range filter (both optional)
  if (fromDate || toDate) {
    const dateFilter = {};
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
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

  // Include customer details
  const include = {
    customer: {
      select: {
        id: true,
        companyName: true,
        personName: true,
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
  const invoices = await prisma.salesInvoice.findMany({
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
      customer: invoice.customer,
      totalAmount,
    };
  });

  return sendResponse(
    res,
    true,
    { report: reportData },
    'Sales report generated successfully',
    statusType.OK
  );
});

// --------------------------------------------------------------------
// 8. GET AREA-WISE SALES REPORT (grouped by area with invoice details)
// --------------------------------------------------------------------
export const getAreaWiseSalesReport = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = '',
    customerId,
    vanId,
    salesmanId,
    productGroupId,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Build WHERE clause for invoices
  const invoiceWhere = { deleted: false };

  if (invoiceNo) {
    invoiceWhere.invoiceNo = { contains: invoiceNo };
  }
  if (customerId) {
    invoiceWhere.customerId = parseInt(customerId);
  }
  if (vanId) {
    invoiceWhere.vanId = parseInt(vanId);
  }
  if (salesmanId) {
    invoiceWhere.salesmanId = parseInt(salesmanId);
  }
  if (fromDate || toDate) {
    invoiceWhere.invoiceDate = {};
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      invoiceWhere.invoiceDate.gte = start;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      invoiceWhere.invoiceDate.lte = end;
    }
  }

  if (productGroupId) {
    invoiceWhere.items = {
      some: {
        product: {
          productGroupId: parseInt(productGroupId),
        },
      },
    };
  }

  // Fetch invoices with area and customer details
  const invoices = await prisma.salesInvoice.findMany({
    where: invoiceWhere,
    select: {
      invoiceNo: true,
      invoiceDate: true,
      finalAmount: true,
      areaId: true,
      area: { select: { id: true, name: true } },
      customer: { select: { companyName: true, personName: true } },
    },
  });

  // Group by area
  const areaMap = new Map();
  invoices.forEach((invoice) => {
    if (!invoice.areaId) return;
    const areaId = invoice.areaId;
    const areaName = invoice.area?.name || `Area ${areaId}`;
    if (!areaMap.has(areaId)) {
      areaMap.set(areaId, {
        areaId,
        areaName,
        totalAmount: 0,
        invoices: [],
      });
    }
    const group = areaMap.get(areaId);
    group.totalAmount += invoice.finalAmount || 0;
    group.invoices.push({
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate,
      totalAmount: invoice.finalAmount || 0,
      customerName: invoice.customer?.companyName || invoice.customer?.personName || '',
    });
  });

  // Convert to array and sort by area name
  const reportData = Array.from(areaMap.values()).sort((a, b) =>
    a.areaName.localeCompare(b.areaName)
  );

  return sendResponse(
    res,
    true,
    { report: reportData },
    'Area-wise sales report generated successfully',
    statusType.OK
  );
});

// --------------------------------------------------------------------
// 9. GET SALESMAN-WISE SALES REPORT (grouped by salesman with invoice details)
// --------------------------------------------------------------------
export const getSalesmanWiseSalesReport = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = '',
    customerId,
    areaId,
    vanId,
    productGroupId,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Build WHERE clause for invoices
  const invoiceWhere = { deleted: false };

  if (invoiceNo) {
    invoiceWhere.invoiceNo = { contains: invoiceNo };
  }
  if (customerId) {
    invoiceWhere.customerId = parseInt(customerId);
  }
  if (areaId) {
    invoiceWhere.areaId = parseInt(areaId);
  }
  if (vanId) {
    invoiceWhere.vanId = parseInt(vanId);
  }
  if (fromDate || toDate) {
    invoiceWhere.invoiceDate = {};
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      invoiceWhere.invoiceDate.gte = start;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      invoiceWhere.invoiceDate.lte = end;
    }
  }

  if (productGroupId) {
    invoiceWhere.items = {
      some: {
        product: {
          productGroupId: parseInt(productGroupId),
        },
      },
    };
  }

  // Fetch invoices with salesman and customer details
  const invoices = await prisma.salesInvoice.findMany({
    where: invoiceWhere,
    select: {
      invoiceNo: true,
      invoiceDate: true,
      finalAmount: true,
      salesmanId: true,
      salesman: { select: { id: true, name: true } },
      customer: { select: { companyName: true, personName: true } },
    },
  });

  // Group by salesman
  const salesmanMap = new Map();
  invoices.forEach((invoice) => {
    if (!invoice.salesmanId) return;
    const salesmanId = invoice.salesmanId;
    const salesmanName = invoice.salesman?.name || `Salesman ${salesmanId}`;
    if (!salesmanMap.has(salesmanId)) {
      salesmanMap.set(salesmanId, {
        salesmanId,
        salesmanName,
        totalAmount: 0,
        invoices: [],
      });
    }
    const group = salesmanMap.get(salesmanId);
    group.totalAmount += invoice.finalAmount || 0;
    group.invoices.push({
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate,
      totalAmount: invoice.finalAmount || 0,
      customerName: invoice.customer?.companyName || invoice.customer?.personName || '',
    });
  });

  // Convert to array and sort by salesman name
  const reportData = Array.from(salesmanMap.values()).sort((a, b) =>
    a.salesmanName.localeCompare(b.salesmanName)
  );

  return sendResponse(
    res,
    true,
    { report: reportData },
    'Salesman-wise sales report generated successfully',
    statusType.OK
  );
});

// --------------------------------------------------------------------
// 10. GET SALES SUMMARY REPORT PDF DATA (equivalent to getPurchaseSummaryReport_pdf_data)
// --------------------------------------------------------------------
export const getSalesSummaryReportPDFData = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    customerId,
    areaId,
    vanId,
    salesmanId,
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
  if (customerId) andConditions.push({ customerId: parseInt(customerId) });
  if (areaId) andConditions.push({ areaId: parseInt(areaId) });
  if (vanId) andConditions.push({ vanId: parseInt(vanId) });
  if (salesmanId) andConditions.push({ salesmanId: parseInt(salesmanId) });
  
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
  const dateRange = await prisma.salesInvoice.aggregate({
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
  const invoiceRange = await prisma.salesInvoice.aggregate({
    where,
    _min: { invoiceNo: true },
    _max: { invoiceNo: true },
  });

  // 5. Distinct areas
  const invoicesWithArea = await prisma.salesInvoice.findMany({
    where,
    select: { area: { select: { name: true } } },
    distinct: ["areaId"],
  });
  const areas = [
    ...new Set(
      invoicesWithArea
        .map((inv) => inv.area?.name)
        .filter((name) => name && name.length > 0),
    ),
  ];

  // 6. Fetch all items with product and batch
  const items = await prisma.salesInvoiceItem.findMany({
    where: { salesInvoice: where },
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
    saleRate: data.rateCount > 0 ? data.totalRate / data.rateCount : 0,
    mrp: data.mrpCount > 0 ? data.totalMrp / data.mrpCount : 0,
    totalUnitsSold: data.totalUnits,
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
      acc.totalUnitsSold += product.totalUnitsSold;
      acc.fQty += product.fQty;
      acc.rep += 0; // REP is always 0 in current data model
      acc.dQty += product.dQty;
      acc.finalAmount += product.finalAmount;
      return acc;
    },
    {
      totalMqty: 0,
      totalUnit: 0,
      totalUnitsSold: 0,
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
        customerId: customerId ? parseInt(customerId) : null,
        areaId: areaId ? parseInt(areaId) : null,
        vanId: vanId ? parseInt(vanId) : null,
        salesmanId: salesmanId ? parseInt(salesmanId) : null,
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
      totals,
      pagination: {
        total: totalProducts,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Sales summary report data retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 13. GET SALES REGISTER PDF DATA (equivalent to getPurchaseRegisterPDFData)
// --------------------------------------------------------------------
export const getSalesRegisterPDFData = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    customerId,
    areaId,
    vanId,
    salesmanId,
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
  if (customerId) andConditions.push({ customerId: parseInt(customerId) });
  if (areaId) andConditions.push({ areaId: parseInt(areaId) });
  if (vanId) andConditions.push({ vanId: parseInt(vanId) });
  if (salesmanId) andConditions.push({ salesmanId: parseInt(salesmanId) });
  
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
  const dateRange = await prisma.salesInvoice.aggregate({
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
  const invoiceRange = await prisma.salesInvoice.aggregate({
    where,
    _min: { invoiceNo: true },
    _max: { invoiceNo: true },
  });

  // 5. Distinct areas
  const invoicesWithArea = await prisma.salesInvoice.findMany({
    where,
    select: { area: { select: { name: true } } },
    distinct: ["areaId"],
  });
  const areas = [
    ...new Set(
      invoicesWithArea
        .map((inv) => inv.area?.name)
        .filter((name) => name && name.length > 0),
    ),
  ];

  // 6. Get paginated invoices with customer name
  const invoices = await prisma.salesInvoice.findMany({
    where,
    skip,
    take: validatedLimit,
    orderBy: { invoiceDate: "desc" },
    select: {
      invoiceNo: true,
      invoiceDate: true,
      finalAmount: true,
      customer: {
        select: { companyName: true, personName: true },
      },
    },
  });

  // 7. Compute total finalAmount for all filtered invoices (overall total)
  const totalAggregate = await prisma.salesInvoice.aggregate({
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
    customerName: inv.customer?.companyName || inv.customer?.personName || "",
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
        customerId: customerId ? parseInt(customerId) : null,
        areaId: areaId ? parseInt(areaId) : null,
        vanId: vanId ? parseInt(vanId) : null,
        salesmanId: salesmanId ? parseInt(salesmanId) : null,
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
    "Sales register data retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 11. GET AREA-WISE PDF DATA (aggregated by area with financial totals)
// --------------------------------------------------------------------
export const getAreaWisePDFData = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    customerId,
    vanId,
    salesmanId,
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
  if (customerId) andConditions.push({ customerId: parseInt(customerId) });
  if (vanId) andConditions.push({ vanId: parseInt(vanId) });
  if (salesmanId) andConditions.push({ salesmanId: parseInt(salesmanId) });
  
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
  const dateRange = await prisma.salesInvoice.aggregate({
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
  const invoiceRange = await prisma.salesInvoice.aggregate({
    where,
    _min: { invoiceNo: true },
    _max: { invoiceNo: true },
  });

  // 5. Distinct areas for filter display
  const invoicesWithArea = await prisma.salesInvoice.findMany({
    where,
    select: { area: { select: { name: true } } },
    distinct: ["areaId"],
  });
  const areas = [
    ...new Set(
      invoicesWithArea
        .map((inv) => inv.area?.name)
        .filter((name) => name && name.length > 0),
    ),
  ];

  // 6. Fetch all invoices with area details and items for aggregation
  const invoices = await prisma.salesInvoice.findMany({
    where,
    select: {
      id: true,
      invoiceNo: true,
      invoiceDate: true,
      finalAmount: true,
      scheme1: true,
      tax: true,
      discountPercent: true,
      areaId: true,
      area: { select: { id: true, name: true } },
      items: {
        select: {
          finalAmount: true,
          schAmount: true,
          taxAmount: true,
          totalAmount: true,
        },
      },
    },
  });

  // 7. Aggregate by area
  const areaMap = new Map();

  for (const invoice of invoices) {
    if (!invoice.areaId) continue;
    
    const areaId = invoice.areaId;
    const areaName = invoice.area?.name || `Area ${areaId}`;
    
    if (!areaMap.has(areaId)) {
      areaMap.set(areaId, {
        areaId,
        areaName,
        totalDiscount: 0, // Always 0 as per requirement
        totalSchemeAmount: 0,
        totalGST: 0,
        finalAmount: 0,
        invoiceCount: 0,
      });
    }
    
    const agg = areaMap.get(areaId);
    
    // Calculate scheme amount from items (sum of schAmount) or use invoice scheme1
    const itemSchemeTotal = invoice.items.reduce((sum, item) => sum + (item.schAmount || 0), 0);
    agg.totalSchemeAmount += itemSchemeTotal > 0 ? itemSchemeTotal : (invoice.scheme1 || 0);
    
    // Calculate GST from items taxAmount or invoice tax
    const itemTaxTotal = invoice.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    agg.totalGST += itemTaxTotal > 0 ? itemTaxTotal : (invoice.tax || 0);
    
    agg.finalAmount += invoice.finalAmount || 0;
    agg.invoiceCount += 1;
  }

  // 8. Convert map to array
  let allAreas = Array.from(areaMap.values());

  // 9. Compute grand totals
  const grandTotals = allAreas.reduce(
    (acc, area) => {
      acc.totalDiscount += area.totalDiscount;
      acc.totalSchemeAmount += area.totalSchemeAmount;
      acc.totalGST += area.totalGST;
      acc.finalAmount += area.finalAmount;
      acc.invoiceCount += area.invoiceCount;
      return acc;
    },
    {
      totalDiscount: 0,
      totalSchemeAmount: 0,
      totalGST: 0,
      finalAmount: 0,
      invoiceCount: 0,
    },
  );

  // 10. Sort by area name and paginate
  allAreas.sort((a, b) => a.areaName.localeCompare(b.areaName));
  const totalAreas = allAreas.length;
  const totalPages = Math.ceil(totalAreas / validatedLimit);
  const paginatedAreas = allAreas.slice(skip, skip + validatedLimit);

  // 11. Build response
  return sendResponse(
    res,
    true,
    {
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        invoiceNo: invoiceNo || null,
        customerId: customerId ? parseInt(customerId) : null,
        vanId: vanId ? parseInt(vanId) : null,
        salesmanId: salesmanId ? parseInt(salesmanId) : null,
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
      areaData: paginatedAreas,
      grandTotals,
      pagination: {
        total: totalAreas,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Area-wise PDF data retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 12. GET SALESMAN-WISE PDF DATA (aggregated by salesman with financial totals)
// --------------------------------------------------------------------
export const getSalesmanWisePDFData = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    customerId,
    areaId,
    vanId,
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
  if (customerId) andConditions.push({ customerId: parseInt(customerId) });
  if (areaId) andConditions.push({ areaId: parseInt(areaId) });
  if (vanId) andConditions.push({ vanId: parseInt(vanId) });
  
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
  const dateRange = await prisma.salesInvoice.aggregate({
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
  const invoiceRange = await prisma.salesInvoice.aggregate({
    where,
    _min: { invoiceNo: true },
    _max: { invoiceNo: true },
  });

  // 5. Distinct areas for filter display
  const invoicesWithArea = await prisma.salesInvoice.findMany({
    where,
    select: { area: { select: { name: true } } },
    distinct: ["areaId"],
  });
  const areas = [
    ...new Set(
      invoicesWithArea
        .map((inv) => inv.area?.name)
        .filter((name) => name && name.length > 0),
    ),
  ];

  // 6. Fetch all invoices with salesman details and items for aggregation
  const invoices = await prisma.salesInvoice.findMany({
    where,
    select: {
      id: true,
      invoiceNo: true,
      invoiceDate: true,
      finalAmount: true,
      scheme1: true,
      tax: true,
      discountPercent: true,
      salesmanId: true,
      salesman: { select: { id: true, name: true } },
      items: {
        select: {
          finalAmount: true,
          schAmount: true,
          taxAmount: true,
          totalAmount: true,
        },
      },
    },
  });

  // 7. Aggregate by salesman
  const salesmanMap = new Map();

  for (const invoice of invoices) {
    if (!invoice.salesmanId) continue;
    
    const salesmanId = invoice.salesmanId;
    const salesmanName = invoice.salesman?.name || `Salesman ${salesmanId}`;
    
    if (!salesmanMap.has(salesmanId)) {
      salesmanMap.set(salesmanId, {
        salesmanId,
        salesmanName,
        totalDiscount: 0, // Always 0 as per requirement
        totalSchemeAmount: 0,
        totalGST: 0,
        finalAmount: 0,
        invoiceCount: 0,
      });
    }
    
    const agg = salesmanMap.get(salesmanId);
    
    // Calculate scheme amount from items (sum of schAmount) or use invoice scheme1
    const itemSchemeTotal = invoice.items.reduce((sum, item) => sum + (item.schAmount || 0), 0);
    agg.totalSchemeAmount += itemSchemeTotal > 0 ? itemSchemeTotal : (invoice.scheme1 || 0);
    
    // Calculate GST from items taxAmount or invoice tax
    const itemTaxTotal = invoice.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    agg.totalGST += itemTaxTotal > 0 ? itemTaxTotal : (invoice.tax || 0);
    
    agg.finalAmount += invoice.finalAmount || 0;
    agg.invoiceCount += 1;
  }

  // 8. Convert map to array
  let allSalesmen = Array.from(salesmanMap.values());

  // 9. Compute grand totals
  const grandTotals = allSalesmen.reduce(
    (acc, salesman) => {
      acc.totalDiscount += salesman.totalDiscount;
      acc.totalSchemeAmount += salesman.totalSchemeAmount;
      acc.totalGST += salesman.totalGST;
      acc.finalAmount += salesman.finalAmount;
      acc.invoiceCount += salesman.invoiceCount;
      return acc;
    },
    {
      totalDiscount: 0,
      totalSchemeAmount: 0,
      totalGST: 0,
      finalAmount: 0,
      invoiceCount: 0,
    },
  );

  // 10. Sort by salesman name and paginate
  allSalesmen.sort((a, b) => a.salesmanName.localeCompare(b.salesmanName));
  const totalSalesmen = allSalesmen.length;
  const totalPages = Math.ceil(totalSalesmen / validatedLimit);
  const paginatedSalesmen = allSalesmen.slice(skip, skip + validatedLimit);

  // 11. Build response
  return sendResponse(
    res,
    true,
    {
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        invoiceNo: invoiceNo || null,
        customerId: customerId ? parseInt(customerId) : null,
        areaId: areaId ? parseInt(areaId) : null,
        vanId: vanId ? parseInt(vanId) : null,
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
      salesmanData: paginatedSalesmen,
      grandTotals,
      pagination: {
        total: totalSalesmen,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Salesman-wise PDF data retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// Export all functions as a controller object
// --------------------------------------------------------------------
export const salesController = {
  createSale,
  getAllSales,
  getSaleById,
  updateSale,
  deleteSale,
  getActiveSales,
  getSalesReport,
  getAreaWiseSalesReport,
  getSalesmanWiseSalesReport,

  // New report APIs
  getSalesSummaryReportPDFData,
  getSalesRegisterPDFData,
  getAreaWisePDFData,
  getSalesmanWisePDFData,
};
