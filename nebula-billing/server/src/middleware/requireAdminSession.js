import { AdminSession } from "../models/AdminSession.js";

export const requireAdminSession = async (req, res, next) => {
  const sessionToken = req.header("x-admin-session-token");

  if (!sessionToken) {
    return res.status(401).json({ message: "Admin session token is required" });
  }

  const session = await AdminSession.findOne({ sessionToken });

  if (!session) {
    return res.status(401).json({ message: "Invalid admin session" });
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await AdminSession.deleteOne({ _id: session._id });
    return res.status(401).json({ message: "Admin session has expired" });
  }

  req.admin = {
    email: session.email,
    sessionId: session._id.toString(),
  };

  return next();
};
