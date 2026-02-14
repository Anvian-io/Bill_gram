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
const createSalesHistory = async (prisma, invoice, items, customerId, areaId, vanId, salesmanId) => {
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
            totalAmount: item.totalAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            sch1Percent: item.sch1Percent || 0,
            sch1Amount: item.sch1Amount || 0,
            sch2Percent: item.sch2Percent || 0,
            sch2Amount: item.sch2Amount || 0,
          },
        });

        // Decrease batch stock (negative delta)
        await updateBatchStock(tx, item.batchId, -item.aQty);
      }

      // 3. Create sales history entries
      await createSalesHistory(tx, invoice, items, customerId,areaId,vanId,salesmanId);

      return invoice;
    });

    // Optional: update invoiceNo with prefix (like purchase controller does)
    const updated = await prisma.salesInvoice.update({
      where: { id: result.id },
      data: { invoiceNo: `SINV-${result.id}` }, // or any format you prefer
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

  if (fromDate || toDate) {
    const dateFilter = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);
    andConditions.push({ invoiceDate: dateFilter });
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
    { name: 'areaId', value: areaId },
    { name: 'vanId', value: vanId },
    { name: 'salesmanId', value: salesmanId },
    { name: 'address', value: address },
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
              totalAmount: item.totalAmount,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              sch1Percent: item.sch1Percent || 0,
              sch1Amount: item.sch1Amount || 0,
              sch2Percent: item.sch2Percent || 0,
              sch2Amount: item.sch2Amount || 0,
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
          salesmanId !== undefined
            ? salesmanId
            : existingInvoice.salesmanId,
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
// Export all functions as a controller object
// --------------------------------------------------------------------
export const salesController = {
  createSale,
  getAllSales,
  getSaleById,
  updateSale,
  deleteSale,
  getActiveSales,
};
