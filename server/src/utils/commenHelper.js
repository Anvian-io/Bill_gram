import { getDb } from "../db/database.js";
import { sendResponse, statusType } from "./index.js";

export function getPrismaOrFail(res) {
  const prisma = getDb();

  if (!prisma) {
    sendResponse(
      res,
      statusType.INTERNAL_SERVER_ERROR,
      null,
      "Database not initialized",
    );
    return null;
  }

  return prisma;
}


// Validate pagination parameters
export const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  
  return {
    page: pageNum < 1 ? 1 : pageNum,
    limit: limitNum < 1 ? 10 : limitNum > 100 ? 100 : limitNum,
  };
};

// Build search query
export const buildSearchQuery = (search, fields) => {
  if (!search || !fields.length) return {};
  
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive',
      },
    })),
  };
};