import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../../utils/index.js";
import { createNotification } from "../../utils/notificationHelper.js";
import { groupByMonth } from "./salesHelper.js";
import { formatDateForFilename } from "../../helper/commonHelper.js";
import ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ExcelJS from "exceljs";
import QRCode from "qrcode";
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
    await createNotification({
  title: "New Sales Invoice Created",
  message: `Sales invoice "${updated.invoiceNo}" has been created by ${req.user?.username || 'Admin'}`,
  type: "success",
  section: null,
  page: "Sales"
}, res);
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
    await createNotification({
  title: "Sales Invoice Updated",
  message: `Sales invoice "${updatedInvoice.invoiceNo}" has been updated by ${req.user?.username || 'Admin'}`,
  type: "info",
  section: null,
  page: "Sales"
}, res);
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
    await createNotification({
  title: "Sales Invoice Deleted",
  message: `Sales invoice "${invoice.invoiceNo}" has been deleted by ${req.user?.username || 'Admin'}`,
  type: "warning",
  section: null,
  page: "Sales"
}, res);
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
    invoiceNo = "",
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
      customer: invoice.customer,
      totalAmount,
    };
  });

  return sendResponse(
    res,
    true,
    { report: reportData },
    "Sales report generated successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 8. GET AREA-WISE SALES REPORT (grouped by area with invoice details)
// --------------------------------------------------------------------
export const getAreaWiseSalesReport = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
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
      customerName:
        invoice.customer?.companyName || invoice.customer?.personName || "",
    });
  });

  // Convert to array and sort by area name
  const reportData = Array.from(areaMap.values()).sort((a, b) =>
    a.areaName.localeCompare(b.areaName),
  );

  return sendResponse(
    res,
    true,
    { report: reportData },
    "Area-wise sales report generated successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// 9. GET SALESMAN-WISE SALES REPORT (grouped by salesman with invoice details)
// --------------------------------------------------------------------
export const getSalesmanWiseSalesReport = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
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
      customerName:
        invoice.customer?.companyName || invoice.customer?.personName || "",
    });
  });

  // Convert to array and sort by salesman name
  const reportData = Array.from(salesmanMap.values()).sort((a, b) =>
    a.salesmanName.localeCompare(b.salesmanName),
  );

  return sendResponse(
    res,
    true,
    { report: reportData },
    "Salesman-wise sales report generated successfully",
    statusType.OK,
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
// DOWNLOAD SALES SUMMARY REPORT AS PDF (with history save)
// --------------------------------------------------------------------
export const downloadSalesSummaryReportPDF = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    customerId,
    areaId,
    vanId,
    salesmanId,
    productGroupId,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // 1. Build WHERE clause for invoices (same as preview, but no pagination)
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

  // 2. Get date ranges
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

  // 6. Fetch all items with product and batch (no pagination)
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

  // 9. Sort by product code
  allProducts.sort((a, b) => a.productCode.localeCompare(b.productCode));

  // 10. Compute totals for all products
  const totals = allProducts.reduce(
    (acc, product) => {
      acc.totalMqty += product.totalMqty;
      acc.totalUnit += product.totalUnit;
      acc.totalUnitsSold += product.totalUnitsSold;
      acc.fQty += product.fQty;
      acc.rep += 0; // REP is always 0
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
      customerId: customerId ? parseInt(customerId) : null,
      areaId: areaId ? parseInt(areaId) : null,
      vanId: vanId ? parseInt(vanId) : null,
      salesmanId: salesmanId ? parseInt(salesmanId) : null,
      productGroupId: productGroupId ? parseInt(productGroupId) : null,
    },
  };

  // 12. Render HTML using EJS
  const templateName = "salesSummaryReport.ejs";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const templatePath = path.join(__dirname, "../../views/sales", templateName);

  // Helper function for date formatting
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

  // Footer template for page numbers and shop name
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

  const fromStr = formatDateForFilename(reportData.dateRange.from);
  const toStr = formatDateForFilename(reportData.dateRange.to);
  const pdfFileName = `sales-summary-${fromStr}_to_${toStr}.pdf`;

  // 14. Save report history with template name
  await prisma.salesReportHistory.create({
    data: {
      userId: req.user.id,
      type: "pdf",
      template: templateName,
      tab: "summary",
      fileName: pdfFileName,
      data: JSON.stringify(reportData),
    },
  });

  // 15. Send PDF as response
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  return res.end(pdfBuffer, "binary");
});

// --------------------------------------------------------------------
// DOWNLOAD SALES SUMMARY REPORT AS EXCEL
// --------------------------------------------------------------------
export const downloadSalesSummaryReportExcel = asyncHandler(
  async (req, res) => {
    const {
      fromDate,
      toDate,
      invoiceNo = "",
      customerId,
      areaId,
      vanId,
      salesmanId,
      productGroupId,
    } = req.query;

    const prisma = getPrismaOrFail(res);
    if (!prisma) return;

    // ----- Reuse the same data aggregation logic as PDF -----
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

    // 2. Get date ranges
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

    // 8. Convert map to array
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

    // 9. Sort by product code
    allProducts.sort((a, b) => a.productCode.localeCompare(b.productCode));

    // 10. Compute totals
    const totals = allProducts.reduce(
      (acc, product) => {
        acc.totalMqty += product.totalMqty;
        acc.totalUnit += product.totalUnit;
        acc.totalUnitsSold += product.totalUnitsSold;
        acc.fQty += product.fQty;
        acc.rep += 0;
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

    // 11. Prepare data object
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
        customerId: customerId ? parseInt(customerId) : null,
        areaId: areaId ? parseInt(areaId) : null,
        vanId: vanId ? parseInt(vanId) : null,
        salesmanId: salesmanId ? parseInt(salesmanId) : null,
        productGroupId: productGroupId ? parseInt(productGroupId) : null,
      },
    };
    // ----- End of data aggregation -----

    // ----- Generate Excel -----
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Summary");

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
    titleRow.getCell(1).value = "Sales Summary Report";
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
        product.totalUnitsSold,
        product.fQty,
        0, // REP
        product.dQty,
        product.saleRate.toFixed(2),
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
        reportData.totals.totalUnitsSold,
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
      column.width = Math.min(maxLength + 2, 20);
    });

    const fromStr = formatDateForFilename(reportData.dateRange.from);
    const toStr = formatDateForFilename(reportData.dateRange.to);
    const excelFileName = `sales-summary-${fromStr}_to_${toStr}.xlsx`;

    // ----- Save history -----
    await prisma.salesReportHistory.create({
      data: {
        userId: req.user.id,
        type: "excel",
        tab: "summary",
        template: "salesSummaryReport.xlsx",
        fileName: excelFileName,
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
// DOWNLOAD SALES REGISTER REPORT AS PDF
// --------------------------------------------------------------------
export const downloadSalesRegisterReportPDF = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    customerId,
    areaId,
    vanId,
    salesmanId,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

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

  // 6. Get all invoices with customer name (no pagination for PDF)
  const invoices = await prisma.salesInvoice.findMany({
    where,
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

  // 7. Compute total finalAmount for all filtered invoices
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
    cash: "",
    cheque: "",
    balance: inv.finalAmount,
  }));

  // 9. Prepare data object for template and history
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
    totals: {
      totalAmount: overallTotalAmount,
      totalInvoices,
    },
    filters: {
      fromDate: fromDate || null,
      toDate: toDate || null,
      invoiceNo: invoiceNo || null,
      customerId: customerId ? parseInt(customerId) : null,
      areaId: areaId ? parseInt(areaId) : null,
      vanId: vanId ? parseInt(vanId) : null,
      salesmanId: salesmanId ? parseInt(salesmanId) : null,
    },
  };

  // 10. Render HTML using EJS
  const templateName = "salesRegisterReport.ejs";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const templatePath = path.join(__dirname, "../../views/sales", templateName);

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

  // 11. Generate PDF with Puppeteer
  const browser = await puppeteer.launch({ headless: true });
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

  const fromStr = formatDateForFilename(reportData.dateRange.from);
  const toStr = formatDateForFilename(reportData.dateRange.to);
  const pdfFileName = `sales-register-${fromStr}_to_${toStr}.pdf`;

  // 12. Save report history
  await prisma.salesReportHistory.create({
    data: {
      userId: req.user.id,
      type: "pdf",
      tab: "register",
      template: templateName,
      fileName: pdfFileName,
      data: JSON.stringify(reportData),
    },
  });

  // 13. Send PDF as response
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  return res.end(pdfBuffer, "binary");
});

