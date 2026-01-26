import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../utils/index.js";

// Create Account
export const createAccount = asyncHandler(async (req, res) => {
  const {
    accountHolder,
    ifscCode,
    bankName,
    description,
    qrCode,
    gpayNo,
    status = true,
  } = req.body;

  // Validate required fields
  if (!accountHolder || !ifscCode || !bankName) {
    return sendResponse(
      res,
      statusType.BAD_REQUEST,
      null,
      "Account holder, IFSC code, and bank name are required",
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if account with same IFSC code already exists
  const existingAccount = await prisma.account.findFirst({
    where: {
      ifscCode,
      deleted: false,
    },
  });

  if (existingAccount) {
    return sendResponse(
      res,
      statusType.CONFLICT,
      null,
      `Account with this IFSC code already exists`,
    );
  }

  // Create account
  const account = await prisma.account.create({
    data: {
      accountHolder,
      ifscCode,
      bankName,
      description: description || "",
      qrCode: qrCode || null,
      gpayNo: gpayNo || null,
      status,
    },
    select: {
      id: true,
      accountHolder: true,
      ifscCode: true,
      bankName: true,
      description: true,
      qrCode: true,
      gpayNo: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    statusType.CREATED,
    {
      message: "Account created successfully",
      account,
    },
    "Account created",
  );
});

// Get All Accounts with Pagination, Search and Filters
export const getAccounts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    accountHolder = "",
    bankName = "",
    ifscCode = "",
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

  // Account holder filter
  if (accountHolder) {
    andConditions.push({
      accountHolder: {
        contains: accountHolder,
      },
    });
  }

  // Bank name filter
  if (bankName) {
    andConditions.push({
      bankName: {
        contains: bankName,
      },
    });
  }

  // IFSC code filter
  if (ifscCode) {
    andConditions.push({
      ifscCode: {
        contains: ifscCode,
      },
    });
  }

  // Search in accountHolder + bankName + ifscCode + description
  if (search) {
    andConditions.push({
      OR: [
        {
          accountHolder: {
            contains: search,
          },
        },
        {
          bankName: {
            contains: search,
          },
        },
        {
          ifscCode: {
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
    "accountHolder",
    "bankName",
    "ifscCode",
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
  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      select: {
        id: true,
        accountHolder: true,
        ifscCode: true,
        bankName: true,
        description: true,
        qrCode: true,
        gpayNo: true,
        status: true,
        deleted: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.account.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    statusType.OK,
    {
      accounts,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "Accounts retrieved successfully",
  );
});

// Get Single Account by ID
export const getAccountById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const account = await prisma.account.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
    select: {
      id: true,
      accountHolder: true,
      ifscCode: true,
      bankName: true,
      description: true,
      qrCode: true,
      gpayNo: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!account) {
    return sendResponse(res, statusType.NOT_FOUND, null, "Account not found");
  }

  return sendResponse(
    res,
    statusType.OK,
    { account },
    "Account retrieved successfully",
  );
});

// Update Account
export const updateAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    accountHolder,
    ifscCode,
    bankName,
    description,
    qrCode,
    gpayNo,
    status,
  } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if account exists
  const existingAccount = await prisma.account.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingAccount) {
    return sendResponse(res, statusType.NOT_FOUND, null, "Account not found");
  }

  // Check if new IFSC code conflicts with other accounts
  if (ifscCode && ifscCode !== existingAccount.ifscCode) {
    const ifscConflict = await prisma.account.findFirst({
      where: {
        ifscCode,
        deleted: false,
        NOT: {
          id: parseInt(id),
        },
      },
    });

    if (ifscConflict) {
      return sendResponse(
        res,
        statusType.CONFLICT,
        null,
        `Account with this IFSC code already exists`,
      );
    }
  }

  // Update account
  const updatedAccount = await prisma.account.update({
    where: {
      id: parseInt(id),
    },
    data: {
      accountHolder: accountHolder || existingAccount.accountHolder,
      ifscCode: ifscCode || existingAccount.ifscCode,
      bankName: bankName || existingAccount.bankName,
      description:
        description !== undefined ? description : existingAccount.description,
      qrCode: qrCode !== undefined ? qrCode : existingAccount.qrCode,
      gpayNo: gpayNo !== undefined ? gpayNo : existingAccount.gpayNo,
      status: status !== undefined ? status : existingAccount.status,
    },
    select: {
      id: true,
      accountHolder: true,
      ifscCode: true,
      bankName: true,
      description: true,
      qrCode: true,
      gpayNo: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    {
      message: "Account updated successfully",
      account: updatedAccount,
    },
    "Account updated",
  );
});

// Delete Account (Soft Delete)
export const deleteAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if account exists
  const existingAccount = await prisma.account.findFirst({
    where: {
      id: parseInt(id),
      deleted: false,
    },
  });

  if (!existingAccount) {
    return sendResponse(res, statusType.NOT_FOUND, null, "Account not found");
  }

  // Check if account is being used in transactions (if you have this relation)
  // const transactionUsingAccount = await prisma.transaction.findFirst({
  //   where: {
  //     accountId: parseInt(id),
  //   },
  // });

  // if (transactionUsingAccount) {
  //   return sendResponse(
  //     res,
  //     statusType.BAD_REQUEST,
  //     null,
  //     "Cannot delete account. It is being used in transactions."
  //   );
  // }

  // Soft delete
  await prisma.account.update({
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
    { message: "Account deleted successfully" },
    "Account deleted",
  );
});

// Get Active Accounts (for dropdowns)
export const getActiveAccounts = asyncHandler(async (req, res) => {
  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  const accounts = await prisma.account.findMany({
    where: {
      status: true,
      deleted: false,
    },
    select: {
      id: true,
      accountHolder: true,
      bankName: true,
      ifscCode: true,
    },
    orderBy: {
      accountHolder: "asc",
    },
  });

  return sendResponse(
    res,
    statusType.OK,
    { accounts },
    "Active accounts retrieved successfully",
  );
});

// Export all functions
export const accountController = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  getActiveAccounts,
};
