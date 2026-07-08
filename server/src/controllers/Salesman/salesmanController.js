import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../../utils/index.js";
import { createNotification } from "../../utils/notificationHelper.js";
// Create Salesman
export const createSalesman = asyncHandler(async (req, res) => {
  const { name, phoneNo, email, areaId, status = true } = req.body;

  // Validate required fields
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

  // Check if salesman with same phone number already exists
  if (phoneNo) {
    const existingSalesman = await prisma.salesman.findFirst({
      where: {
        phoneNo,
      },
    });

    if (existingSalesman) {
      return sendResponse(
        res,
        false,
        null,
        `Salesman with this phone number already exists`,
        statusType.CONFLICT,
      );
    }
  }

  // Create salesman
  const salesman = await prisma.salesman.create({
    data: {
      name,
      phoneNo: phoneNo || "",
      email: email || "",
      areaId: areaId ? parseInt(areaId) : null,
      status,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
      email: true,
      areaId: true,
      status: true,
      createdAt: true,
    },
  });
  await createNotification({
  title: "New Salesman Created",
  message: `Salesman "${name}" has been created by ${req.user?.username || 'Admin'}`,
  type: "success",
  section: "Salesman",
  page: "master"
}, res);
  return sendResponse(
    res,
    true,
    {
      message: "Salesman created successfully",
      salesman,
    },
    "Salesman created",
    statusType.CREATED,
  );
});

// Get All Salesmen with Pagination, Search and Filters
export const getSalesmen = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    name = "",
    areaId,
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

  // Area filter
  if (areaId) {
    andConditions.push({
      areaId: parseInt(areaId),
    });
  }

  // Search in name + phoneNo + email
  if (search) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: search,
          },
        },
        {
          phoneNo: {
            contains: search,
          },
        },
        {
          email: {
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
  const validSortFields = ["name", "phoneNo", "areaId", "createdAt"];
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
  const [salesmen, total] = await Promise.all([
    prisma.salesman.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      select: {
        id: true,
        name: true,
        phoneNo: true,
        email: true,
        areaId: true,
        status: true,
        deleted: true,
        createdAt: true,
      },
    }),
    prisma.salesman.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      salesmen,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Salesmen retrieved successfully",
    statusType.OK,
  );
});

// Get Single Salesman by ID
export const getSalesmanById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const salesman = await prisma.salesman.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
      email: true,
      areaId: true,
      status: true,
      createdAt: true,
    },
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

  return sendResponse(
    res,
    true,
    { salesman },
    "Salesman retrieved successfully",
    statusType.OK,
  );
});

// Update Salesman
export const updateSalesman = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phoneNo, email, areaId, status } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if salesman exists
  const existingSalesman = await prisma.salesman.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingSalesman) {
    return sendResponse(
      res,
      false,
      null,
      "Salesman not found",
      statusType.NOT_FOUND,
    );
  }

  // Check if new phone number conflicts with other salesmen
  if (phoneNo && phoneNo !== existingSalesman.phoneNo) {
    const phoneConflict = await prisma.salesman.findFirst({
      where: {
        phoneNo,
        deleted: false,
        NOT: {
          id: parseInt(id),
        },
      },
    });

    if (phoneConflict) {
      return sendResponse(
        res,
        false,
        null,
        `Salesman with this phone number already exists`,
        statusType.CONFLICT,
      );
    }
  }

  // Update salesman
  const updatedSalesman = await prisma.salesman.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name: name || existingSalesman.name,
      phoneNo: phoneNo || existingSalesman.phoneNo,
      email: email !== undefined ? email : existingSalesman.email,
      areaId: areaId !== undefined ? parseInt(areaId) : existingSalesman.areaId,
      status: status !== undefined ? status : existingSalesman.status,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
      email: true,
      areaId: true,
      status: true,
      createdAt: true,
    },
  });
await createNotification({
  title: "Salesman Updated",
  message: `Salesman "${updatedSalesman.name}" has been updated by ${req.user?.username || 'Admin'}`,
  type: "info",
  section: "Salesman",
  page: "master"
}, res);
  return sendResponse(
    res,
    true,
    {
      message: "Salesman updated successfully",
      salesman: updatedSalesman,
    },
    "Salesman updated",
    statusType.OK,
  );
});

// Delete Salesman (Soft Delete)
export const deleteSalesman = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if salesman exists
  const existingSalesman = await prisma.salesman.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingSalesman) {
    return sendResponse(
      res,
      false,
      null,
      "Salesman not found",
      statusType.NOT_FOUND,
    );
  }

  // Check if salesman is being used in orders/sales (if you have this relation)
  // const orderUsingSalesman = await prisma.order.findFirst({
  //   where: {
  //     salesmanId: parseInt(id),
  //   },
  // });

  // if (orderUsingSalesman) {
  //   return sendResponse(
  //     res,
  //     false,
  //     null,
  //     "Cannot delete salesman. It is being used in orders.",
  //     statusType.BAD_REQUEST,
  //   );
  // }

  // Soft delete
  await prisma.salesman.update({
    where: {
      id: parseInt(id),
    },
    data: {
      deleted: true,
      status: false,
      deletedAt: new Date(),
    },
  });
await createNotification({
  title: "Salesman Deleted",
  message: `Salesman "${existingSalesman.name}" has been deleted by ${req.user?.username || 'Admin'}`,
  type: "warning",
  section: "Salesman",
  page: "master"
}, res);
  return sendResponse(
    res,
    true,
    { message: "Salesman deleted successfully" },
    "Salesman deleted",
    statusType.OK,
  );
});

// Get Active Salesmen (for dropdowns)
export const getActiveSalesmen = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const salesmen = await prisma.salesman.findMany({
    where: {
      status: true,
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
      areaId: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return sendResponse(
    res,
    true,
    { salesmen },
    "Active salesmen retrieved successfully",
    statusType.OK,
  );
});

// Export all functions
export const salesmanController = {
  createSalesman,
  getSalesmen,
  getSalesmanById,
  updateSalesman,
  deleteSalesman,
  getActiveSalesmen,
};
