import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../utils/index.js";

// Create Supplier
export const createSupplier = asyncHandler(async (req, res) => {
  const { name, phoneNo, email, address, status = true } = req.body;

  // Validate required fields
  if (!name || !phoneNo) {
    return sendResponse(
      res,
      statusType.BAD_REQUEST,
      null,
      "Supplier name and phone number are required",
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if supplier with same phone number already exists
  const existingSupplier = await prisma.supplier.findFirst({
    where: {
      phoneNo,
      deleted: false,
    },
  });

  if (existingSupplier) {
    return sendResponse(
      res,
      statusType.CONFLICT,
      null,
      `Supplier with this phone number already exists`,
    );
  }

  // Create supplier
  const supplier = await prisma.supplier.create({
    data: {
      name,
      phoneNo,
      email: email || "",
      address: address || null,
      status,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
      email: true,
      address: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    statusType.CREATED,
    {
      message: "Supplier created successfully",
      supplier,
    },
    "Supplier created",
  );
});

// Get All Suppliers with Pagination, Search and Filters
export const getSuppliers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    name = "",
    phoneNo = "",
    email = "",
    address = "",
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

  // Phone Number filter
  if (phoneNo) {
    andConditions.push({
      phoneNo: {
        contains: phoneNo,
      },
    });
  }

  // Email filter
  if (email) {
    andConditions.push({
      email: {
        contains: email,
      },
    });
  }

  // Address filter
  if (address) {
    andConditions.push({
      address: {
        contains: address,
      },
    });
  }

  // Search in name + phoneNo + email + address
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
        {
          address: {
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
    "phoneNo",
    "email",
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
  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      select: {
        id: true,
        name: true,
        phoneNo: true,
        email: true,
        address: true,
        status: true,
        deleted: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.supplier.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    statusType.OK,
    {
      suppliers,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Suppliers retrieved successfully",
  );
});

// Get Single Supplier by ID
export const getSupplierById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const supplier = await prisma.supplier.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
      email: true,
      address: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!supplier) {
    return sendResponse(res, statusType.NOT_FOUND, null, "Supplier not found");
  }

  return sendResponse(
    res,
    statusType.OK,
    { supplier },
    "Supplier retrieved successfully",
  );
});

// Update Supplier
export const updateSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phoneNo, email, address, status } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if supplier exists
  const existingSupplier = await prisma.supplier.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingSupplier) {
    return sendResponse(res, statusType.NOT_FOUND, null, "Supplier not found");
  }

  // Check if new phone number conflicts with other suppliers
  if (phoneNo && phoneNo !== existingSupplier.phoneNo) {
    const phoneConflict = await prisma.supplier.findFirst({
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
        `Supplier with this phone number already exists`,
      );
    }
  }

  // Update supplier
  const updatedSupplier = await prisma.supplier.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name: name || existingSupplier.name,
      phoneNo: phoneNo || existingSupplier.phoneNo,
      email: email !== undefined ? email : existingSupplier.email,
      address: address !== undefined ? address : existingSupplier.address,
      status: status !== undefined ? status : existingSupplier.status,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
      email: true,
      address: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    {
      message: "Supplier updated successfully",
      supplier: updatedSupplier,
    },
    "Supplier updated",
  );
});

// Delete Supplier (Soft Delete)
export const deleteSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if supplier exists
  const existingSupplier = await prisma.supplier.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingSupplier) {
    return sendResponse(res, statusType.NOT_FOUND, null, "Supplier not found");
  }

  // Check if supplier is being used in purchases (if you have this relation)
  // Example check if you have a Purchase model:
  // const purchaseUsingSupplier = await prisma.purchase.findFirst({
  //   where: {
  //     supplierId: parseInt(id),
  //   },
  // });
  //
  // if (purchaseUsingSupplier) {
  //   return sendResponse(
  //     res,
  //     statusType.BAD_REQUEST,
  //     null,
  //     "Cannot delete supplier. It is being used in purchase records."
  //   );
  // }

  // Soft delete
  await prisma.supplier.update({
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
    { message: "Supplier deleted successfully" },
    "Supplier deleted",
  );
});

// Get Active Suppliers (for dropdowns)
export const getActiveSuppliers = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const suppliers = await prisma.supplier.findMany({
    where: {
      status: true,
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    { suppliers },
    "Active suppliers retrieved successfully",
  );
});

// Export all functions
export const supplierController = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getActiveSuppliers,
};
