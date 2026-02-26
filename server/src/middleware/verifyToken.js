import jwt from "jsonwebtoken";
import { sendResponse, statusType } from "../utils/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const verifyUser = async (req, res, next) => {
  // 1. Try to get token from cookies
  let token = req.cookies?.token;

  // 2. If not in cookies, check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return sendResponse(
      res,
      false,
      null,
      "Authentication required. No token provided.",
      statusType.UNAUTHORIZED,
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.userId || decoded.id,
      userId: decoded.userId || decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return sendResponse(
        res,
        false,
        null,
        "Invalid token",
        statusType.UNAUTHORIZED,
      );
    } else if (error.name === "TokenExpiredError") {
      return sendResponse(
        res,
        false,
        null,
        "Token has expired",
        statusType.UNAUTHORIZED,
      );
    }

    return sendResponse(
      res,
      false,
      null,
      "Token verification failed",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
};
