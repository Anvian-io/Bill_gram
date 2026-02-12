import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../utils/index.js";
import { createNotification } from "../utils/notificationHelper.js";
// Create Product Group
export const createProductGroup = asyncHandler(async (req, res) => {
  const { name, description, status = true } = req.body;

  if (!name) {
    return sendResponse(
      res,
      false,
      null,
      "Name is required",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const existingGroup = await prisma.productGroup.findFirst({
    where: {
      name,
      deleted: false,
    },
  });

  if (existingGroup) {
    return sendResponse(
      res,
      false,
      null,
      "Product group with this name already exists",
      statusType.CONFLICT,
    );
  }

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

  // Send notification to all users
  await createNotification({
    title: "New Product Group Created",
    message: `Product group "${name}" has been created by ${req.user?.username || 'Admin'}`,
    type: "success",
    // category: "product_group"
  }, res);

  return sendResponse(
    res,
    true,
    {
      message: "Product group created successfully",
      productGroup,
    },
    "Product group created",
    statusType.CREATED,
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
    showDeleted = "false", // This is the new parameter
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

  // Deleted filter - UPDATED to conditionally filter based on showDeleted
  if (showDeleted !== "true") {
    andConditions.push({ deleted: false });
  }
  // When showDeleted is "true", we don't add any condition for deleted, so all records (including deleted) are fetched

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
        deleted: true, // Make sure to include deleted field in response
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.productGroup.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
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
    statusType.OK,
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
      false,
      null,
      "Product group not found",
      statusType.NOT_FOUND,
    );
  }

  return sendResponse(
    res,
    true,
    { productGroup },
    "Product group retrieved successfully",
    statusType.OK,
  );
});

// Update Product Group
export const updateProductGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const existingGroup = await prisma.productGroup.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingGroup) {
    return sendResponse(
      res,
      false,
      null,
      "Product group not found",
      statusType.NOT_FOUND,
    );
  }

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
        false,
        null,
        "Product group with this name already exists",
        statusType.CONFLICT,
      );
    }
  }

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

  // Send notification to all users
  await createNotification({
    title: "Product Group Updated",
    message: `Product group "${updatedProductGroup.name}" has been updated by ${req.user?.username || 'Admin'}`,
    type: "info",
    // category: "product_group"
  }, res);

  return sendResponse(
    res,
    true,
    {
      message: "Product group updated successfully",
      productGroup: updatedProductGroup,
    },
    "Product group updated",
    statusType.OK,
  );
});

// Delete Product Group (Soft Delete)
export const deleteProductGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const existingGroup = await prisma.productGroup.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingGroup) {
    return sendResponse(
      res,
      false,
      null,
      "Product group not found",
      statusType.NOT_FOUND,
    );
  }

  await prisma.productGroup.update({
    where: {
      id: parseInt(id),
    },
    data: {
      deleted: true,
      status: false,
    },
  });

  // Send notification to all users
  await createNotification({
    title: "Product Group Deleted",
    message: `Product group "${existingGroup.name}" has been deleted by ${req.user?.username || 'Admin'}`,
    type: "warning",
    // category: "product_group"
  }, res);

  return sendResponse(
    res,
    true,
    { message: "Product group deleted successfully" },
    "Product group deleted",
    statusType.OK,
  );
});

// Bulk Delete Product Groups
export const bulkDeleteProductGroups = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendResponse(
      res,
      false,
      null,
      "Please provide an array of product group IDs",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const productGroupIds = ids
    .map((id) => parseInt(id))
    .filter((id) => !isNaN(id));

  const existingGroups = await prisma.productGroup.findMany({
    where: {
      id: { in: productGroupIds },
      deleted: false,
    },
  });

  if (existingGroups.length !== productGroupIds.length) {
    return sendResponse(
      res,
      false,
      null,
      "One or more product groups not found",
      statusType.NOT_FOUND,
    );
  }

  await prisma.productGroup.updateMany({
    where: {
      id: { in: productGroupIds },
    },
    data: {
      deleted: true,
      status: false,
    },
  });

  const groupNames = existingGroups.map(g => g.name).join(", ");

  // Send notification to all users
  await createNotification({
    title: "Product Groups Bulk Deleted",
    message: `${productGroupIds.length} product groups (${groupNames}) have been deleted by ${req.user?.username || 'Admin'}`,
    type: "warning",
    // category: "product_group"
  }, res);

  return sendResponse(
    res,
    true,
    {
      message: `${productGroupIds.length} product group(s) deleted successfully`,
      deletedCount: productGroupIds.length,
    },
    "Bulk delete successful",
    statusType.OK,
  );
});

// Update Product Group Status
export const updateProductGroupStatus = asyncHandler(async (req, res) => {
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
      false,
      null,
      "Product group not found",
      statusType.NOT_FOUND,
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
    true,
    {
      message: `Product group ${status ? "activated" : "deactivated"} successfully`,
      productGroup: updatedProductGroup,
    },
    `Product group ${status ? "activated" : "deactivated"}`,
    statusType.OK,
  );
});

export const getActiveProductGroups = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;
  console.log("oifewofiewh");
  const productGroups = await prisma.productGroup.findMany({
    where: {
      status: true,
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return sendResponse(
    res,
    true,
    { productGroups },
    "Active product groups retrieved successfully",
    statusType.OK,
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
  getActiveProductGroups,
};
