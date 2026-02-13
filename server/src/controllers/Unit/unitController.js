import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../../utils/index.js";

// Create Unit
export const createUnit = asyncHandler(async (req, res) => {
  const { name, symbol, status = true } = req.body;

  // Validate required fields
  if (!name || !symbol) {
    return sendResponse(
      res,
      false,
      null,
      "Name and symbol are required",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if unit with same name or symbol already exists
  const existingUnit = await prisma.unit.findFirst({
    where: {
      OR: [
        { name, deleted: false },
        { symbol, deleted: false },
      ],
    },
  });

  if (existingUnit) {
    const field = existingUnit.name === name ? "name" : "symbol";
    return sendResponse(
      res,
      false,
      null,
      `Unit with this ${field} already exists`,
      statusType.CONFLICT,
    );
  }

  // Create unit
  const unit = await prisma.unit.create({
    data: {
      name,
      symbol,
      status,
    },
    select: {
      id: true,
      name: true,
      symbol: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    true,
    {
      message: "Unit created successfully",
      unit,
    },
    "Unit created",
    statusType.CREATED,
  );
});

// Get All Units with Pagination, Search and Filters
export const getUnits = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    name = "",
    symbol = "",
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

  /* ---------------------------
     BUILD WHERE CLAUSE SAFELY
  ----------------------------*/
  const andConditions = [];

  // Deleted filter - conditionally filter based on showDeleted
  if (showDeleted !== "true") {
    // console.log("fwoeho");
    andConditions.push({ deleted: false });
  }

  // Status filter
  if (status !== undefined) {
    andConditions.push({
      status: status === "true" || status === true,
    });
  }

  // Name filter
  if (name) {
    andConditions.push({
      name: {
        contains: name,
      },
    });
  }

  // Symbol filter
  if (symbol) {
    andConditions.push({
      symbol: {
        contains: symbol,
      },
    });
  }

  // Search in name + symbol
  if (search) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: search,
          },
        },
        {
          symbol: {
            contains: search,
          },
        },
      ],
    });
  }

  const where = andConditions.length ? { AND: andConditions } : {};

  /* ---------------------------
     SORTING
  ----------------------------*/
  const validSortFields = ["name", "symbol", "createdAt", "updatedAt"];
  const validSortOrder = ["asc", "desc"];

  const orderBy = {
    [validSortFields.includes(sortBy) ? sortBy : "createdAt"]:
      validSortOrder.includes(sortOrder.toLowerCase())
        ? sortOrder.toLowerCase()
        : "desc",
  };

  /* ---------------------------
     QUERY
  ----------------------------*/
  const [units, total] = await Promise.all([
    prisma.unit.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      select: {
        id: true,
        name: true,
        symbol: true,
        status: true,
        deleted: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.unit.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      units,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Units retrieved successfully",
    statusType.OK,
  );
});

// Get Single Unit by ID
export const getUnitById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const unit = await prisma.unit.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      symbol: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!unit) {
    return sendResponse(
      res,
      false,
      null,
      "Unit not found",
      statusType.NOT_FOUND,
    );
  }

  return sendResponse(
    res,
    true,
    { unit },
    "Unit retrieved successfully",
    statusType.OK,
  );
});

// Update Unit
export const updateUnit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, symbol, status } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if unit exists
  const existingUnit = await prisma.unit.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingUnit) {
    return sendResponse(
      res,
      false,
      null,
      "Unit not found",
      statusType.NOT_FOUND,
    );
  }

  // Check if new name or symbol conflicts with other units
  if (name || symbol) {
    const conflictConditions = [];

    if (name && name !== existingUnit.name) {
      conflictConditions.push({ name });
    }
    if (symbol && symbol !== existingUnit.symbol) {
      conflictConditions.push({ symbol });
    }

    if (conflictConditions.length > 0) {
      const nameOrSymbolConflict = await prisma.unit.findFirst({
        where: {
          OR: conflictConditions,
          deleted: false,
          NOT: {
            id: parseInt(id),
          },
        },
      });

      if (nameOrSymbolConflict) {
        const field = nameOrSymbolConflict.name === name ? "name" : "symbol";
        return sendResponse(
          res,
          false,
          null,
          `Unit with this ${field} already exists`,
          statusType.CONFLICT,
        );
      }
    }
  }

  // Update unit
  const updatedUnit = await prisma.unit.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name: name || existingUnit.name,
      symbol: symbol || existingUnit.symbol,
      status: status !== undefined ? status : existingUnit.status,
    },
    select: {
      id: true,
      name: true,
      symbol: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    true,
    {
      message: "Unit updated successfully",
      unit: updatedUnit,
    },
    "Unit updated",
    statusType.OK,
  );
});

