import jwt from "jsonwebtoken";
import { sendError } from "../../utils/responseHandler.js";

const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authorization token missing", 401);
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.admin = decoded;
    next();
  } catch (error) {
    return sendError(res, "Invalid or expired token", 401);
  }
};

export default adminAuth;
