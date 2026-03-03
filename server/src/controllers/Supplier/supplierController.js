import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../../utils/index.js";

// Create Supplier
export const createSupplier = asyncHandler(async (req, res) => {
  const { name, phoneNo, email, address, gstIN, status = true } = req.body;

  // Validate required fields
  if (!name || !phoneNo) {
    return sendResponse(
      res,
      false,
      null,
      "Supplier name and phone number are required",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if supplier with same phone number already exists
  const existingSupplier = await prisma.supplier.findFirst({
    where: {
      phoneNo,
    },
  });

  if (existingSupplier) {
    return sendResponse(
      res,
      false,
      null,
      `Supplier with this phone number already exists`,
      statusType.CONFLICT,
    );
  }

  // Check if GSTIN already exists (if provided)
  if (gstIN) {
    const existingGstin = await prisma.supplier.findFirst({
      where: {
        gstIN,
      },
    });

    if (existingGstin) {
      return sendResponse(
        res,
        false,
        null,
        `Supplier with this GSTIN already exists`,
        statusType.CONFLICT,
      );
    }
  }

  // Create supplier
  const supplier = await prisma.supplier.create({
    data: {
      name,
      phoneNo,
      email: email || "",
      address: address || null,
      gstIN: gstIN || null,
      status,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
      email: true,
      address: true,
      gstIN: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    true,
    {
      message: "Supplier created successfully",
      supplier,
    },
    "Supplier created",
    statusType.CREATED,
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
    gstIN = "",
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

  // GSTIN filter
  if (gstIN) {
    andConditions.push({
      gstIN: {
        contains: gstIN,
      },
    });
  }

  // Search in name + phoneNo + email + address + gstIN
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
        {
          gstIN: {
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
    "gstIN",
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
        gstIN: true,
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
    true,
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
    statusType.OK,
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
      gstIN: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!supplier) {
    return sendResponse(
      res,
      false,
      null,
      "Supplier not found",
      statusType.NOT_FOUND,
    );
  }

  return sendResponse(
    res,
    true,
    { supplier },
    "Supplier retrieved successfully",
    statusType.OK,
  );
});

// Update Supplier
export const updateSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phoneNo, email, address, gstIN, status } = req.body;

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
    return sendResponse(
      res,
      false,
      null,
      "Supplier not found",
      statusType.NOT_FOUND,
    );
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
        false,
        null,
        `Supplier with this phone number already exists`,
        statusType.CONFLICT,
      );
    }
  }

  // Check if new GSTIN conflicts with other suppliers
  if (gstIN && gstIN !== existingSupplier.gstIN) {
    const gstinConflict = await prisma.supplier.findFirst({
      where: {
        gstIN,
        deleted: false,
        NOT: {
          id: parseInt(id),
        },
      },
    });

    if (gstinConflict) {
      return sendResponse(
        res,
        false,
        null,
        `Supplier with this GSTIN already exists`,
        statusType.CONFLICT,
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
      gstIN: gstIN !== undefined ? gstIN : existingSupplier.gstIN,
      status: status !== undefined ? status : existingSupplier.status,
    },
    select: {
      id: true,
      name: true,
      phoneNo: true,
      email: true,
      address: true,
      gstIN: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    true,
    {
      message: "Supplier updated successfully",
      supplier: updatedSupplier,
    },
    "Supplier updated",
    statusType.OK,
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
    return sendResponse(
      res,
      false,
      null,
      "Supplier not found",
      statusType.NOT_FOUND,
    );
  }

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
    true,
    { message: "Supplier deleted successfully" },
    "Supplier deleted",
    statusType.OK,
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
      gstIN: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return sendResponse(
    res,
    true,
    { suppliers },
    "Active suppliers retrieved successfully",
    statusType.OK,
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
