import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../utils/index.js";

// Create Product Company
export const createProductCompany = asyncHandler(async (req, res) => {
  const {
    name,
    contactPerson,
    email,
    phone,
    website,
    address,
    status = true,
  } = req.body;

  // Validate required fields
  if (!name || !contactPerson || !email || !phone || !address) {
    return sendResponse(
      res,
      statusType.BAD_REQUEST,
      null,
      "Name, contact person, email, phone, and address are required",
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if company with same name already exists
  const existingCompany = await prisma.productCompany.findFirst({
    where: {
      name,
      deleted: false,
    },
  });

  if (existingCompany) {
    return sendResponse(
      res,
      statusType.CONFLICT,
      null,
      `Product company with this name already exists`,
    );
  }

  // Create company
  const company = await prisma.productCompany.create({
    data: {
      name,
      contactPerson,
      email,
      phone,
      website: website || "",
      address,
      status,
    },
    select: {
      id: true,
      name: true,
      contactPerson: true,
      email: true,
      phone: true,
      website: true,
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
      message: "Product company created successfully",
      company,
    },
    "Product company created",
  );
});

// Get All Product Companies with Pagination, Search and Filters
export const getProductCompanies = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    name = "",
    contactPerson = "",
    email = "",
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

  // Contact Person filter
  if (contactPerson) {
    andConditions.push({
      contactPerson: {
        contains: contactPerson,
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

  // Search in name + contactPerson + email
  if (search) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: search,
          },
        },
        {
          contactPerson: {
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
  const validSortFields = [
    "name",
    "contactPerson",
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
  const [companies, total] = await Promise.all([
    prisma.productCompany.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      select: {
        id: true,
        name: true,
        contactPerson: true,
        email: true,
        phone: true,
        website: true,
        address: true,
        status: true,
        deleted: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.productCompany.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    statusType.OK,
    {
      companies,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Product companies retrieved successfully",
  );
});

// Get Single Product Company by ID
export const getProductCompanyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const company = await prisma.productCompany.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      contactPerson: true,
      email: true,
      phone: true,
      website: true,
      address: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!company) {
    return sendResponse(
      res,
      statusType.NOT_FOUND,
      null,
      "Product company not found",
    );
  }

  return sendResponse(
    res,
    statusType.OK,
    { company },
    "Product company retrieved successfully",
  );
});

// Update Product Company
export const updateProductCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, contactPerson, email, phone, website, address, status } =
    req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if company exists
  const existingCompany = await prisma.productCompany.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingCompany) {
    return sendResponse(
      res,
      statusType.NOT_FOUND,
      null,
      "Product company not found",
    );
  }

  // Check if new name conflicts with other companies
  if (name && name !== existingCompany.name) {
    const nameConflict = await prisma.productCompany.findFirst({
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
        `Product company with this name already exists`,
      );
    }
  }

  // Update company
  const updatedCompany = await prisma.productCompany.update({
    where: {
      id: parseInt(id),
    },
    data: {
      name: name || existingCompany.name,
      contactPerson: contactPerson || existingCompany.contactPerson,
      email: email || existingCompany.email,
      phone: phone || existingCompany.phone,
      website: website !== undefined ? website : existingCompany.website,
      address: address || existingCompany.address,
      status: status !== undefined ? status : existingCompany.status,
    },
    select: {
      id: true,
      name: true,
      contactPerson: true,
      email: true,
      phone: true,
      website: true,
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
      message: "Product company updated successfully",
      company: updatedCompany,
    },
    "Product company updated",
  );
});

// Delete Product Company (Soft Delete)
export const deleteProductCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if company exists
  const existingCompany = await prisma.productCompany.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingCompany) {
    return sendResponse(
      res,
      statusType.NOT_FOUND,
      null,
      "Product company not found",
    );
  }

  // Check if company is being used in products (if you have this relation)
  // const productUsingCompany = await prisma.product.findFirst({
  //   where: {
  //     companyId: parseInt(id),
  //   },
  // });

  // if (productUsingCompany) {
  //   return sendResponse(
  //     res,
  //     statusType.BAD_REQUEST,
  //     null,
  //     "Cannot delete company. It is being used in products."
  //   );
  // }

  // Soft delete
  await prisma.productCompany.update({
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
    { message: "Product company deleted successfully" },
    "Product company deleted",
  );
});

// Get Active Product Companies (for dropdowns)
export const getActiveProductCompanies = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const companies = await prisma.productCompany.findMany({
    where: {
      status: true,
      deleted: false,
    },
    select: {
      id: true,
      name: true,
      contactPerson: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    { companies },
    "Active product companies retrieved successfully",
  );
});

// Export all functions
export const productCompanyController = {
  createProductCompany,
  getProductCompanies,
  getProductCompanyById,
  updateProductCompany,
  deleteProductCompany,
  getActiveProductCompanies,
};
