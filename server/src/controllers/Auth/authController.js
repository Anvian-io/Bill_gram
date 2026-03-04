import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
} from "../../utils/index.js";
import { extractFilename, getImageUrl } from "../../utils/imageUrl.js";

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

  // Set cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
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
        notification: true,
        sound: true,
        company_logo: true, // store logo URL or file path
        signature: true, // store logo URL or file path
        upi_id: true,
        company_name: true,
        address: true,
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
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
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

export const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

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

    // Validate that decoded contains a user identifier
    if (!decoded.userId && !decoded.id) {
      console.error("Token payload missing userId/id:", decoded);
      return sendResponse(
        res,
        false,
        null,
        "Invalid token payload",
        statusType.UNAUTHORIZED,
      );
    }

    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      username: decoded.username,
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
});

/**
 * Update User Profile
 */

export const updateProfile = asyncHandler(async (req, res) => {
  // const userId = req.user.id; // from authenticateToken middleware
  const {
    username,
    email,
    shop_name,
    phone,
    notification,
    sound,
    company_logo,
    signature,
    upi_id,
    company_name,
    address,
    userId,
  } = req.body;

  const prisma = getPrismaOrFail(res);
  if (!prisma) return;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!existingUser) {
    return sendResponse(
      res,
      false,
      null,
      "User not found",
      statusType.NOT_FOUND,
    );
  }

  // Prepare update data (only include fields that are provided)
  const updateData = {};

  if (username !== undefined) {
    // Check if username is already taken by another user
    if (username !== existingUser.username) {
      const usernameTaken = await prisma.user.findUnique({
        where: { username },
      });
      if (usernameTaken) {
        return sendResponse(
          res,
          false,
          null,
          "Username already taken",
          statusType.CONFLICT,
        );
      }
    }
    updateData.username = username;
  }

  if (email !== undefined) {
    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });
      if (emailTaken) {
        return sendResponse(
          res,
          false,
          null,
          "Email already in use",
          statusType.CONFLICT,
        );
      }
    }
    updateData.email = email;
  }

  if (shop_name !== undefined) updateData.shop_name = shop_name;
  if (phone !== undefined) updateData.phone = phone;
  if (notification !== undefined) updateData.notification = notification;
  if (sound !== undefined) updateData.sound = sound;
  if (upi_id !== undefined) updateData.upi_id = upi_id;
  if (company_name !== undefined) updateData.company_name = company_name;
  if (address !== undefined) updateData.address = address;

  // Handle company logo – extract filename if a URL is provided
  if (company_logo !== undefined) {
    // If the logo is being removed (null or empty string)
    if (company_logo === null || company_logo === "") {
      updateData.company_logo = null;
    } else {
      // Extract filename from the URL (assumes the image has been uploaded)
      const filename = extractFilename(company_logo);
      if (filename) {
        updateData.company_logo = filename;
      } else {
        // If extraction fails, you might want to store the original string or return error
        // For safety, we'll store null or ignore
        updateData.company_logo = null;
      }
    }
  }
  if (signature !== undefined) {
    // If the logo is being removed (null or empty string)
    if (signature === null || signature === "") {
      updateData.signature = null;
    } else {
      // Extract filename from the URL (assumes the image has been uploaded)
      const filename = extractFilename(signature);
      if (filename) {
        updateData.signature = filename;
      } else {
        // If extraction fails, you might want to store the original string or return error
        // For safety, we'll store null or ignore
        updateData.signature = null;
      }
    }
  }

  // Perform update
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      shop_name: true,
      phone: true,
      notification: true,
      sound: true,
      company_logo: true,
      signature: true,
      upi_id: true,
      company_name: true,
      address: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Convert stored filename to public URL
  const userWithImageUrl = {
    ...updatedUser,
    company_logo: getImageUrl(updatedUser.company_logo),
    signature: getImageUrl(updatedUser.signature),
  };

  return sendResponse(
    res,
    true,
    { user: userWithImageUrl },
    "Profile updated successfully",
    statusType.OK,
  );
});
// Export all functions as an object if you still want to use them grouped
export const authController = {
  register,
  login,
  check,
  logout,
  refreshToken,
  authenticateToken,
  updateProfile,
};
