import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../utils/index.js";

// Create Salesman
export const createSalesman = asyncHandler(async (req, res) => {
  const { name, phoneNo, email, area, status = true } = req.body;

  // Validate required fields
  if (!name || !phoneNo || !area) {
    return sendResponse(
      res,
      statusType.BAD_REQUEST,
      null,
      "Name, phone number, and area are required",
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if salesman with same phone number already exists
  const existingSalesman = await prisma.salesman.findFirst({
    where: {
      phoneNo,
      deleted: false,
    },
  });

  if (existingSalesman) {
    return sendResponse(
      res,
      statusType.CONFLICT,
      null,
      `Salesman with this phone number already exists`,
    );
  }

  // Create salesman
  const salesman = await prisma.salesman.create({
    data: {
      name,
      phoneNo,
      email: email || "",
      area,
      status,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
      email: true,
      area: true,
      status: true,
      createdAt: true,
    },
  });

  return sendResponse(
    res,
    statusType.CREATED,
    {
      message: "Salesman created successfully",
      salesman,
    },
    "Salesman created",
  );
});

// Get All Salesmen with Pagination, Search and Filters
export const getSalesmen = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    name = "",
    area = "",
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
  if (area) {
    andConditions.push({
      area: {
        contains: area,
      },
    });
  }

  // Search in name + phoneNo + area + email
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
          area: {
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
  const validSortFields = ["name", "phoneNo", "area", "createdAt"];
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
        area: true,
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
    statusType.OK,
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
      area: true,
      status: true,
      createdAt: true,
    },
  });

  if (!salesman) {
    return sendResponse(res, statusType.NOT_FOUND, null, "Salesman not found");
  }

  return sendResponse(
    res,
    statusType.OK,
    { salesman },
    "Salesman retrieved successfully",
  );
});

// Update Salesman
export const updateSalesman = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phoneNo, email, area, status } = req.body;

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
    return sendResponse(res, statusType.NOT_FOUND, null, "Salesman not found");
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
        statusType.CONFLICT,
        null,
        `Salesman with this phone number already exists`,
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
      area: area || existingSalesman.area,
      status: status !== undefined ? status : existingSalesman.status,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
      email: true,
      area: true,
      status: true,
      createdAt: true,
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    {
      message: "Salesman updated successfully",
      salesman: updatedSalesman,
    },
    "Salesman updated",
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
    return sendResponse(res, statusType.NOT_FOUND, null, "Salesman not found");
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
  //     statusType.BAD_REQUEST,
  //     null,
  //     "Cannot delete salesman. It is being used in orders."
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

  return sendResponse(
    res,
    statusType.OK,
    { message: "Salesman deleted successfully" },
    "Salesman deleted",
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
      area: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    { salesmen },
    "Active salesmen retrieved successfully",
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
