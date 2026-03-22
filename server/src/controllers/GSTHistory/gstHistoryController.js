import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
  validatePagination,
} from "../../utils/index.js";

// --------------------------------------------------------------------
// GET GST REPORT HISTORY (separate history table)
// --------------------------------------------------------------------
export const getAllGSTReportHistory = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    fileName = "",
    type = "",
    source = "",
    reportKey = "",
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

  const andConditions = [];

  if (fileName) {
    andConditions.push({ fileName: { contains: fileName } });
  }
  if (type) {
    andConditions.push({ type });
  }
  if (source) {
    andConditions.push({ source });
  }
  if (reportKey) {
    andConditions.push({ reportKey });
  }
  if (search) {
    andConditions.push({
      OR: [
        { fileName: { contains: search } },
        { template: { contains: search } },
        { reportKey: { contains: search } },
        { source: { contains: search } },
      ],
    });
  }

  const where = andConditions.length ? { AND: andConditions } : {};
  const validSortFields = ["fileName", "type", "source", "reportKey", "createdAt"];
  const orderBy = {
    [validSortFields.includes(sortBy) ? sortBy : "createdAt"]:
      sortOrder === "asc" ? "asc" : "desc",
  };

  const [histories, total] = await Promise.all([
    prisma.gstReportHistory.findMany({
      where,
      skip,
      take: validatedLimit,
      orderBy,
      include: {
        user: { select: { id: true, username: true, shop_name: true } },
      },
    }),
    prisma.gstReportHistory.count({ where }),
  ]);

  const totalPages = Math.ceil(total / validatedLimit);

  return sendResponse(
    res,
    true,
    {
      histories,
      pagination: {
        total,
        totalPages,
        currentPage: validatedPage,
        limit: validatedLimit,
        hasNextPage: validatedPage < totalPages,
        hasPrevPage: validatedPage > 1,
      },
    },
    "GST report history retrieved successfully",
    statusType.OK,
  );
});

export const gstHistoryController = {
  getAllGSTReportHistory,
};