// --------------------------------------------------------------------
// DOWNLOAD SALES REGISTER REPORT AS EXCEL
// --------------------------------------------------------------------
export const downloadSalesRegisterReportExcel = asyncHandler(
  async (req, res) => {
    const {
      fromDate,
      toDate,
      invoiceNo = "",
      customerId,
      areaId,
      vanId,
      salesmanId,
    } = req.query;

    const prisma = getPrismaOrFail(res);
    if (!prisma) return;

    // 1. Build WHERE clause
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

    // 2. Get date ranges
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

    // 6. Get all invoices
    const invoices = await prisma.salesInvoice.findMany({
      where,
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

    // 7. Compute totals
    const totalAggregate = await prisma.salesInvoice.aggregate({
      where,
      _sum: { finalAmount: true },
      _count: true,
    });
    const overallTotalAmount = totalAggregate._sum.finalAmount || 0;
    const totalInvoices = totalAggregate._count;

    // 8. Format data
    const formattedInvoices = invoices.map((inv) => ({
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.invoiceDate,
      customerName: inv.customer?.companyName || inv.customer?.personName || "",
      amount: inv.finalAmount,
      cash: "",
      cheque: "",
      balance: inv.finalAmount,
    }));

    // 9. Prepare report data
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
      totals: {
        totalAmount: overallTotalAmount,
        totalInvoices,
      },
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        invoiceNo: invoiceNo || null,
        customerId: customerId ? parseInt(customerId) : null,
        areaId: areaId ? parseInt(areaId) : null,
        vanId: vanId ? parseInt(vanId) : null,
        salesmanId: salesmanId ? parseInt(salesmanId) : null,
      },
    };

    // ----- Generate Excel -----
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Register");

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
    titleRow.getCell(1).value = "Sales Register Report";
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.getCell(1).alignment = { horizontal: "left" };

    // Shop name & date range
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

    // Table headers
    const headers = [
      "Sr.",
      "Invoice No",
      "Date",
      "Customer Name",
      "Amount",
      "Cash",
      "Cheque",
      "Balance",
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
    reportData.invoices.forEach((inv, index) => {
      const row = worksheet.addRow([
        index + 1,
        inv.invoiceNo,
        formatDate(inv.invoiceDate),
        inv.customerName,
        inv.amount.toFixed(2),
        inv.cash,
        inv.cheque,
        inv.balance.toFixed(2),
      ]);

      // Align numeric columns right
      [5, 8].forEach((colIndex) => {
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
    const totalRow = worksheet.addRow([
      `Total ${reportData.invoices.length} invoices`,
      "",
      "",
      "",
      reportData.totals.totalAmount.toFixed(2),
      "",
      "",
      reportData.totals.totalAmount.toFixed(2),
    ]);

    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if ([5, 8].includes(colNumber)) {
        cell.alignment = { horizontal: "right" };
        cell.numFmt = "#,##0.00";
      }
    });
    worksheet.mergeCells(`A${totalRow.number}:D${totalRow.number}`);

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength + 2, 30);
    });

    const fromStr = formatDateForFilename(reportData.dateRange.from);
    const toStr = formatDateForFilename(reportData.dateRange.to);
    const excelFileName = `sales-register-${fromStr}_to_${toStr}.xlsx`;

    // Save history
    await prisma.salesReportHistory.create({
      data: {
        userId: req.user.id,
        type: "excel",
        tab: "register",
        template: "salesRegisterReport.xlsx",
        fileName: excelFileName,
        data: JSON.stringify(reportData),
      },
    });

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

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
    const itemSchemeTotal = invoice.items.reduce(
      (sum, item) => sum + (item.schAmount || 0),
      0,
    );
    agg.totalSchemeAmount +=
      itemSchemeTotal > 0 ? itemSchemeTotal : invoice.scheme1 || 0;

    // Calculate GST from items taxAmount or invoice tax
    const itemTaxTotal = invoice.items.reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0,
    );
    agg.totalGST += itemTaxTotal > 0 ? itemTaxTotal : invoice.tax || 0;

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
// DOWNLOAD AREA-WISE REPORT AS PDF
// --------------------------------------------------------------------
export const downloadAreaWiseReportPDF = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    customerId,
    vanId,
    salesmanId,
    productGroupId,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // 1. Build WHERE clause
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

  // 2. Get date ranges
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

  // 6. Fetch all invoices with area details and items
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
        totalDiscount: 0,
        totalSchemeAmount: 0,
        totalGST: 0,
        finalAmount: 0,
        invoiceCount: 0,
      });
    }

    const agg = areaMap.get(areaId);

    const itemSchemeTotal = invoice.items.reduce(
      (sum, item) => sum + (item.schAmount || 0),
      0,
    );
    agg.totalSchemeAmount +=
      itemSchemeTotal > 0 ? itemSchemeTotal : invoice.scheme1 || 0;

    const itemTaxTotal = invoice.items.reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0,
    );
    agg.totalGST += itemTaxTotal > 0 ? itemTaxTotal : invoice.tax || 0;

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

  // 10. Sort by area name
  allAreas.sort((a, b) => a.areaName.localeCompare(b.areaName));

  // 11. Prepare data object
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
    areaData: allAreas,
    grandTotals,
    filters: {
      fromDate: fromDate || null,
      toDate: toDate || null,
      invoiceNo: invoiceNo || null,
      customerId: customerId ? parseInt(customerId) : null,
      vanId: vanId ? parseInt(vanId) : null,
      salesmanId: salesmanId ? parseInt(salesmanId) : null,
      productGroupId: productGroupId ? parseInt(productGroupId) : null,
    },
  };

  // 12. Render HTML
  const templateName = "areaWiseReport.ejs";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const templatePath = path.join(__dirname, "../../views/sales", templateName);

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

  // 13. Generate PDF
  const browser = await puppeteer.launch({ headless: true });
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

  const fromStr = formatDateForFilename(reportData.dateRange.from);
  const toStr = formatDateForFilename(reportData.dateRange.to);
  const pdfFileName = `area-wise-${fromStr}_to_${toStr}.pdf`;

  // 14. Save history
  await prisma.salesReportHistory.create({
    data: {
      userId: req.user.id,
      type: "pdf",
      tab: "area-wise",
      template: templateName,
      fileName: pdfFileName,
      data: JSON.stringify(reportData),
    },
  });

  // 15. Send PDF
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  return res.end(pdfBuffer, "binary");
});

