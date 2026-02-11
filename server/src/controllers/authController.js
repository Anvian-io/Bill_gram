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
      statusType.BAD_REQUEST,
      null,
      "Missing required fields (username, email, password)",
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
    return sendResponse(res, statusType.CONFLICT, null, "User already exists");
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
    statusType.CREATED,
    {
      message: "User registered successfully",
      user,
    },
    "Registration successful",
  );
});

export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // This will set userId and email
    next();
  } catch (error) {
    console.error("Token verification error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token has expired" });
    }

    return res.status(500).json({ error: "Token verification failed" });
  }
};

// Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return sendResponse(
      res,
      statusType.BAD_REQUEST,
      null,
      "Email and password are required",
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
      statusType.UNAUTHORIZED,
      null,
      "Invalid credentials",
    );
  }

  // Check password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return sendResponse(
      res,
      statusType.UNAUTHORIZED,
      null,
      "Invalid credentials",
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
    statusType.OK,
    {
      token,
      user: userWithoutPassword,
    },
    "Login successful",
  );
});

// Check authentication
export const check = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return sendResponse(
      res,
      statusType.UNAUTHORIZED,
      null,
      "No token provided",
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
      return sendResponse(res, statusType.NOT_FOUND, null, "User not found");
    }

    return sendResponse(res, statusType.OK, { user }, "Token is valid");
  } catch (error) {
    console.error("Auth check error:", error);

    if (error.name === "JsonWebTokenError") {
      return sendResponse(res, statusType.UNAUTHORIZED, null, "Invalid token");
    } else if (error.name === "TokenExpiredError") {
      return sendResponse(
        res,
        statusType.UNAUTHORIZED,
        null,
        "Token has expired",
      );
    }

    return sendResponse(
      res,
      statusType.INTERNAL_SERVER_ERROR,
      null,
      "Authentication check failed",
    );
  }
});

// Optional: Logout (client-side token removal)
export const logout = asyncHandler(async (req, res) => {
  return sendResponse(
    res,
    statusType.OK,
    null,
    "Logout successful (client should remove token)",
  );
});

// Optional: Refresh token
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendResponse(
      res,
      statusType.BAD_REQUEST,
      null,
      "Refresh token is required",
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
        statusType.UNAUTHORIZED,
        null,
        "Invalid refresh token",
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
      statusType.OK,
      {
        token: newToken,
        refreshToken: newRefreshToken,
      },
      "Token refreshed successfully",
    );
  } catch (error) {
    console.error("Refresh token error:", error);

    return sendResponse(
      res,
      statusType.UNAUTHORIZED,
      null,
      "Invalid or expired refresh token",
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
  authenticateToken
};
