import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../utils/index.js";

// Create Product Group
export const createProductGroup = asyncHandler(async (req, res) => {
  const { name, description, status = true } = req.body;

  // Validate required fields
  if (!name) {
    return sendResponse(res, statusType.BAD_REQUEST, null, "Name is required");
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if product group already exists
  const existingGroup = await prisma.productGroup.findFirst({
    where: {
      name,
      deleted: false,
    },
  });

  if (existingGroup) {
    return sendResponse(
      res,
      statusType.CONFLICT,
      null,
      "Product group with this name already exists",
    );
  }

  // Create product group
  const productGroup = await prisma.productGroup.create({
    data: {
      name,
      description,
      status,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    statusType.CREATED,
    {
      message: "Product group created successfully",
      productGroup,
    },
    "Product group created",
  );
});

// Get All Product Groups with Pagination, Search and Filters
export const getProductGroups = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    name = "",
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

  // Deleted filter
  if (showDeleted !== "true") {
    andConditions.push({ deleted: false });
  }

  // Status filter
  if (status !== undefined) {
    andConditions.push({
      status: status === "true" || status === true,
    });
  }

  // Name-only filter
  if (name) {
    andConditions.push({
      name: {
        contains: name,
      },
    });
  }

  // Search in name + description
  if (search) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: search,
          },
        },
        {
          description: {
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
  const validSortFields = ["name", "createdAt", "updatedAt"];
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
  const [productGroups, total] = await Promise.all([
    prisma.productGroup.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        deleted: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.productGroup.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    statusType.OK,
    {
      productGroups,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Product groups retrieved successfully",
  );
});

// Get Single Product Group by ID
export const getProductGroupById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const productGroup = await prisma.productGroup.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!productGroup) {
    return sendResponse(
      res,
      statusType.NOT_FOUND,
      null,
      "Product group not found",
    );
  }

  return sendResponse(
    res,
    statusType.OK,
    { productGroup },
    "Product group retrieved successfully",
  );
});

// Update Product Group
export const updateProductGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if product group exists
  const existingGroup = await prisma.productGroup.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingGroup) {
    return sendResponse(
      res,
      statusType.NOT_FOUND,
      null,
      "Product group not found",
    );
  }

  // Check if new name conflicts with other groups
  if (name && name !== existingGroup.name) {
    const nameConflict = await prisma.productGroup.findFirst({
      where: {
        name,
        deleted: false,
        NOT: {
          id: parseInt(id),
        },
      },
    });

    if (nameConflict) {
      return sendResponse(
        res,
        statusType.CONFLICT,
        null,
        "Product group with this name already exists",
      );
    }
  }

  // Update product group
  const updatedProductGroup = await prisma.productGroup.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name: name || existingGroup.name,
      description:
        description !== undefined ? description : existingGroup.description,
      status: status !== undefined ? status : existingGroup.status,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    {
      message: "Product group updated successfully",
      productGroup: updatedProductGroup,
    },
    "Product group updated",
  );
});

// Delete Product Group (Soft Delete)
export const deleteProductGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if product group exists
  const existingGroup = await prisma.productGroup.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingGroup) {
    return sendResponse(
      res,
      statusType.NOT_FOUND,
      null,
      "Product group not found",
    );
  }

  // Soft delete
  await prisma.productGroup.update({
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
    statusType.OK,
    { message: "Product group deleted successfully" },
    "Product group deleted",
  );
});

// Bulk Delete Product Groups
export const bulkDeleteProductGroups = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendResponse(
      res,
      statusType.BAD_REQUEST,
      null,
      "Please provide an array of product group IDs",
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Convert all IDs to numbers
  const productGroupIds = ids
    .map((id) => parseInt(id))
    .filter((id) => !isNaN(id));

  // Check if all groups exist
  const existingGroups = await prisma.productGroup.findMany({
    where: {
      id: { in: productGroupIds },
      deleted: false,
    },
  });

  if (existingGroups.length !== productGroupIds.length) {
    return sendResponse(
      res,
      statusType.NOT_FOUND,
      null,
      "One or more product groups not found",
    );
  }

  // Perform bulk soft delete
  await prisma.productGroup.updateMany({
    where: {
      id: { in: productGroupIds },
    },
    data: {
      deleted: true,
      status: false,
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    {
      message: `${productGroupIds.length} product group(s) deleted successfully`,
      deletedCount: productGroupIds.length,
    },
    "Bulk delete successful",
  );
});

// Update Product Group Status
export const updateProductGroupStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (typeof status !== "boolean") {
    return sendResponse(
      res,
      statusType.BAD_REQUEST,
      null,
      "Status must be a boolean value",
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if product group exists
  const existingGroup = await prisma.productGroup.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingGroup) {
    return sendResponse(
      res,
      statusType.NOT_FOUND,
      null,
      "Product group not found",
    );
  }

  // Update status
  const updatedProductGroup = await prisma.productGroup.update({
    where: {
      id: parseInt(id),
    },
    data: {
      status,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    {
      message: `Product group ${status ? "activated" : "deactivated"} successfully`,
      productGroup: updatedProductGroup,
    },
    `Product group ${status ? "activated" : "deactivated"}`,
  );
});

// Export all functions
export const productGroupController = {
  createProductGroup,
  getProductGroups,
  getProductGroupById,
  updateProductGroup,
  deleteProductGroup,
  bulkDeleteProductGroups,
  updateProductGroupStatus,
};
