import mongoose from "mongoose";
import new_EventConfig from "../../../models/v2/admin/event.model.js";
import UserLogs from "../../../models/v2/user/logs.model.js";
import { sendSuccess, sendError } from "../../../utils/responseHandler.js";

class userController {
  static async getEventById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return sendError(res, "Event id is required", 400);
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return sendError(res, "Invalid event id", 400);
      }

      const event = await new_EventConfig.findById(id);

      if (!event) {
        return sendError(res, "Event not found", 404);
      }

      return sendSuccess(res, "Event fetched successfully", event);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  static async logs(req, res) {
    try {
      const body = req.body || {};
      const { email, sessionId } = body;

      if (!email || !sessionId) {
        return sendError(res, "email and sessionId are required", 400);
      }

      const normalizedEmail = String(email).toLowerCase().trim();
      const normalizedSessionId = String(sessionId).trim();
      const newLog = {
        ...body,
        email: normalizedEmail,
        sessionId: normalizedSessionId,
      };

      let doc = await UserLogs.findOne({ email: normalizedEmail });

      if (!doc) {
        doc = await UserLogs.create({
          email: normalizedEmail,
          logs: [newLog],
        });

        return sendSuccess(res, "Log created successfully", doc, 201);
      }

      const logIndex = doc.logs.findIndex(
        (log) => String(log.sessionId).trim() === normalizedSessionId,
      );

      if (logIndex >= 0) {
        doc.logs[logIndex].set(newLog);
      } else {
        doc.logs.push(newLog);
      }

      await doc.save();

      return sendSuccess(res, "Log saved successfully", doc);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }
}

export default userController;
