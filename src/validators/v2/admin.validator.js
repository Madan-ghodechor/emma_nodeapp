import { sendError } from "../../utils/responseHandler.js";
import mongoose from "mongoose";

class AdminValidator {
  static validateAdminLogin(req, res, next) {
    const { email, password } = req.body || {};

    if (!email) {
      return sendError(res, "Email is required", 400);
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return sendError(res, "Email is invalid", 400);
    }

    if (!password) {
      return sendError(res, "Password is required", 400);
    }

    return next();
  }

  static validateCreateAdmin(req, res, next) {
    const { firstName, lastName, phone, email, password, adminType } =
      req.body || {};

    if (!firstName) {
      return sendError(res, "First name is required", 400);
    }

    if (!lastName) {
      return sendError(res, "Last name is required", 400);
    }

    if (!phone) {
      return sendError(res, "Phone number is required", 400);
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return sendError(res, "Phone number must be exactly 10 digits", 400);
    }

    if (!email) {
      return sendError(res, "Email is required", 400);
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return sendError(res, "Email is invalid", 400);
    }

    if (!password) {
      return sendError(res, "Password is required", 400);
    }

    if (password.length < 8) {
      return sendError(res, "Password must be at least 8 characters", 400);
    }

    if (adminType === undefined || adminType === null || adminType === "") {
      return sendError(res, "adminType is required", 400);
    }

    if (![1, 2].includes(Number(adminType))) {
      return sendError(res, "adminType must be 1 or 2", 400);
    }

    return next();
  }

  static validateCreateEvent(req, res, next) {
    try {
      const body = req.body || {};
      const files = req.files || {};

      const isEmpty = (value) =>
        value === undefined || value === null || String(value).trim() === "";

      const isBooleanLike = (value) =>
        value === true ||
        value === false ||
        value === "true" ||
        value === "false" ||
        value === "1" ||
        value === "0" ||
        value === 1 ||
        value === 0;

      const isNumberLike = (value) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !Number.isNaN(Number(value));

      const requiredStringFields = [
        "eventName",
        "termsEventName",
        "resortName",
        "resortAddress",
        "hotelSupportContact",
        "hotelSupportEmail",
        "googleLocation",
        "standardCheckIn",
        "standardCheckOut",
        "cotravSupportContact",
        "cotravSupportEmail",
      ];

      for (const field of requiredStringFields) {
        if (isEmpty(body[field])) {
          return sendError(res, `${field} is required`, 400);
        }

        if (typeof body[field] !== "string" || !body[field].trim()) {
          return sendError(res, `${field} must be a valid string`, 400);
        }
      }

      const requiredBooleanFields = [
        "guestsRegistrationEnabled",
        "roomPricingExcludingGst",
        "singleSharingRoomEnabled",
        "doubleSharingRoomEnabled",
        "tripleSharingRoomEnabled",
      ];

      for (const field of requiredBooleanFields) {
        if (
          body[field] === undefined ||
          body[field] === null ||
          body[field] === ""
        ) {
          return sendError(res, `${field} is required`, 400);
        }

        if (!isBooleanLike(body[field])) {
          return sendError(res, `${field} must be a boolean`, 400);
        }
      }

      const requiredNumberFields = [
        "memberPrice",
        "nonMemberPrice",
        "gstPercentage",
        "singleSharingPrice",
        "doubleSharingPrice",
        "tripleSharingPrice",
      ];

      for (const field of requiredNumberFields) {
        if (
          body[field] === undefined ||
          body[field] === null ||
          body[field] === ""
        ) {
          return sendError(res, `${field} is required`, 400);
        }

        if (!isNumberLike(body[field])) {
          return sendError(res, `${field} must be a valid number`, 400);
        }
      }

      if (!/^\S+@\S+\.\S+$/.test(body.hotelSupportEmail)) {
        return sendError(res, "hotelSupportEmail is invalid", 400);
      }

      if (!/^\S+@\S+\.\S+$/.test(body.cotravSupportEmail)) {
        return sendError(res, "cotravSupportEmail is invalid", 400);
      }

      if (!/^[0-9+\-\s()]{6,20}$/.test(body.hotelSupportContact)) {
        return sendError(res, "hotelSupportContact is invalid", 400);
      }

      if (!/^[0-9+\-\s()]{6,20}$/.test(body.cotravSupportContact)) {
        return sendError(res, "cotravSupportContact is invalid", 400);
      }

      if (!files.headerBanner) {
        return sendError(res, "headerBanner is required", 400);
      }

      if (!files.voucherHeaderImage) {
        return sendError(res, "voucherHeaderImage is required", 400);
      }

      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      const maxSizeInBytes = 5 * 1024 * 1024;

      if (!allowedMimeTypes.includes(files.headerBanner.mimetype)) {
        return sendError(
          res,
          "headerBanner must be a jpg, jpeg, png, or webp image",
          400,
        );
      }

      if (!allowedMimeTypes.includes(files.voucherHeaderImage.mimetype)) {
        return sendError(
          res,
          "voucherHeaderImage must be a jpg, jpeg, png, or webp image",
          400,
        );
      }

      if (files.headerBanner.size > maxSizeInBytes) {
        return sendError(res, "headerBanner must be less than 5 MB", 400);
      }

      if (files.voucherHeaderImage.size > maxSizeInBytes) {
        return sendError(res, "voucherHeaderImage must be less than 5 MB", 400);
      }

      return next();
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  static validateUpdateEvent(req, res, next) {
    const { id } = req.params || {};

    if (!id) {
      return sendError(res, "Event id is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid event id", 400);
    }

    return next();
  }
}

export default AdminValidator;

// import { sendError } from '../../utils/responseHandler.js';

// export const validateAdminLogin = (req, res, next) => {
//   const { email, password } = req.body || {};
// //   const errors = [];

//   if (!email) {
//     return sendError(res, "Email is required", 400);

//   }

//   if (email && !/^\S+@\S+\.\S+$/.test(email)) {
//     return sendError(res, "Email is invalid", 400);
//     }

//   if (!password) {
//     return sendError(res, "Password is required", 400);
//   }

// //   if (errors.length > 0) {
// //     return sendError(res, 'Validation failed', 400, errors);
// //   }

//   return next();
// };
