import mongoose from "mongoose";
import new_EventConfig from "../../../models/v2/admin/event.model.js";
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
}

export default userController;
