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
