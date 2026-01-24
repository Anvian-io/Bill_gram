import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../utils/index.js";

// Create Van
export const createVan = asyncHandler(async (req, res) => {
  const { name, vehicleNo, model, area, city, status = true } = req.body;

  // Validate required fields
  if (!name) {
    return sendResponse(res, statusType.BAD_REQUEST, null, "Name is required");
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if van with same vehicle number already exists
  if (vehicleNo) {
    const existingVan = await prisma.van.findFirst({
      where: {
        vehicleNo,
        deleted: false,
      },
    });

    if (existingVan) {
      return sendResponse(
        res,
        statusType.CONFLICT,
        null,
        `Van with this vehicle number already exists`,
      );
    }
  }

  // Create van
  const van = await prisma.van.create({
    data: {
      name,
      vehicleNo: vehicleNo || null,
      model: model || null,
      area: area || null,
      city: city || null,
      status,
    },
    select: {
      id: true,
      name: true,
      vehicleNo: true,
      model: true,
      area: true,
      city: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    statusType.CREATED,
    {
      message: "Van created successfully",
      van,
    },
    "Van created",
  );
});

// Get All Vans with Pagination, Search and Filters
export const getVans = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    name = "",
    vehicleNo = "",
    model = "",
    area = "",
    city = "",
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

  // Vehicle number filter
  if (vehicleNo) {
    andConditions.push({
      vehicleNo: {
        contains: vehicleNo,
      },
    });
  }

  // Model filter
  if (model) {
    andConditions.push({
      model: {
        contains: model,
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

  // City filter
  if (city) {
    andConditions.push({
      city: {
        contains: city,
      },
    });
  }

  // Search in name + vehicleNo + model + area + city
  if (search) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: search,
          },
        },
        {
          vehicleNo: {
            contains: search,
          },
        },
        {
          model: {
            contains: search,
          },
        },
        {
          area: {
            contains: search,
          },
        },
        {
          city: {
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
  const validSortFields = [
    "name",
    "vehicleNo",
    "model",
    "area",
    "city",
    "createdAt",
    "updatedAt",
  ];
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
  const [vans, total] = await Promise.all([
    prisma.van.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      select: {
        id: true,
        name: true,
        vehicleNo: true,
        model: true,
        area: true,
        city: true,
        status: true,
        deleted: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.van.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    statusType.OK,
    {
      vans,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Vans retrieved successfully",
  );
});

// Get Single Van by ID
export const getVanById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const van = await prisma.van.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      vehicleNo: true,
      model: true,
      area: true,
      city: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!van) {
    return sendResponse(res, statusType.NOT_FOUND, null, "Van not found");
  }

  return sendResponse(
    res,
    statusType.OK,
    { van },
    "Van retrieved successfully",
  );
});

// Update Van
export const updateVan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, vehicleNo, model, area, city, status } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if van exists
  const existingVan = await prisma.van.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingVan) {
    return sendResponse(res, statusType.NOT_FOUND, null, "Van not found");
  }

  // Check if new vehicle number conflicts with other vans
  if (vehicleNo && vehicleNo !== existingVan.vehicleNo) {
    const vehicleNoConflict = await prisma.van.findFirst({
      where: {
        vehicleNo,
        deleted: false,
        NOT: {
          id: parseInt(id),
        },
      },
    });

    if (vehicleNoConflict) {
      return sendResponse(
        res,
        statusType.CONFLICT,
        null,
        `Van with this vehicle number already exists`,
      );
    }
  }

  // Update van
  const updatedVan = await prisma.van.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name: name || existingVan.name,
      vehicleNo: vehicleNo !== undefined ? vehicleNo : existingVan.vehicleNo,
      model: model !== undefined ? model : existingVan.model,
      area: area !== undefined ? area : existingVan.area,
      city: city !== undefined ? city : existingVan.city,
      status: status !== undefined ? status : existingVan.status,
    },
    select: {
      id: true,
      name: true,
      vehicleNo: true,
      model: true,
      area: true,
      city: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    {
      message: "Van updated successfully",
      van: updatedVan,
    },
    "Van updated",
  );
});

// Delete Van (Soft Delete)
export const deleteVan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if van exists
  const existingVan = await prisma.van.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingVan) {
    return sendResponse(res, statusType.NOT_FOUND, null, "Van not found");
  }

  // Check if van is being used in deliveries/orders (if you have this relation)
  // const deliveryUsingVan = await prisma.delivery.findFirst({
  //   where: {
  //     vanId: parseInt(id),
  //   },
  // });

  // if (deliveryUsingVan) {
  //   return sendResponse(
  //     res,
  //     statusType.BAD_REQUEST,
  //     null,
  //     "Cannot delete van. It is being used in deliveries."
  //   );
  // }

  // Soft delete
  await prisma.van.update({
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
    { message: "Van deleted successfully" },
    "Van deleted",
  );
});

// Get Active Vans (for dropdowns)
export const getActiveVans = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const vans = await prisma.van.findMany({
    where: {
      status: true,
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      vehicleNo: true,
      model: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    { vans },
    "Active vans retrieved successfully",
  );
});

// Export all functions
export const vanController = {
  createVan,
  getVans,
  getVanById,
  updateVan,
  deleteVan,
  getActiveVans,
};
