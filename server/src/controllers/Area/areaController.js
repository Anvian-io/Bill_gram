import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../../utils/index.js";

// Create Area
export const createArea = asyncHandler(async (req, res) => {
  const {
    name,
    state,
    region,
    city,
    description,
    pincode,
    status = true,
  } = req.body;

  // Validate required fields
  if (!name) {
    return sendResponse(
      res,
      false,
      null,
      "Area name is required",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if area with same name already exists
  const existingArea = await prisma.area.findFirst({
    where: {
      name,
      deleted: false,
    },
  });

  if (existingArea) {
    return sendResponse(
      res,
      false,
      null,
      `Area with this name already exists`,
      statusType.CONFLICT,
    );
  }

  // Create area
  const area = await prisma.area.create({
    data: {
      name,
      state: state || null,
      region: region || null,
      city: city || null,
      description: description || null,
      pincode: pincode || null,
      status,
    },
    select: {
      id: true,
      name: true,
      state: true,
      region: true,
      city: true,
      description: true,
      pincode: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    true,
    {
      message: "Area created successfully",
      area,
    },
    "Area created",
    statusType.CREATED,
  );
});

// Get All Areas with Pagination, Search and Filters
export const getAreas = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    name = "",
    state = "",
    region = "",
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

  // State filter
  if (state) {
    andConditions.push({
      state: {
        contains: state,
      },
    });
  }

  // Region filter
  if (region) {
    andConditions.push({
      region: {
        contains: region,
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

  // Search in name + state + region + city + description
  if (search) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: search,
          },
        },
        {
          state: {
            contains: search,
          },
        },
        {
          region: {
            contains: search,
          },
        },
        {
          city: {
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
  const validSortFields = [
    "name",
    "state",
    "region",
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
  const [areas, total] = await Promise.all([
    prisma.area.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      select: {
        id: true,
        name: true,
        state: true,
        region: true,
        city: true,
        description: true,
        pincode: true,
        status: true,
        deleted: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.area.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      areas,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Areas retrieved successfully",
    statusType.OK,
  );
});

// Get Single Area by ID
export const getAreaById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const area = await prisma.area.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      state: true,
      region: true,
      city: true,
      description: true,
      pincode: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
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

  return sendResponse(
    res,
    true,
    { area },
    "Area retrieved successfully",
    statusType.OK,
  );
});

// Update Area
export const updateArea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, state, region, city, description, pincode, status } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if area exists
  const existingArea = await prisma.area.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingArea) {
    return sendResponse(
      res,
      false,
      null,
      "Area not found",
      statusType.NOT_FOUND,
    );
  }

  // Check if new name conflicts with other areas
  if (name && name !== existingArea.name) {
    const nameConflict = await prisma.area.findFirst({
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
        `Area with this name already exists`,
        statusType.CONFLICT,
      );
    }
  }

  // Update area
  const updatedArea = await prisma.area.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name: name || existingArea.name,
      state: state !== undefined ? state : existingArea.state,
      region: region !== undefined ? region : existingArea.region,
      city: city !== undefined ? city : existingArea.city,
      description:
        description !== undefined ? description : existingArea.description,
      pincode: pincode !== undefined ? pincode : existingArea.pincode,
      status: status !== undefined ? status : existingArea.status,
    },
    select: {
      id: true,
      name: true,
      state: true,
      region: true,
      city: true,
      description: true,
      pincode: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    true,
    {
      message: "Area updated successfully",
      area: updatedArea,
    },
    "Area updated",
    statusType.OK,
  );
});

// Delete Area (Soft Delete)
export const deleteArea = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if area exists
  const existingArea = await prisma.area.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingArea) {
    return sendResponse(
      res,
      false,
      null,
      "Area not found",
      statusType.NOT_FOUND,
    );
  }

  // Check if area is being used in customers (if you have this relation)
  // const customerUsingArea = await prisma.customer.findFirst({
  //   where: {
  //     areaId: parseInt(id),
  //   },
  // });

  // if (customerUsingArea) {
  //   return sendResponse(
  //     res,
  //     false,
  //     null,
  //     "Cannot delete area. It is being used by customers.",
  //     statusType.BAD_REQUEST,
  //   );
  // }

  // Soft delete
  await prisma.area.update({
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
    { message: "Area deleted successfully" },
    "Area deleted",
    statusType.OK,
  );
});

// Get Active Areas (for dropdowns)
export const getActiveAreas = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const areas = await prisma.area.findMany({
    where: {
      status: true,
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return sendResponse(
    res,
    true,
    { areas },
    "Active areas retrieved successfully",
    statusType.OK,
  );
});

// Export all functions
export const areaController = {
  createArea,
  getAreas,
  getAreaById,
  updateArea,
  deleteArea,
  getActiveAreas,
};
