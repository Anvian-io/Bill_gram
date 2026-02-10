import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../utils/index.js";

// Create Customer
export const createCustomer = asyncHandler(async (req, res) => {
  const {
    companyName,
    personName,
    phoneNo,
    email,
    customerType,
    city,
    address,
    pincode,
    status = true,
  } = req.body;

  // Validate required fields
  if (!companyName || !personName || !phoneNo || !address) {
    return sendResponse(
      res,
      false,
      null,
      "Company name, person name, phone number, and address are required",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if customer with same phone number already exists
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      phoneNo,
      // deleted: false,
    },
  });

  if (existingCustomer) {
    return sendResponse(
      res,
      false,
      null,
      `Customer with this phone number already exists`,
      statusType.CONFLICT,
    );
  }

  // Create customer
  const customer = await prisma.customer.create({
    data: {
      companyName,
      personName,
      phoneNo,
      email: email || "",
      customerType: customerType || null,
      city: city || null,
      address,
      pincode: pincode || null,
      status,
    },
    select: {
      id: true,
      companyName: true,
      personName: true,
      phoneNo: true,
      email: true,
      customerType: true,
      city: true,
      address: true,
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
      message: "Customer created successfully",
      customer,
    },
    "Customer created",
    statusType.CREATED,
  );
});

// Get All Customers with Pagination, Search and Filters
export const getCustomers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    companyName = "",
    personName = "",
    phoneNo = "",
    city = "",
    customerType,
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

  // Company Name filter
  if (companyName) {
    andConditions.push({
      companyName: {
        contains: companyName,
      },
    });
  }

  // Person Name filter
  if (personName) {
    andConditions.push({
      personName: {
        contains: personName,
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

  // City filter
  if (city) {
    andConditions.push({
      city: {
        contains: city,
      },
    });
  }

  // Customer Type filter
  if (customerType) {
    andConditions.push({
      customerType: {
        contains: customerType,
      },
    });
  }

  // Search in companyName + personName + phoneNo + city + email
  if (search) {
    andConditions.push({
      OR: [
        {
          companyName: {
            contains: search,
          },
        },
        {
          personName: {
            contains: search,
          },
        },
        {
          phoneNo: {
            contains: search,
          },
        },
        {
          city: {
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
    "companyName",
    "personName",
    "phoneNo",
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
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      select: {
        id: true,
        companyName: true,
        personName: true,
        phoneNo: true,
        email: true,
        customerType: true,
        city: true,
        address: true,
        pincode: true,
        status: true,
        deleted: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      customers,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Customers retrieved successfully",
    statusType.OK,
  );
});

// Get Single Customer by ID
export const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const customer = await prisma.customer.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    select: {
      id: true,
      companyName: true,
      personName: true,
      phoneNo: true,
      email: true,
      customerType: true,
      city: true,
      address: true,
      pincode: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!customer) {
    return sendResponse(
      res,
      false,
      null,
      "Customer not found",
      statusType.NOT_FOUND,
    );
  }

  return sendResponse(
    res,
    true,
    { customer },
    "Customer retrieved successfully",
    statusType.OK,
  );
});

// Update Customer
export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    companyName,
    personName,
    phoneNo,
    email,
    customerType,
    city,
    address,
    pincode,
    status,
  } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if customer exists
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingCustomer) {
    return sendResponse(
      res,
      false,
      null,
      "Customer not found",
      statusType.NOT_FOUND,
    );
  }

  // Check if new phone number conflicts with other customers
  if (phoneNo && phoneNo !== existingCustomer.phoneNo) {
    const phoneConflict = await prisma.customer.findFirst({
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
        `Customer with this phone number already exists`,
        statusType.CONFLICT,
      );
    }
  }

  // Update customer
  const updatedCustomer = await prisma.customer.update({
    where: {
      id: parseInt(id),
    },
    data: {
      companyName: companyName || existingCustomer.companyName,
      personName: personName || existingCustomer.personName,
      phoneNo: phoneNo || existingCustomer.phoneNo,
      email: email !== undefined ? email : existingCustomer.email,
      customerType:
        customerType !== undefined
          ? customerType
          : existingCustomer.customerType,
      city: city !== undefined ? city : existingCustomer.city,
      address: address || existingCustomer.address,
      pincode: pincode !== undefined ? pincode : existingCustomer.pincode,
      status: status !== undefined ? status : existingCustomer.status,
    },
    select: {
      id: true,
      companyName: true,
      personName: true,
      phoneNo: true,
      email: true,
      customerType: true,
      city: true,
      address: true,
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
      message: "Customer updated successfully",
      customer: updatedCustomer,
    },
    "Customer updated",
    statusType.OK,
  );
});

// Delete Customer (Soft Delete)
export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if customer exists
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingCustomer) {
    return sendResponse(
      res,
      false,
      null,
      "Customer not found",
      statusType.NOT_FOUND,
    );
  }

  // Check if customer is being used in orders (if you have this relation)
  // const orderUsingCustomer = await prisma.order.findFirst({
  //   where: {
  //     customerId: parseInt(id),
  //   },
  // });

  // if (orderUsingCustomer) {
  //   return sendResponse(
  //     res,
  //     false,
  //     null,
  //     "Cannot delete customer. It is being used in orders.",
  //     statusType.BAD_REQUEST,
  //   );
  // }

  // Soft delete
  await prisma.customer.update({
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
    { message: "Customer deleted successfully" },
    "Customer deleted",
    statusType.OK,
  );
});

// Get Active Customers (for dropdowns)
export const getActiveCustomers = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const customers = await prisma.customer.findMany({
    where: {
      status: true,
      deleted: false,
    },
    select: {
      id: true,
      companyName: true,
      personName: true,
      phoneNo: true,
    },
    orderBy: {
      companyName: "asc",
    },
  });

  return sendResponse(
    res,
    true,
    { customers },
    "Active customers retrieved successfully",
    statusType.OK,
  );
});

// Export all functions
export const customerController = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getActiveCustomers,
};
