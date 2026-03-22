import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  sendResponse,
  asyncHandler,
  statusType,
  getPrismaOrFail,
} from "../../utils/index.js";
import { extractFilename, getImageUrl } from "../../utils/imageUrl.js";
import { createNotification as createNotificationHelper } from "../../utils/notificationHelper.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SUBSCRIPTION_TEST_DURATION_DAYS = 1;
const SUBSCRIPTION_WARNING_WINDOW_MS =
  SUBSCRIPTION_TEST_DURATION_DAYS * 24 * 60 * 60 * 1000;
const SUBSCRIPTION_NOTIFICATION_SECTION = "subscription";
const SUBSCRIPTION_NOTIFICATION_PAGE = "notifications";

const formatSubscriptionDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const getTodayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const calculateSubscriptionExpiryDate = (registrationDate = new Date()) => {
  const expiryDate = new Date(registrationDate);

  if (SUBSCRIPTION_TEST_DURATION_DAYS > 0) {
    expiryDate.setDate(expiryDate.getDate() + SUBSCRIPTION_TEST_DURATION_DAYS);
    expiryDate.setHours(23, 59, 59, 999);
    return expiryDate;
  }

  return new Date(
    registrationDate.getFullYear() + 1,
    2,
    31,
    23,
    59,
    59,
    999
  );
};

const getFixedExistingUserSubscriptionExpiry = () =>
  new Date(2027, 2, 31, 23, 59, 59, 999);

async function setUserSubscriptionExpiry(prisma, userId, expiryDate) {
  await prisma.$executeRawUnsafe(
    `UPDATE users SET subscription_expires_at = ? WHERE id = ?`,
    expiryDate.toISOString(),
    userId
  );
}

async function getUserSubscriptionExpiry(prisma, userId) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT subscription_expires_at AS subscriptionExpiresAt FROM users WHERE id = ? LIMIT 1`,
    userId
  );

  const subscriptionExpiresAt = rows?.[0]?.subscriptionExpiresAt ?? null;
  return subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
}

async function createSubscriptionNotificationOnce(
  prisma,
  res,
  { userId, title, message, type }
) {
  const { start, end } = getTodayBounds();

  const existingNotification = await prisma.notification.findFirst({
    where: {
      userId,
      title,
      section: SUBSCRIPTION_NOTIFICATION_SECTION,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    select: { id: true },
  });

  if (existingNotification) {
    return;
  }

  await createNotificationHelper(
    {
      title,
      message,
      type,
      userIds: [userId],
      section: SUBSCRIPTION_NOTIFICATION_SECTION,
      page: SUBSCRIPTION_NOTIFICATION_PAGE,
    },
    res
  );
}

async function notifySubscriptionStatus(prisma, res, user, { onRegister = false } = {}) {
  // if (user?.subscriptionExpiresAt == null) {
  //   return { expired: false };
  // }
  const expiryDate =
    user?.subscriptionExpiresAt instanceof Date
      ? user.subscriptionExpiresAt
      : user?.subscriptionExpiresAt
        ? new Date(user.subscriptionExpiresAt)
        : await getUserSubscriptionExpiry(prisma, user.id);

  if (!expiryDate) {
    return { expired: true };
  }

  const now = new Date();

  if (expiryDate.getTime() <= now.getTime()) {
    await createSubscriptionNotificationOnce(prisma, res, {
      userId: user.id,
      title: "Subscription Expired",
      message: `Your subscription expired on ${formatSubscriptionDate(
        expiryDate
      )}. Please renew to continue using BillGram.`,
      type: "error",
    });

    return { expired: true, expiryDate };
  }

  if (onRegister) {
    await createSubscriptionNotificationOnce(prisma, res, {
      userId: user.id,
      title: "Subscription Activated",
      message: `Your subscription is active until ${formatSubscriptionDate(
        expiryDate
      )}.`,
      type: "success",
    });
  }

  const timeRemaining = expiryDate.getTime() - now.getTime();
  if (timeRemaining <= SUBSCRIPTION_WARNING_WINDOW_MS) {
    await createSubscriptionNotificationOnce(prisma, res, {
      userId: user.id,
      title: "Subscription Expiring Soon",
      message: `Your subscription will expire on ${formatSubscriptionDate(
        expiryDate
      )}. Please renew soon.`,
      type: "warning",
    });
  }

  return { expired: false, expiryDate };
}

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
      OR: [{ email }],
    },
  });

  if (existingUser) {
    const subscriptionExpiresAt = getFixedExistingUserSubscriptionExpiry();

    await setUserSubscriptionExpiry(prisma, existingUser.id, subscriptionExpiresAt);
    existingUser.subscriptionExpiresAt = subscriptionExpiresAt;

    await notifySubscriptionStatus(prisma, res, existingUser, { onRegister: true });

    return sendResponse(
      res,
      true,
      {
        message: "User registered successfully",
        existingUser,
      },
      "Registration successful",
      statusType.CREATED,
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  const subscriptionExpiresAt = calculateSubscriptionExpiryDate();

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

  await setUserSubscriptionExpiry(prisma, user.id, subscriptionExpiresAt);
  user.subscriptionExpiresAt = subscriptionExpiresAt;

  await notifySubscriptionStatus(prisma, res, user, { onRegister: true });

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

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
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

  const subscriptionStatus = await notifySubscriptionStatus(prisma, res, user);
  if (subscriptionStatus.expired) {
    return sendResponse(
      res,
      false,
      null,
      `Subscription expired on ${formatSubscriptionDate(
        subscriptionStatus.expiryDate
      )}`,
      statusType.FORBIDDEN,
    );
  }

  user.subscriptionExpiresAt = subscriptionStatus.expiryDate || null;

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

    const subscriptionExpiresAt = await getUserSubscriptionExpiry(prisma, user.id);
    user.subscriptionExpiresAt = subscriptionExpiresAt;

    const subscriptionStatus = await notifySubscriptionStatus(prisma, res, user);
    if (subscriptionStatus.expired) {
      return sendResponse(
        res,
        false,
        null,
        `Subscription expired on ${formatSubscriptionDate(
          subscriptionStatus.expiryDate
        )}`,
        statusType.FORBIDDEN,
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
