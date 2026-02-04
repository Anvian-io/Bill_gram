import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db/database.js";
import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
} from "../utils/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Register user
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, shop_name, phone } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return sendResponse(
      res,
      false,
      null,
      "Missing required fields (username, email, password)",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    return sendResponse(
      res,
      false,
      null,
      "User already exists",
      statusType.CONFLICT,
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user using Prisma
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      shop_name,
      phone,
    },
    select: {
      id: true,
      username: true,
      email: true,
      shop_name: true,
      phone: true,
      createdAt: true,
    },
  });

  return sendResponse(
    res,
    true,
    {
      message: "User registered successfully",
      user,
    },
    "Registration successful",
    statusType.CREATED,
  );
});

// Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return sendResponse(
      res,
      false,
      null,
      "Email and password are required",
      statusType.BAD_REQUEST,
    );
  }

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Find user with password
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return sendResponse(
      res,
      false,
      null,
      "Invalid credentials",
      statusType.UNAUTHORIZED,
    );
  }

  // Check password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return sendResponse(
      res,
      false,
      null,
      "Invalid credentials",
      statusType.UNAUTHORIZED,
    );
  }

  // Create token
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "24h",
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return sendResponse(
    res,
    true,
    {
      token,
      user: userWithoutPassword,
    },
    "Login successful",
    statusType.OK,
  );
});

// Check authentication
export const check = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return sendResponse(
      res,
      false,
      null,
      "No token provided",
      statusType.UNAUTHORIZED,
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const prisma = getPrismaOrFail(res);
    if (!prisma) return;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        shop_name: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendResponse(
        res,
        false,
        null,
        "User not found",
        statusType.NOT_FOUND,
      );
    }

    return sendResponse(res, true, { user }, "Token is valid", statusType.OK);
  } catch (error) {
    console.error("Auth check error:", error);

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
      "Authentication check failed",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
});

// Optional: Logout (client-side token removal)
export const logout = asyncHandler(async (req, res) => {
  return sendResponse(
    res,
    true,
    null,
    "Logout successful (client should remove token)",
    statusType.OK,
  );
});

// Optional: Refresh token
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendResponse(
      res,
      false,
      null,
      "Refresh token is required",
      statusType.BAD_REQUEST,
    );
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const prisma = getPrismaOrFail(res);
    if (!prisma) return;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return sendResponse(
        res,
        false,
        null,
        "Invalid refresh token",
        statusType.UNAUTHORIZED,
      );
    }

    // Create new access token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    // Create new refresh token
    const newRefreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return sendResponse(
      res,
      true,
      {
        token: newToken,
        refreshToken: newRefreshToken,
      },
      "Token refreshed successfully",
      statusType.OK,
    );
  } catch (error) {
    console.error("Refresh token error:", error);

    return sendResponse(
      res,
      false,
      null,
      "Invalid or expired refresh token",
      statusType.UNAUTHORIZED,
    );
  }
});

// Export all functions as an object if you still want to use them grouped
export const authController = {
  register,
  login,
  check,
  logout,
  refreshToken,
};