// --------------------------------------------------------------------
// DOWNLOAD AREA-WISE REPORT AS EXCEL
// --------------------------------------------------------------------
export const downloadAreaWiseReportExcel = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    customerId,
    vanId,
    salesmanId,
    productGroupId,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // 1. Build WHERE clause
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

  // 2. Get date ranges
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

  // 6. Fetch all invoices
  const invoices = await prisma.salesInvoice.findMany({
    where,
    select: {
      id: true,
      invoiceNo: true,
      invoiceDate: true,
      finalAmount: true,
      scheme1: true,
      tax: true,
      areaId: true,
      area: { select: { id: true, name: true } },
      items: {
        select: {
          finalAmount: true,
          schAmount: true,
          taxAmount: true,
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
        totalDiscount: 0,
        totalSchemeAmount: 0,
        totalGST: 0,
        finalAmount: 0,
        invoiceCount: 0,
      });
    }

    const agg = areaMap.get(areaId);

    const itemSchemeTotal = invoice.items.reduce(
      (sum, item) => sum + (item.schAmount || 0),
      0,
    );
    agg.totalSchemeAmount +=
      itemSchemeTotal > 0 ? itemSchemeTotal : invoice.scheme1 || 0;

    const itemTaxTotal = invoice.items.reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0,
    );
    agg.totalGST += itemTaxTotal > 0 ? itemTaxTotal : invoice.tax || 0;

    agg.finalAmount += invoice.finalAmount || 0;
    agg.invoiceCount += 1;
  }

  let allAreas = Array.from(areaMap.values());

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

  allAreas.sort((a, b) => a.areaName.localeCompare(b.areaName));

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
    areaData: allAreas,
    grandTotals,
    filters: {
      fromDate: fromDate || null,
      toDate: toDate || null,
      invoiceNo: invoiceNo || null,
      customerId: customerId ? parseInt(customerId) : null,
      vanId: vanId ? parseInt(vanId) : null,
      salesmanId: salesmanId ? parseInt(salesmanId) : null,
      productGroupId: productGroupId ? parseInt(productGroupId) : null,
    },
  };

  // ----- Generate Excel -----
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Area Wise");

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
  worksheet.mergeCells("A1:F1");
  const titleRow = worksheet.getRow(1);
  titleRow.getCell(1).value = "Area-Wise Sales Report";
  titleRow.getCell(1).font = { size: 16, bold: true };
  titleRow.getCell(1).alignment = { horizontal: "left" };

  // Shop name & date range
  worksheet.mergeCells("A2:F2");
  worksheet.getRow(2).getCell(1).value =
    `Shop: ${reportData.user.shop_name || "Your Shop"} | Date: ${formatDate(reportData.dateRange.from)} to ${formatDate(reportData.dateRange.to)}`;
  worksheet.getRow(2).getCell(1).alignment = { horizontal: "center" };

  // Filter details
  worksheet.addRow([]);
  worksheet.addRow([
    `AREA: ${reportData.areas.length ? reportData.areas.join(", ") : "All"}`,
  ]);
  worksheet.addRow([]);

  // Table headers
  const headers = [
    "Sr.",
    "Area Name",
    "Discount",
    "Scheme Amount",
    "GST",
    "Final Amount",
    "Invoice Count",
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
  reportData.areaData.forEach((area, index) => {
    const row = worksheet.addRow([
      index + 1,
      area.areaName,
      area.totalDiscount.toFixed(2),
      area.totalSchemeAmount.toFixed(2),
      area.totalGST.toFixed(2),
      area.finalAmount.toFixed(2),
      area.invoiceCount,
    ]);

    // Align numeric columns right
    [3, 4, 5, 6, 7].forEach((colIndex) => {
      const cell = row.getCell(colIndex);
      cell.alignment = { horizontal: "right" };
      if (colIndex !== 7) cell.numFmt = "#,##0.00";
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

  // Grand Totals row
  const totalRow = worksheet.addRow([
    "Grand Total",
    "",
    reportData.grandTotals.totalDiscount.toFixed(2),
    reportData.grandTotals.totalSchemeAmount.toFixed(2),
    reportData.grandTotals.totalGST.toFixed(2),
    reportData.grandTotals.finalAmount.toFixed(2),
    reportData.grandTotals.invoiceCount,
  ]);

  totalRow.font = { bold: true };
  totalRow.eachCell((cell, colNumber) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    if ([3, 4, 5, 6, 7].includes(colNumber)) {
      cell.alignment = { horizontal: "right" };
      if (colNumber !== 7) cell.numFmt = "#,##0.00";
    }
  });
  worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, cellValue.length);
    });
    column.width = Math.min(maxLength + 2, 30);
  });

  const fromStr = formatDateForFilename(reportData.dateRange.from);
  const toStr = formatDateForFilename(reportData.dateRange.to);
  const excelFileName = `area-wise-${fromStr}_to_${toStr}.xlsx`;

  // Save history
  await prisma.salesReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      tab: "area-wise",
      template: "areaWiseReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify(reportData),
    },
  });

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

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
    const itemSchemeTotal = invoice.items.reduce(
      (sum, item) => sum + (item.schAmount || 0),
      0,
    );
    agg.totalSchemeAmount +=
      itemSchemeTotal > 0 ? itemSchemeTotal : invoice.scheme1 || 0;

    // Calculate GST from items taxAmount or invoice tax
    const itemTaxTotal = invoice.items.reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0,
    );
    agg.totalGST += itemTaxTotal > 0 ? itemTaxTotal : invoice.tax || 0;

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
// DOWNLOAD SALESMAN-WISE REPORT AS PDF
// --------------------------------------------------------------------
export const downloadSalesmanWiseReportPDF = asyncHandler(async (req, res) => {
  const {
    fromDate,
    toDate,
    invoiceNo = "",
    customerId,
    areaId,
    vanId,
    productGroupId,
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // 1. Build WHERE clause
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

  // 2. Get date ranges
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

  // 6. Fetch all invoices with salesman details
  const invoices = await prisma.salesInvoice.findMany({
    where,
    select: {
      id: true,
      invoiceNo: true,
      invoiceDate: true,
      finalAmount: true,
      scheme1: true,
      tax: true,
      salesmanId: true,
      salesman: { select: { id: true, name: true } },
      items: {
        select: {
          finalAmount: true,
          schAmount: true,
          taxAmount: true,
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
        totalDiscount: 0,
        totalSchemeAmount: 0,
        totalGST: 0,
        finalAmount: 0,
        invoiceCount: 0,
      });
    }

    const agg = salesmanMap.get(salesmanId);

    const itemSchemeTotal = invoice.items.reduce(
      (sum, item) => sum + (item.schAmount || 0),
      0,
    );
    agg.totalSchemeAmount +=
      itemSchemeTotal > 0 ? itemSchemeTotal : invoice.scheme1 || 0;

    const itemTaxTotal = invoice.items.reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0,
    );
    agg.totalGST += itemTaxTotal > 0 ? itemTaxTotal : invoice.tax || 0;

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

  // 10. Sort by salesman name
  allSalesmen.sort((a, b) => a.salesmanName.localeCompare(b.salesmanName));

  // 11. Prepare data object
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
    salesmanData: allSalesmen,
    grandTotals,
    filters: {
      fromDate: fromDate || null,
      toDate: toDate || null,
      invoiceNo: invoiceNo || null,
      customerId: customerId ? parseInt(customerId) : null,
      areaId: areaId ? parseInt(areaId) : null,
      vanId: vanId ? parseInt(vanId) : null,
      productGroupId: productGroupId ? parseInt(productGroupId) : null,
    },
  };

  // 12. Render HTML
  const templateName = "salesmanWiseReport.ejs";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const templatePath = path.join(__dirname, "../../views/sales", templateName);

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

  // 13. Generate PDF
  const browser = await puppeteer.launch({ headless: true });
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

  const fromStr = formatDateForFilename(reportData.dateRange.from);
  const toStr = formatDateForFilename(reportData.dateRange.to);
  const pdfFileName = `salesman-wise-${fromStr}_to_${toStr}.pdf`;

  // 14. Save history
  await prisma.salesReportHistory.create({
    data: {
      userId: req.user.id,
      type: "pdf",
      tab: "salesman-wise",
      template: templateName,
      fileName: pdfFileName,
      data: JSON.stringify(reportData),
    },
  });

  // 15. Send PDF
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  return res.end(pdfBuffer, "binary");
});

// --------------------------------------------------------------------
// DOWNLOAD SALESMAN-WISE REPORT AS EXCEL
// --------------------------------------------------------------------
export const downloadSalesmanWiseReportExcel = asyncHandler(
  async (req, res) => {
    const {
      fromDate,
      toDate,
      invoiceNo = "",
      customerId,
      areaId,
      vanId,
      productGroupId,
    } = req.query;

    const prisma = getPrismaOrFail(res);
    if (!prisma) return;

    // 1. Build WHERE clause
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

    // 2. Get date ranges
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

    // 6. Fetch all invoices
    const invoices = await prisma.salesInvoice.findMany({
      where,
      select: {
        id: true,
        invoiceNo: true,
        invoiceDate: true,
        finalAmount: true,
        scheme1: true,
        tax: true,
        salesmanId: true,
        salesman: { select: { id: true, name: true } },
        items: {
          select: {
            finalAmount: true,
            schAmount: true,
            taxAmount: true,
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
          totalDiscount: 0,
          totalSchemeAmount: 0,
          totalGST: 0,
          finalAmount: 0,
          invoiceCount: 0,
        });
      }

      const agg = salesmanMap.get(salesmanId);

      const itemSchemeTotal = invoice.items.reduce(
        (sum, item) => sum + (item.schAmount || 0),
        0,
      );
      agg.totalSchemeAmount +=
        itemSchemeTotal > 0 ? itemSchemeTotal : invoice.scheme1 || 0;

      const itemTaxTotal = invoice.items.reduce(
        (sum, item) => sum + (item.taxAmount || 0),
        0,
      );
      agg.totalGST += itemTaxTotal > 0 ? itemTaxTotal : invoice.tax || 0;

      agg.finalAmount += invoice.finalAmount || 0;
      agg.invoiceCount += 1;
    }

    let allSalesmen = Array.from(salesmanMap.values());

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

    allSalesmen.sort((a, b) => a.salesmanName.localeCompare(b.salesmanName));

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
      salesmanData: allSalesmen,
      grandTotals,
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
        invoiceNo: invoiceNo || null,
        customerId: customerId ? parseInt(customerId) : null,
        areaId: areaId ? parseInt(areaId) : null,
        vanId: vanId ? parseInt(vanId) : null,
        productGroupId: productGroupId ? parseInt(productGroupId) : null,
      },
    };

    // ----- Generate Excel -----
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Salesman Wise");

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
    worksheet.mergeCells("A1:F1");
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = "Salesman-Wise Sales Report";
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.getCell(1).alignment = { horizontal: "left" };

    // Shop name & date range
    worksheet.mergeCells("A2:F2");
    worksheet.getRow(2).getCell(1).value =
      `Shop: ${reportData.user.shop_name || "Your Shop"} | Date: ${formatDate(reportData.dateRange.from)} to ${formatDate(reportData.dateRange.to)}`;
    worksheet.getRow(2).getCell(1).alignment = { horizontal: "center" };

    // Filter details
    worksheet.addRow([]);
    worksheet.addRow([
      `AREA: ${reportData.areas.length ? reportData.areas.join(", ") : "All"}`,
    ]);
    worksheet.addRow([]);

    // Table headers
    const headers = [
      "Sr.",
      "Salesman Name",
      "Discount",
      "Scheme Amount",
      "GST",
      "Final Amount",
      "Invoice Count",
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
    reportData.salesmanData.forEach((salesman, index) => {
      const row = worksheet.addRow([
        index + 1,
        salesman.salesmanName,
        salesman.totalDiscount.toFixed(2),
        salesman.totalSchemeAmount.toFixed(2),
        salesman.totalGST.toFixed(2),
        salesman.finalAmount.toFixed(2),
        salesman.invoiceCount,
      ]);

      // Align numeric columns right
      [3, 4, 5, 6, 7].forEach((colIndex) => {
        const cell = row.getCell(colIndex);
        cell.alignment = { horizontal: "right" };
        if (colIndex !== 7) cell.numFmt = "#,##0.00";
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

    // Grand Totals row
    const totalRow = worksheet.addRow([
      "Grand Total",
      "",
      reportData.grandTotals.totalDiscount.toFixed(2),
      reportData.grandTotals.totalSchemeAmount.toFixed(2),
      reportData.grandTotals.totalGST.toFixed(2),
      reportData.grandTotals.finalAmount.toFixed(2),
      reportData.grandTotals.invoiceCount,
    ]);

    totalRow.font = { bold: true };
    totalRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if ([3, 4, 5, 6, 7].includes(colNumber)) {
        cell.alignment = { horizontal: "right" };
        if (colNumber !== 7) cell.numFmt = "#,##0.00";
      }
    });
    worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength + 2, 30);
    });

    const fromStr = formatDateForFilename(reportData.dateRange.from);
    const toStr = formatDateForFilename(reportData.dateRange.to);
    const excelFileName = `salesman-wise-${fromStr}_to_${toStr}.xlsx`;

    // Save history
    await prisma.salesReportHistory.create({
      data: {
        userId: req.user.id,
        type: "excel",
        tab: "salesman-wise",
        template: "salesmanWiseReport.xlsx",
        fileName: excelFileName,
        data: JSON.stringify(reportData),
      },
    });

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

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
// SALES REPORT HISTORY CONTROLLERS
// --------------------------------------------------------------------

export const getAllSalesReportHistory = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    fileName = "",
    type, // "pdf" or "excel"
    tab, // "summary", "register", "area-wise", "salesman-wise"
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

  // Filter by userId (optional - uncomment if you want only current user's history)
  // andConditions.push({ userId: req.user.id });

  if (fileName) {
    andConditions.push({ fileName: { contains: fileName } });
  }

  if (type) {
    andConditions.push({ type });
  }

  if (tab) {
    andConditions.push({ tab });
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
  const validSortFields = ["fileName", "type", "tab", "createdAt"];
  const orderBy = {
    [validSortFields.includes(sortBy) ? sortBy : "createdAt"]:
      sortOrder === "asc" ? "asc" : "desc",
  };

  // Fetch records
  const [histories, total] = await Promise.all([
    prisma.salesReportHistory.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      include: {
        user: { select: { id: true, username: true, shop_name: true } },
      },
    }),
    prisma.salesReportHistory.count({ where }),
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
    "Sales report history retrieved successfully",
    statusType.OK,
  );
});

export const downloadSalesReportHistoryPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Fetch history record
  const history = await prisma.salesReportHistory.findUnique({
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
  const templateName = history.template; // e.g. "salesSummaryReport.ejs", "salesRegisterReport.ejs", etc.
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const templatePath = path.join(
    __dirname,
    "../../views/sales",
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
  const browser = await puppeteer.launch({ headless: true });
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
});

export const downloadSalesReportHistoryExcel = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    const prisma = getPrismaOrFail(res);
    if (!prisma) return;

    const history = await prisma.salesReportHistory.findUnique({
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

    const workbook = new ExcelJS.Workbook();
    
    // Determine worksheet name based on tab type
    let worksheetName = "Sales Report";
    if (history.tab === "summary") worksheetName = "Sales Summary";
    else if (history.tab === "register") worksheetName = "Sales Register";
    else if (history.tab === "area-wise") worksheetName = "Area Wise";
    else if (history.tab === "salesman-wise") worksheetName = "Salesman Wise";
    
    const worksheet = workbook.addWorksheet(worksheetName);

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

    // Title based on tab type
    let title = "Sales Report";
    if (history.tab === "summary") title = "Sales Summary Report";
    else if (history.tab === "register") title = "Sales Register Report";
    else if (history.tab === "area-wise") title = "Area-Wise Sales Report";
    else if (history.tab === "salesman-wise") title = "Salesman-Wise Sales Report";

    // Title
    const titleColumns = history.tab === "register" ? "A1:G1" : "A1:L1";
    worksheet.mergeCells(titleColumns);
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = title;
    titleRow.getCell(1).font = { size: 16, bold: true };
    titleRow.getCell(1).alignment = { horizontal: "center" };

    // Shop name & date range
    const dateRangeColumns = history.tab === "register" ? "A2:G2" : "A2:L2";
    worksheet.mergeCells(dateRangeColumns);
    worksheet.getRow(2).getCell(1).value =
      `Shop: ${reportData.user?.shop_name || "Your Shop"} | Date: ${formatDate(reportData.dateRange?.from)} to ${formatDate(reportData.dateRange?.to)}`;
    worksheet.getRow(2).getCell(1).alignment = { horizontal: "center" };

    // Filter details
    worksheet.addRow([]);
    
    if (history.tab !== "area-wise" && history.tab !== "salesman-wise") {
      worksheet.addRow([
        `INVOICE: ${reportData.invoiceRange?.start || "—"} to ${reportData.invoiceRange?.end || "—"}`,
      ]);
    }
    
    if (history.tab !== "salesman-wise") {
      worksheet.addRow([
        `AREA: ${reportData.areas?.length ? reportData.areas.join(", ") : "All"}`,
      ]);
    }
    
    if (history.tab === "salesman-wise") {
      worksheet.addRow([
        `AREA: ${reportData.areas?.length ? reportData.areas.join(", ") : "All"}`,
      ]);
    }
    
    worksheet.addRow([]);

    // Headers based on tab type
    let headers = [];
    if (history.tab === "summary") {
      headers = ["Sr.", "P.Code", "Description", "MRP", "BOX", "UNIT", "QTY", "FR", "REP", "DMG", "RATE", "AMT"];
    } else if (history.tab === "register") {
      headers = ["Sr.", "Invoice No", "Date", "Customer Name", "Amount", "Cash", "Cheque", "Balance"];
    } else if (history.tab === "area-wise" || history.tab === "salesman-wise") {
      headers = ["Sr.", history.tab === "area-wise" ? "Area Name" : "Salesman Name", "Discount", "Scheme Amount", "GST", "Final Amount", "Invoice Count"];
    }

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

    // Data rows based on tab type
    if (history.tab === "summary" && reportData.products) {
      reportData.products.forEach((product, index) => {
        const row = worksheet.addRow([
          index + 1,
          product.productCode,
          product.description || "No description",
          (product.mrp || 0).toFixed(2),
          product.totalMqty || 0,
          product.totalUnit || 0,
          product.totalUnitsSold || 0,
          product.fQty || 0,
          0, // REP
          product.dQty || 0,
          (product.saleRate || 0).toFixed(2),
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

      // Totals row for summary
      if (reportData.totals) {
        const totalRow = worksheet.addRow([
          `Total ${reportData.products?.length || 0} products`,
          "",
          "",
          "",
          reportData.totals.totalMqty || 0,
          reportData.totals.totalUnit || 0,
          reportData.totals.totalUnitsSold || 0,
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
    } else if (history.tab === "register" && reportData.invoices) {
      reportData.invoices.forEach((inv, index) => {
        const row = worksheet.addRow([
          index + 1,
          inv.invoiceNo,
          formatDate(inv.invoiceDate),
          inv.customerName,
          (inv.amount || 0).toFixed(2),
          inv.cash || "",
          inv.cheque || "",
          (inv.balance || 0).toFixed(2),
        ]);

        [5, 8].forEach((colIndex) => {
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

      // Totals row for register
      if (reportData.totals) {
        const totalRow = worksheet.addRow([
          `Total ${reportData.invoices.length} invoices`,
          "",
          "",
          "",
          (reportData.totals.totalAmount || 0).toFixed(2),
          "",
          "",
          (reportData.totals.totalAmount || 0).toFixed(2),
        ]);

        totalRow.font = { bold: true };
        totalRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          if ([5, 8].includes(colNumber)) {
            cell.alignment = { horizontal: "right" };
            cell.numFmt = "#,##0.00";
          }
        });
        worksheet.mergeCells(`A${totalRow.number}:D${totalRow.number}`);
      }
    } else if ((history.tab === "area-wise" || history.tab === "salesman-wise") && reportData.areaData) {
      const dataArray = history.tab === "area-wise" ? reportData.areaData : reportData.salesmanData;
      const nameField = history.tab === "area-wise" ? "areaName" : "salesmanName";
      
      dataArray.forEach((item, index) => {
        const row = worksheet.addRow([
          index + 1,
          item[nameField],
          (item.totalDiscount || 0).toFixed(2),
          (item.totalSchemeAmount || 0).toFixed(2),
          (item.totalGST || 0).toFixed(2),
          (item.finalAmount || 0).toFixed(2),
          item.invoiceCount || 0,
        ]);

        [3, 4, 5, 6, 7].forEach((colIndex) => {
          const cell = row.getCell(colIndex);
          cell.alignment = { horizontal: "right" };
          if (colIndex !== 7) cell.numFmt = "#,##0.00";
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

      // Grand Totals row
      if (reportData.grandTotals) {
        const totalRow = worksheet.addRow([
          "Grand Total",
          "",
          (reportData.grandTotals.totalDiscount || 0).toFixed(2),
          (reportData.grandTotals.totalSchemeAmount || 0).toFixed(2),
          (reportData.grandTotals.totalGST || 0).toFixed(2),
          (reportData.grandTotals.finalAmount || 0).toFixed(2),
          reportData.grandTotals.invoiceCount || 0,
        ]);

        totalRow.font = { bold: true };
        totalRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          if ([3, 4, 5, 6, 7].includes(colNumber)) {
            cell.alignment = { horizontal: "right" };
            if (colNumber !== 7) cell.numFmt = "#,##0.00";
          }
        });
        worksheet.mergeCells(`A${totalRow.number}:B${totalRow.number}`);
      }
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength + 2, history.tab === "register" ? 30 : 20);
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
// GET SALES WITH GST DETAILS (for GST reporting/returns)
// --------------------------------------------------------------------
export const getSalesWithGST = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    customerId,
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

  if (customerId) {
    andConditions.push({ customerId: parseInt(customerId) });
  }

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
            email: true,
            address: true,
            gstIN: true,
          },
        },
        area: {
          select: {
            id: true,
            name: true,
          },
        },
        van: {
          select: {
            id: true,
            name: true,
            vehicleNo: true,
          },
        },
        salesman: {
          select: {
            id: true,
            name: true,
            phoneNo: true,
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
                saleRate: true,
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
    prisma.salesInvoice.count({ where }),
  ]);

  // Transform data to GST format (unchanged)
  const gstSales = invoices.map((invoice) => {
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
        unitName: item.product?.unit?.name,
        unitSymbol: item.product?.unit?.symbol,
        quantity: item.aQty,
        unit: item.unit,
        rate: item.rate,
        mrp: item.batch?.mrp,
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
      saleId: invoice.id,
      invoiceId: invoice.invoiceNo,
      customerName:
        invoice.customer?.companyName || invoice.customer?.personName || "",
      gstin: invoice.customer?.gstIN || "",
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
      customerDetails: invoice.customer,
      areaDetails: invoice.area,
      vanDetails: invoice.van,
      salesmanDetails: invoice.salesman,
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
      sales: gstSales,
      summary: {
        totalRecords: total,
        totalGrossAmount: gstSales.reduce((sum, s) => sum + s.grossAmount, 0),
        totalSchemeAmount: gstSales.reduce((sum, s) => sum + s.schemeAmount, 0),
        totalDiscountAmount: gstSales.reduce(
          (sum, s) => sum + s.discountAmount,
          0,
        ),
        totalDamageAmount: gstSales.reduce((sum, s) => sum + s.damageAmount, 0),
        totalTaxableValue: gstSales.reduce((sum, s) => sum + s.taxableValue, 0),
        totalCGST: gstSales.reduce((sum, s) => sum + s.cgstAmount, 0),
        totalSGST: gstSales.reduce((sum, s) => sum + s.sgstAmount, 0),
        totalIGST: gstSales.reduce((sum, s) => sum + s.igstAmount, 0),
        totalCess: gstSales.reduce((sum, s) => sum + s.cessAmount, 0),
        totalFinalAmount: gstSales.reduce((sum, s) => sum + s.finalAmount, 0),
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
    "Sales GST data retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// GET SALES B2C REPORT (B2CS summary)
// --------------------------------------------------------------------
export const getSalesB2C = asyncHandler(async (req, res) => {
  const { fromDate, toDate, sortBy = "place", sortOrder = "asc" } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const andConditions = [{ deleted: false }];
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
  andConditions.push({
    OR: [{ customer: { gstIN: null } }, { customer: { gstIN: "" } }],
  });

  const invoices = await prisma.salesInvoice.findMany({
    where: { AND: andConditions },
    include: {
      customer: { select: { city: true, address: true } },
      items: {
        select: {
          rate: true,
          aQty: true,
          taxRate: true,
          taxAmount: true,
          product: { select: { gstRate: true, cessRate: true } },
        },
      },
    },
  });

  const numberOrZero = (value) => (Number.isFinite(value) ? value : 0);
  const grouped = new Map();
  invoices.forEach((invoice) => {
    const placeRaw =
      invoice.customer?.city ||
      (invoice.customer?.address
        ? invoice.customer.address.split(",").pop()?.trim()
        : "") ||
      "Unknown";
    const place = `27-${placeRaw}`;

    invoice.items.forEach((item) => {
      const rate = numberOrZero(item.taxRate) || numberOrZero(item.product?.gstRate);
      const taxable = numberOrZero(item.rate) * numberOrZero(item.aQty);
      const taxAmt = numberOrZero(item.taxAmount) || (taxable * rate) / 100;
      const cess = taxable * (numberOrZero(item.product?.cessRate) / 100);
      const key = `${place}__${rate}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          type: "B2CS",
          place,
          rate,
          taxable: 0,
          taxAmt: 0,
          cess: 0,
          addCess: 0,
          apmc: 0,
        });
      }
      const row = grouped.get(key);
      row.taxable += taxable;
      row.taxAmt += taxAmt;
      row.cess += cess;
    });
  });

  const rows = Array.from(grouped.values());
  const validSortFields = ["type", "place", "rate", "taxable", "taxAmt", "cess"];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "place";
  rows.sort((a, b) => {
    const left = a[sortField];
    const right = b[sortField];
    if (typeof left === "number" && typeof right === "number") {
      return sortOrder === "desc" ? right - left : left - right;
    }
    return sortOrder === "desc"
      ? String(right).localeCompare(String(left))
      : String(left).localeCompare(String(right));
  });

  const summary = rows.reduce(
    (acc, row) => {
      acc.taxable += row.taxable;
      acc.taxAmt += row.taxAmt;
      acc.cess += row.cess;
      return acc;
    },
    { taxable: 0, taxAmt: 0, cess: 0, addCess: 0, apmc: 0 },
  );

  return sendResponse(
    res,
    true,
    { rows, summary, count: rows.length },
    "Sales B2C data retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// DOWNLOAD SALES B2C REPORT AS EXCEL
// --------------------------------------------------------------------
export const downloadSalesB2CExcel = asyncHandler(async (req, res) => {
  const { fromDate, toDate, sortBy = "place", sortOrder = "asc" } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const andConditions = [{ deleted: false }];
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
  andConditions.push({
    OR: [{ customer: { gstIN: null } }, { customer: { gstIN: "" } }],
  });

  const invoices = await prisma.salesInvoice.findMany({
    where: { AND: andConditions },
    include: {
      customer: { select: { city: true, address: true } },
      items: {
        select: {
          rate: true,
          aQty: true,
          taxRate: true,
          taxAmount: true,
          product: { select: { gstRate: true, cessRate: true } },
        },
      },
    },
  });

  const numberOrZero = (value) => (Number.isFinite(value) ? value : 0);
  const grouped = new Map();
  invoices.forEach((invoice) => {
    const placeRaw =
      invoice.customer?.city ||
      (invoice.customer?.address
        ? invoice.customer.address.split(",").pop()?.trim()
        : "") ||
      "Unknown";
    const place = `27-${placeRaw}`;

    invoice.items.forEach((item) => {
      const rate = numberOrZero(item.taxRate) || numberOrZero(item.product?.gstRate);
      const taxable = numberOrZero(item.rate) * numberOrZero(item.aQty);
      const taxAmt = numberOrZero(item.taxAmount) || (taxable * rate) / 100;
      const cess = taxable * (numberOrZero(item.product?.cessRate) / 100);
      const key = `${place}__${rate}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          type: "B2CS",
          place,
          rate,
          taxable: 0,
          taxAmt: 0,
          cess: 0,
          addCess: 0,
          apmc: 0,
        });
      }
      const row = grouped.get(key);
      row.taxable += taxable;
      row.taxAmt += taxAmt;
      row.cess += cess;
    });
  });
  const rows = Array.from(grouped.values());
  const validSortFields = ["type", "place", "rate", "taxable", "taxAmt", "cess"];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "place";
  rows.sort((a, b) => {
    const left = a[sortField];
    const right = b[sortField];
    if (typeof left === "number" && typeof right === "number") {
      return sortOrder === "desc" ? right - left : left - right;
    }
    return sortOrder === "desc"
      ? String(right).localeCompare(String(left))
      : String(left).localeCompare(String(right));
  });
  const summary = rows.reduce(
    (acc, row) => {
      acc.taxable += row.taxable;
      acc.taxAmt += row.taxAmt;
      acc.cess += row.cess;
      return acc;
    },
    { taxable: 0, taxAmt: 0, cess: 0, addCess: 0, apmc: 0 },
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("B2C Report");
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "MMM",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  worksheet.mergeCells("B1:H1");
  worksheet.getCell("B1").value = "B2C REPORT";
  worksheet.getCell("B1").font = { bold: true, size: 14 };
  worksheet.getCell("B1").alignment = { horizontal: "left" };

  const reportUser = req.user?.id
    ? await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { company_name: true, shop_name: true },
      })
    : null;
  worksheet.getCell("B2").value = reportUser?.company_name || reportUser?.shop_name || "N/A";
  worksheet.getCell("A3").value = "Summary B2CS";
  worksheet.getCell("B3").value = `FROM: ${formatDate(fromDate)}`;
  worksheet.getCell("C3").value = `TO: ${formatDate(toDate)}`;

  const headers = ["TYPE", "PLACE", "RATE", "TAXABLE", "TAX AMT", "CESS", "ADD_CESS", "APMC"];
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAEAEA" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  rows.forEach((rowData) => {
    const row = worksheet.addRow([
      rowData.type,
      rowData.place,
      rowData.rate,
      rowData.taxable,
      rowData.taxAmt,
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
      if (colNumber >= 3 && colNumber <= 8) {
        cell.alignment = { horizontal: "right" };
        cell.numFmt = "#,##0.00";
      }
    });
  });

  const totalRow = worksheet.addRow([
    "Total",
    "",
    "",
    summary.taxable,
    summary.taxAmt,
    summary.cess,
    summary.addCess,
    summary.apmc,
  ]);
  totalRow.font = { bold: true };
  totalRow.eachCell((cell, colNumber) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    if (colNumber >= 4 && colNumber <= 8) {
      cell.alignment = { horizontal: "right" };
      cell.numFmt = "#,##0.00";
    }
  });

  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const val = cell.value?.toString() || "";
      maxLength = Math.max(maxLength, val.length + 2);
    });
    column.width = Math.min(maxLength, 24);
  });

  const fromStr = formatDateForFilename(fromDate || new Date().toISOString());
  const toStr = formatDateForFilename(toDate || new Date().toISOString());
  const excelFileName = `b2c-report-${fromStr}_to_${toStr}.xlsx`;

  await prisma.salesReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      tab: "b2c",
      template: "b2cReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: { fromDate: fromDate || null, toDate: toDate || null, sortBy, sortOrder },
        count: rows.length,
      }),
    },
  });
  await prisma.gstReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      source: "sales",
      reportKey: "b2c",
      template: "b2cReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: { fromDate: fromDate || null, toDate: toDate || null, sortBy, sortOrder },
        count: rows.length,
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
// DOWNLOAD SALES GST AS EXCEL
// --------------------------------------------------------------------
export const downloadSalesGSTExcel = asyncHandler(async (req, res) => {
  const {
    customerId,
    fromDate,
    toDate,
    sortBy = "invoiceDate",
    sortOrder = "desc",
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const andConditions = [{ deleted: false }];

  if (customerId) {
    andConditions.push({ customerId: parseInt(customerId) });
  }

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

  const invoices = await prisma.salesInvoice.findMany({
    where,
    orderBy,
    include: {
      customer: {
        select: {
          id: true,
          companyName: true,
          personName: true,
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
  const worksheet = workbook.addWorksheet("Sales GST");

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
  worksheet.getCell("A1").value = "Sales GST Report";
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "left" };

  const selectedCustomer = customerId
    ? await prisma.customer.findUnique({
        where: { id: parseInt(customerId) },
        select: { companyName: true, personName: true },
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
  worksheet.getCell("A3").value =
    `Customer: ${selectedCustomer?.companyName || selectedCustomer?.personName || "All"}`;
  worksheet.getCell("A4").value = `From Date: ${formatDate(fromDate) || "All"}`;
  worksheet.getCell("A5").value = `To Date: ${formatDate(toDate) || "All"}`;
  worksheet.getCell("A6").value =
    `Sort By: ${sortBy} (${(sortOrder || "desc").toUpperCase()})`;

  worksheet.addRow([]);

  const headers = [
    "Sales ID",
    "Sales Invoice No",
    "Date of Invoice",
    "Party Name",
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
      const cessAmount = taxable * (numberOrZero(item.product?.cessRate) / 100);

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
      invoice.invoiceNo || "",
      formatDate(invoice.invoiceDate),
      invoice.customer?.companyName || invoice.customer?.personName || "",
      invoice.customer?.gstIN || "",
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
  const excelFileName = `sales-gst-${fromStr}_to_${toStr}.xlsx`;

  await prisma.salesReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      tab: "gst",
      template: "salesGSTReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          customerId: customerId ? parseInt(customerId) : null,
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
      source: "sales",
      reportKey: "gst",
      template: "salesGSTReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          customerId: customerId ? parseInt(customerId) : null,
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
// DOWNLOAD GSTR1 REPORT AS EXCEL
// --------------------------------------------------------------------
export const downloadGSTR1Excel = asyncHandler(async (req, res) => {
  const {
    customerId,
    fromDate,
    toDate,
    sortBy = "invoiceDate",
    sortOrder = "desc",
  } = req.query;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const andConditions = [{ deleted: false }];

  if (customerId) {
    andConditions.push({ customerId: parseInt(customerId) });
  }

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

  const invoices = await prisma.salesInvoice.findMany({
    where,
    orderBy,
    include: {
      customer: {
        select: {
          companyName: true,
          personName: true,
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
          finalAmount: true,
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
  const worksheet = workbook.addWorksheet("GSTR1 Report");
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
    "SALES_DATE",
    "PARTY_NAME",
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
    "FINAL AMT",
  ];

  worksheet.mergeCells("A1:W1");
  worksheet.getCell("A1").value = "GSTR1 REPORT";
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "left" };

  const selectedCustomer = customerId
    ? await prisma.customer.findUnique({
        where: { id: parseInt(customerId) },
        select: { companyName: true, personName: true },
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
  worksheet.getCell("A3").value =
    `Customer: ${selectedCustomer?.companyName || selectedCustomer?.personName || "All"}`;
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
      const finalAmt =
        numberOrZero(item.finalAmount) || taxableValue + sgst + cgst + cess;
      const discount =
        (numberOrZero(invoice.finalAmount) * numberOrZero(invoice.discountPercent)) /
        100;

      const row = worksheet.addRow([
        invoice.invoiceNo || "",
        formatDate(invoice.invoiceDate),
        invoice.customer?.companyName || invoice.customer?.personName || "",
        getStateName(invoice.customer?.address),
        invoice.customer?.gstIN || "",
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
        finalAmt,
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        if ([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 23].includes(colNumber)) {
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
  const excelFileName = `gstr1-report-${fromStr}_to_${toStr}.xlsx`;

  await prisma.salesReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      tab: "gstr1",
      template: "gstr1Report.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          customerId: customerId ? parseInt(customerId) : null,
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
      source: "sales",
      reportKey: "gstr1",
      template: "gstr1Report.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          customerId: customerId ? parseInt(customerId) : null,
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

const buildHSNSummaryRows = async (prisma, source, fromDate, toDate) => {
  const numberOrZero = (value) => (Number.isFinite(value) ? value : 0);
  const grouped = new Map();

  const upsertRow = (rowData) => {
    const key = `${rowData.hsnSac}|${rowData.tax}|${rowData.uqc}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        goodsOrService: rowData.goodsOrService,
        hsnSac: rowData.hsnSac,
        tax: rowData.tax,
        uqc: rowData.uqc,
        totalQty: 0,
        totalValue: 0,
        taxable: 0,
        igst: 0,
        cgstAmt: 0,
        sgstAmt: 0,
        cess: 0,
        addCess: 0,
        apmc: 0,
      });
    }
    const row = grouped.get(key);
    row.totalQty += rowData.totalQty;
    row.totalValue += rowData.totalValue;
    row.taxable += rowData.taxable;
    row.igst += rowData.igst;
    row.cgstAmt += rowData.cgstAmt;
    row.sgstAmt += rowData.sgstAmt;
    row.cess += rowData.cess;
    row.addCess += rowData.addCess;
    row.apmc += rowData.apmc;
  };

  const buildDateFilter = () => {
    if (!fromDate && !toDate) return undefined;
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
    return dateFilter;
  };

  const dateFilter = buildDateFilter();

  if (source === "sales" || source === "all") {
    const salesWhere = dateFilter
      ? { deleted: false, invoiceDate: dateFilter }
      : { deleted: false };

    const salesInvoices = await prisma.salesInvoice.findMany({
      where: salesWhere,
      include: {
        items: {
          select: {
            rate: true,
            aQty: true,
            taxRate: true,
            taxAmount: true,
            product: {
              select: {
                description: true,
                hsnSacCode: true,
                gstRate: true,
                gstInclusive: true,
                cessRate: true,
                unit: { select: { name: true, symbol: true } },
              },
            },
          },
        },
      },
    });

    salesInvoices.forEach((invoice) => {
      invoice.items.forEach((item) => {
        const rate = numberOrZero(item.rate);
        const qty = numberOrZero(item.aQty);
        const gstRate = numberOrZero(item.taxRate) || numberOrZero(item.product?.gstRate);
        const totalValue = rate * qty;
        const taxAmount =
          numberOrZero(item.taxAmount) ||
          (gstRate > 0 ? (totalValue * gstRate) / 100 : 0);
        const taxable = item.product?.gstInclusive ?? true ? totalValue - taxAmount : totalValue;
        const cess = taxable * (numberOrZero(item.product?.cessRate) / 100);
        const igst = 0;
        const cgstAmt = taxAmount / 2;
        const sgstAmt = taxAmount / 2;

        upsertRow({
          goodsOrService: item.product?.description || "Goods",
          hsnSac: item.product?.hsnSacCode || "",
          tax: gstRate,
          uqc: item.product?.unit?.symbol || item.product?.unit?.name || "",
          totalQty: qty,
          totalValue,
          taxable,
          igst,
          cgstAmt,
          sgstAmt,
          cess,
          addCess: 0,
          apmc: 0,
        });
      });
    });
  }

  if (source === "purchase" || source === "all") {
    const purchaseWhere = dateFilter
      ? { deleted: false, invoiceDate: dateFilter }
      : { deleted: false };

    const purchaseInvoices = await prisma.purchaseInvoice.findMany({
      where: purchaseWhere,
      include: {
        items: {
          select: {
            rate: true,
            aQty: true,
            taxRate: true,
            taxAmount: true,
            product: {
              select: {
                description: true,
                hsnSacCode: true,
                gstRate: true,
                gstInclusive: true,
                cessRate: true,
                unit: { select: { name: true, symbol: true } },
              },
            },
          },
        },
      },
    });

    purchaseInvoices.forEach((invoice) => {
      invoice.items.forEach((item) => {
        const rate = numberOrZero(item.rate);
        const qty = numberOrZero(item.aQty);
        const gstRate = numberOrZero(item.taxRate) || numberOrZero(item.product?.gstRate);
        const totalValue = rate * qty;
        const taxAmount =
          numberOrZero(item.taxAmount) ||
          (gstRate > 0 ? (totalValue * gstRate) / 100 : 0);
        const taxable = item.product?.gstInclusive ?? true ? totalValue - taxAmount : totalValue;
        const cess = taxable * (numberOrZero(item.product?.cessRate) / 100);
        const igst = 0;
        const cgstAmt = taxAmount / 2;
        const sgstAmt = taxAmount / 2;

        upsertRow({
          goodsOrService: item.product?.description || "Goods",
          hsnSac: item.product?.hsnSacCode || "",
          tax: gstRate,
          uqc: item.product?.unit?.symbol || item.product?.unit?.name || "",
          totalQty: qty,
          totalValue,
          taxable,
          igst,
          cgstAmt,
          sgstAmt,
          cess,
          addCess: 0,
          apmc: 0,
        });
      });
    });
  }

  return Array.from(grouped.values()).sort((a, b) =>
    String(a.hsnSac).localeCompare(String(b.hsnSac)),
  );
};

// --------------------------------------------------------------------
// GET HSN SUMMARY REPORT
// --------------------------------------------------------------------
export const getHSNSummaryReport = asyncHandler(async (req, res) => {
  const { source = "all", fromDate, toDate } = req.query;
  const normalizedSource = ["all", "sales", "purchase"].includes(source)
    ? source
    : "all";

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const rows = await buildHSNSummaryRows(
    prisma,
    normalizedSource,
    fromDate,
    toDate,
  );

  return sendResponse(
    res,
    true,
    { rows, count: rows.length, source: normalizedSource, filters: { fromDate: fromDate || null, toDate: toDate || null } },
    "HSN summary report retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// DOWNLOAD HSN SUMMARY REPORT AS EXCEL
// --------------------------------------------------------------------
export const downloadHSNSummaryExcel = asyncHandler(async (req, res) => {
  const { source = "all", fromDate, toDate } = req.query;
  const normalizedSource = ["all", "sales", "purchase"].includes(source)
    ? source
    : "all";

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const rows = await buildHSNSummaryRows(
    prisma,
    normalizedSource,
    fromDate,
    toDate,
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("HSN Summary");

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB");
    } catch {
      return "";
    }
  };

  worksheet.mergeCells("A1:M1");
  worksheet.getCell("A1").value = "HSN SUMMARY REPORT";
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
  worksheet.getCell("A3").value = `Source: ${normalizedSource.toUpperCase()}`;
  worksheet.getCell("A4").value = `From Date: ${formatDate(fromDate) || "All"}`;
  worksheet.getCell("A5").value = `To Date: ${formatDate(toDate) || "All"}`;
  worksheet.addRow([]);

  const headers = [
    "Goods / Service",
    "HSN/SAC",
    "TAX",
    "UQC(Unit Quantity Code)",
    "Total QTY",
    "Total Value",
    "TAXABLE",
    "IGST",
    "CGST_AMT",
    "SGST_AMT",
    "CESS",
    "ADD_CESS",
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
      rowData.goodsOrService,
      rowData.hsnSac,
      rowData.tax,
      rowData.uqc,
      rowData.totalQty,
      rowData.totalValue,
      rowData.taxable,
      rowData.igst,
      rowData.cgstAmt,
      rowData.sgstAmt,
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
      if ([3, 5, 6, 7, 8, 9, 10, 11, 12, 13].includes(colNumber)) {
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
    column.width = Math.min(maxLength, 35);
  });

  const fromStr = formatDateForFilename(fromDate || new Date().toISOString());
  const toStr = formatDateForFilename(toDate || new Date().toISOString());
  const excelFileName = `hsn-summary-${normalizedSource}-${fromStr}_to_${toStr}.xlsx`;

  await prisma.salesReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      tab: "hsn-summary",
      template: "hsnSummaryReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          source: normalizedSource,
          fromDate: fromDate || null,
          toDate: toDate || null,
        },
        totalRows: rows.length,
      }),
    },
  });
  await prisma.gstReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      source: "sales",
      reportKey: "hsn-summary",
      template: "hsnSummaryReport.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: {
          source: normalizedSource,
          fromDate: fromDate || null,
          toDate: toDate || null,
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
// GET SALES GST MONTHLY REPORT
// --------------------------------------------------------------------
export const getSalesGSTMonthly = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;

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

  // Fetch all invoices in date range with related data
  const invoices = await prisma.salesInvoice.findMany({
    where,
    orderBy: { invoiceDate: "asc" },
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
      area: {
        select: {
          id: true,
          name: true,
        },
      },
      van: {
        select: {
          id: true,
          name: true,
          vehicleNo: true,
        },
      },
      salesman: {
        select: {
          id: true,
          name: true,
          phoneNo: true,
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
              saleRate: true,
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
  const monthlyData = groupByMonth(invoices, "sales");

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
      },
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        totalMonths: monthlyData.length,
      },
      monthlyData,
      grandTotals,
    },
    "Sales GST monthly report retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// DOWNLOAD SALES GST MONTHLY REPORT AS EXCEL
// --------------------------------------------------------------------
export const downloadSalesGSTMonthlyExcel = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;

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

  const invoices = await prisma.salesInvoice.findMany({
    where: {
      deleted: false,
      invoiceDate: { gte: startDate.toISOString(), lte: endDate.toISOString() },
    },
    orderBy: { invoiceDate: "asc" },
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
              saleRate: true,
            },
          },
        },
      },
      user: { select: { id: true, shop_name: true, company_name: true } },
    },
  });

  const monthlyData = groupByMonth(invoices, "sales");
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
  const worksheet = workbook.addWorksheet("Sales Monthly GST");
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
  worksheet.getCell("A1").value = "Sales Monthly GST Report";
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
  const excelFileName = `sales-monthly-gst-${fromStr}_to_${toStr}.xlsx`;

  await prisma.salesReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      tab: "sales-monthly-gst",
      template: "salesMonthlyGST.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: { fromDate, toDate },
        totalMonths: monthlyData.length,
      }),
    },
  });
  await prisma.gstReportHistory.create({
    data: {
      userId: req.user.id,
      type: "excel",
      source: "sales",
      reportKey: "sales-monthly-gst",
      template: "salesMonthlyGST.xlsx",
      fileName: excelFileName,
      data: JSON.stringify({
        filters: { fromDate, toDate },
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
// GET SALES INVOICE BILL PREVIEW (with UPI QR code)
// --------------------------------------------------------------------

const getSalesBillPreviewPayload = async (prisma, saleId) => {
  const sale = await prisma.salesInvoice.findFirst({
    where: {
      id: saleId,
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
          gstIN: true,
        },
      },
      area: { select: { id: true, name: true } },
      van: { select: { id: true, name: true, vehicleNo: true } },
      salesman: { select: { id: true, name: true, phoneNo: true } },
      user: {
        // The creator of the invoice (the current user)
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
              saleRate: true,
            },
          },
        },
      },
    },
  });

  if (!sale) return null;

  const taxBreakdownMap = new Map();
  (sale.items || []).forEach((item) => {
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

  // Generate UPI QR code if user has UPI ID
  let upiQrCode = null;
  if (sale.user?.upi_id) {
    const payeeName = encodeURIComponent(
      sale.user.company_name || sale.user.shop_name || "Payee",
    );
    const upiString = `upi://pay?pa=${sale.user.upi_id}&pn=${payeeName}&am=${sale.finalAmount}&cu=INR`;

    try {
      upiQrCode = await QRCode.toDataURL(upiString);
    } catch (qrError) {
      console.error("QR generation error:", qrError);
      // Continue without QR code
    }
  }

  // Prepare response
  const responseData = {
    sale,
    taxBreakdown,
    upiQrCode,
    signature: sale.user?.signature || null,
    companyLogo: sale.user?.company_logo || null,
  };

  return responseData;
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

export const getSalesBillPreview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const saleId = parseInt(id, 10);
  if (Number.isNaN(saleId)) {
    return sendResponse(
      res,
      false,
      null,
      "Invalid sales invoice id",
      statusType.BAD_REQUEST,
    );
  }

  const responseData = await getSalesBillPreviewPayload(prisma, saleId);
  if (!responseData) {
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
    responseData,
    "Bill preview data retrieved successfully",
    statusType.OK,
  );
});

// --------------------------------------------------------------------
// DOWNLOAD SALES INVOICE BILL PREVIEW AS PDF
// --------------------------------------------------------------------
export const downloadSalesBillPreviewPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const saleId = parseInt(id, 10);
  if (Number.isNaN(saleId)) {
    return sendResponse(
      res,
      false,
      null,
      "Invalid sales invoice id",
      statusType.BAD_REQUEST,
    );
  }

  const previewData = await getSalesBillPreviewPayload(prisma, saleId);
  if (!previewData) {
    return sendResponse(
      res,
      false,
      null,
      "Sales invoice not found",
      statusType.NOT_FOUND,
    );
  }

  const templateName = "salesInvoicePreview.ejs";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const templatePath = path.join(__dirname, "../../views/sales", templateName);

  const { sale, upiQrCode, taxBreakdown } = previewData;

  const companyName =
    sale.user?.company_name || sale.user?.shop_name || "Sales Invoice";

  const html = await ejs.renderFile(templatePath, {
    sale,
    taxBreakdown: taxBreakdown || [],
    upiQrCode,
    companyName,
    companyAddress: sale.user?.address || "",
    companyPhone: sale.user?.phone || "",
    customerName: sale.customer?.companyName || sale.customer?.personName || "",
    customerAddress: sale.customer?.address || "",
    customerPhone: sale.customer?.phoneNo || "",
    customerGstin: sale.customer?.gstIN || "",
    companyLogoUrl: getPublicImageUrl(req, sale.user?.company_logo || null),
    signatureUrl: getPublicImageUrl(req, sale.user?.signature || null),
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

  const browser = await puppeteer.launch({ headless: true });
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

  const safeInvoiceNo = (sale.invoiceNo || `sale-${sale.id}`)
    .toString()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const pdfFileName = `sales-invoice-${safeInvoiceNo}.pdf`;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${pdfFileName}"`);
  res.setHeader("Content-Length", pdfBuffer.length);

  return res.end(pdfBuffer, "binary");
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
  downloadSalesSummaryReportExcel,
  downloadSalesSummaryReportPDF,
  getSalesRegisterPDFData,
  downloadSalesRegisterReportPDF,
  downloadSalesRegisterReportExcel,
  getAreaWisePDFData,
  downloadAreaWiseReportPDF,
  downloadAreaWiseReportExcel,
  getSalesmanWisePDFData,
  downloadSalesmanWiseReportPDF,
  downloadSalesmanWiseReportExcel,

  //history
  getAllSalesReportHistory,
  downloadSalesReportHistoryExcel,
  downloadSalesReportHistoryPDF,

  getSalesWithGST,
  getSalesB2C,
  getHSNSummaryReport,
  downloadHSNSummaryExcel,
  downloadSalesB2CExcel,
  downloadSalesGSTExcel,
  downloadGSTR1Excel,
  getSalesGSTMonthly,
  downloadSalesGSTMonthlyExcel,

  getSalesBillPreview,
  downloadSalesBillPreviewPDF,
};
