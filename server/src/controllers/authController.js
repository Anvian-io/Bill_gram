import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db/database.js";
import { sendResponse, asyncHandler, statusType } from "../utils/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authController = {
  // Register user
  register: asyncHandler(async (req, res) => {
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

    const prisma = getDb();
    if (!prisma) {
      return sendResponse(
        res,
        statusType.INTERNAL_SERVER_ERROR,
        null,
        "Database not initialized",
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return sendResponse(
        res,
        statusType.CONFLICT,
        null,
        "User already exists",
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
      statusType.CREATED,
      {
        message: "User registered successfully",
        user,
      },
      "Registration successful",
    );
  }),

  // Login user
  login: asyncHandler(async (req, res) => {
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

    const prisma = getDb();
    if (!prisma) {
      return sendResponse(
        res,
        statusType.INTERNAL_SERVER_ERROR,
        null,
        "Database not initialized",
      );
    }

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
  }),

  // Check authentication
  check: asyncHandler(async (req, res) => {
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
      const prisma = getDb();

      if (!prisma) {
        return sendResponse(
          res,
          statusType.INTERNAL_SERVER_ERROR,
          null,
          "Database not initialized",
        );
      }

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
        return sendResponse(
          res,
          statusType.UNAUTHORIZED,
          null,
          "Invalid token",
        );
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
  }),

  // Optional: Logout (client-side token removal)
  logout: asyncHandler(async (req, res) => {
    return sendResponse(
      res,
      statusType.OK,
      null,
      "Logout successful (client should remove token)",
    );
  }),

  // Optional: Refresh token
  refreshToken: asyncHandler(async (req, res) => {
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
      const prisma = getDb();

      if (!prisma) {
        return sendResponse(
          res,
          statusType.INTERNAL_SERVER_ERROR,
          null,
          "Database not initialized",
        );
      }

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
  }),
};