// Delete Unit (Soft Delete)
export const deleteUnit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if unit exists
  const existingUnit = await prisma.unit.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingUnit) {
    return sendResponse(
      res,
      false,
      null,
      "Unit not found",
      statusType.NOT_FOUND,
    );
  }

  // Check if unit is being used in active products (not deleted)
  const productUsingUnit = await prisma.product.findFirst({
    where: {
      OR: [{ unitId: existingUnit.id }, { purchaseUnit: id }, { saleUnit: id }],
      deleted: false, // Only check active products
    },
  });

  if (productUsingUnit) {
    return sendResponse(
      res,
      false,
      null,
      "Cannot delete unit. It is being used in products.",
      statusType.BAD_REQUEST,
    );
  }

  // Soft delete
  await prisma.unit.update({
    where: {
      id: parseInt(id),
    },
    data: {
      deleted: true,
      status: false,
    },
  });

  return sendResponse(
    res,
    true,
    { message: "Unit deleted successfully" },
    "Unit deleted",
    statusType.OK,
  );
});

// Bulk Delete Units
export const bulkDeleteUnits = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendResponse(
      res,
      false,
      null,
      "Please provide an array of unit IDs",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Convert all IDs to numbers
  const unitIds = ids.map((id) => parseInt(id)).filter((id) => !isNaN(id));

  // Check if all units exist and are not deleted
  const existingUnits = await prisma.unit.findMany({
    where: {
      id: { in: unitIds },
      deleted: false,
    },
  });

  if (existingUnits.length !== unitIds.length) {
    return sendResponse(
      res,
      false,
      null,
      "One or more units not found",
      statusType.NOT_FOUND,
    );
  }

  // Check if any unit is being used in products
  const unitNames = existingUnits.map((unit) => unit.name);
  const productUsingUnits = await prisma.product.findFirst({
    where: {
      OR: [
        { unit: { in: unitNames } },
        { purchaseUnit: { in: unitNames } },
        { saleUnit: { in: unitNames } },
      ],
      userId: req.user?.id, // Assuming user context is available
    },
  });

  if (productUsingUnits) {
    return sendResponse(
      res,
      false,
      null,
      "Cannot delete units. Some units are being used in products.",
      statusType.BAD_REQUEST,
    );
  }

  // Perform bulk soft delete
  await prisma.unit.updateMany({
    where: {
      id: { in: unitIds },
    },
    data: {
      deleted: true,
      status: false,
    },
  });

  return sendResponse(
    res,
    true,
    {
      message: `${unitIds.length} unit(s) deleted successfully`,
      deletedCount: unitIds.length,
    },
    "Bulk delete successful",
    statusType.OK,
  );
});

// Update Unit Status
export const updateUnitStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (typeof status !== "boolean") {
    return sendResponse(
      res,
      false,
      null,
      "Status must be a boolean value",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if unit exists
  const existingUnit = await prisma.unit.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingUnit) {
    return sendResponse(
      res,
      false,
      null,
      "Unit not found",
      statusType.NOT_FOUND,
    );
  }

  // Update status
  const updatedUnit = await prisma.unit.update({
    where: {
      id: parseInt(id),
    },
    data: {
      status,
    },
    select: {
      id: true,
      name: true,
      symbol: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    true,
    {
      message: `Unit ${status ? "activated" : "deactivated"} successfully`,
      unit: updatedUnit,
    },
    `Unit ${status ? "activated" : "deactivated"}`,
    statusType.OK,
  );
});

// Get Active Units (for dropdowns)
export const getActiveUnits = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const units = await prisma.unit.findMany({
    where: {
      status: true,
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      symbol: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return sendResponse(
    res,
    true,
    { units },
    "Active units retrieved successfully",
    statusType.OK,
  );
});

// Export all functions
export const unitController = {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
  bulkDeleteUnits,
  updateUnitStatus,
  getActiveUnits,
};
