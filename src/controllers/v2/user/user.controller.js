import crypto from "crypto";
import mongoose from "mongoose";
import new_EventConfig from "../../../models/v2/admin/event.model.js";
import new_Company from "../../../models/v2/user/company.model.js";
import new_Payments from "../../../models/v2/user/payments.model.js";
import UserLogs from "../../../models/v2/user/logs.model.js";
import new_Registration from "../../../models/v2/user/registration.model.js";
import new_Attendees from "../../../models/v2/user/attendees.model.js";
import new_Room from "../../../models/v2/user/room.model.js";

import { sendSuccess, sendError } from "../../../utils/responseHandler.js";


// const addRegistrationCompany = async ({ company, gst, orderId }) => {
//   const companyName = String(company || "").trim();
//   if (!companyName) return null;

//   const update = {
//     name: companyName,
//     bulkRefId: orderId,
//   };

//   const normalizedGst = String(gst || "").trim();
//   if (normalizedGst) {
//     update.gst = normalizedGst;
//   }

//   return new_Company.findOneAndUpdate(
//     { name: companyName },
//     {
//       $set: update,
//       $setOnInsert: {
//         isEEMAMember: 0,
//       },
//     },
//     {
//       new: true,
//       upsert: true,
//     },
//   );
// };

const addRegistrationCompany = async ({ company, gst, orderId }) => {
  const companyName = String(company || "").trim();
  if (!companyName) return null;

  const update = {
    name: companyName,
    orderId,
  };

  const normalizedGst = String(gst || "").trim();
  if (normalizedGst) {
    update.gst = normalizedGst;
  }

  return new_Company.findOneAndUpdate(
    { name: companyName },
    {
      $set: update,
      $setOnInsert: {
        isEEMAMember: 0,
      },
    },
    {
      new: true,
      upsert: true,
    },
  );
};


const BOOKING_TYPES = {
  REG_ONLY: "registration_only",
  REG_ROOM: "registration_with_room",
};

const normalizeEmail = (value = "") => String(value).toLowerCase().trim();
const normalizePhone = (value = "") => String(value).replace(/\s+/g, "").trim();
const normalizeText = (value = "") => String(value).trim();

const getMemberType = (value) => {
  const normalized = String(value || "")
    .toLowerCase()
    .trim();

  if (!normalized) return "member";

  if (["member", "eema", "yes", "true", "1"].includes(normalized)) {
    return "member";
  }

  if (
    ["non-member", "nonmember", "non", "no", "false", "0"].includes(normalized)
  ) {
    return "non-member";
  }

  return null;
};

const getRoomTypeKey = (value) => {
  const normalized = String(value || "")
    .toLowerCase()
    .trim();

  if (["single", "single-sharing", "single_sharing"].includes(normalized))
    return "single";
  if (["double", "double-sharing", "double_sharing"].includes(normalized))
    return "double";
  if (["triple", "triple-sharing", "triple_sharing"].includes(normalized))
    return "triple";

  return null;
};

const getRoomOccupantCount = (roomType) => {
  const map = {
    single: 1,
    double: 2,
    triple: 3,
  };

  return map[roomType] ?? null;
};

const isRoomEnabled = (event, roomType) => {
  if (roomType === "single") return Boolean(event.singleSharingRoomEnabled);
  if (roomType === "double") return Boolean(event.doubleSharingRoomEnabled);
  if (roomType === "triple") return Boolean(event.tripleSharingRoomEnabled);
  return false;
};

const getRegistrationFee = (event, memberType) => {
  const fee =
    memberType === "non-member" ? event.nonMemberPrice : event.memberPrice;
  return Number(fee);
};

const getRoomFee = (event, roomType) => {
  if (roomType === "single") return Number(event.singleSharingPrice);
  if (roomType === "double") return Number(event.doubleSharingPrice);
  if (roomType === "triple") return Number(event.tripleSharingPrice);
  return Number.NaN;
};

const calculatePricing = (event, memberType, bookingType, roomType) => {
  const registrationFee = getRegistrationFee(event, memberType);

  if (!Number.isFinite(registrationFee)) {
    throw new Error("Event registration price is missing or invalid");
  }

  let roomFee = 0;

  if (bookingType === BOOKING_TYPES.REG_ROOM) {
    roomFee = getRoomFee(event, roomType);

    if (!Number.isFinite(roomFee)) {
      throw new Error(
        "Event room price is missing or invalid for the selected room type",
      );
    }
  }

  const subTotal = registrationFee + roomFee;
  const gstPercent = Number(event.gstPercentage ?? 0);
  const gstAmount =
    gstPercent > 0 ? Math.round((subTotal * gstPercent) / 100) : 0;
  const totalAmount = subTotal + gstAmount;

  return {
    registrationFee,
    roomFee,
    gstPercent,
    gstAmount,
    totalAmount,
  };
};

const validateAndMapRoomAttendees = ({
  roomType,
  primaryGuest,
  attendees = [],
}) => {
  const normalizedRoomType = getRoomTypeKey(roomType);
  const occupantCount = getRoomOccupantCount(normalizedRoomType);

  if (!normalizedRoomType || occupantCount === null) {
    throw new Error("Invalid roomType");
  }

  const extraGuestsRequired = occupantCount - 1;
  const extraGuests = Array.isArray(attendees) ? attendees : [];

  if (extraGuests.length !== extraGuestsRequired) {
    throw new Error(
      `For ${normalizedRoomType} room, you must send exactly ${extraGuestsRequired} attendee(s)`,
    );
  }

  const primaryEmail = normalizeEmail(primaryGuest.email);
  const primaryPhone = normalizePhone(primaryGuest.phone);

  const seenEmails = new Set([primaryEmail]);
  const seenPhones = new Set([primaryPhone]);

  const mappedAttendees = extraGuests.map((attendee, index) => {
    const firstName = normalizeText(attendee?.firstName);
    const lastName = normalizeText(attendee?.lastName);
    const email = normalizeEmail(attendee?.email);
    const phone = normalizePhone(attendee?.phone);
    const gst = normalizeText(attendee?.gst || primaryGuest.gst || "");

    if (!firstName || !email || !phone) {
      throw new Error(
        `Attendee ${index + 1} firstName, email, and phone are required`,
      );
    }

    if (seenEmails.has(email)) {
      throw new Error("Duplicate email found in room attendees");
    }

    if (seenPhones.has(phone)) {
      throw new Error("Duplicate phone found in room attendees");
    }

    seenEmails.add(email);
    seenPhones.add(phone);

    return {
      firstName,
      lastName,
      email,
      phone,
      gst,
    };
  });

  return {
    normalizedRoomType,
    occupantCount,
    mappedAttendees,
  };
};

const verifyRazorpaySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const shouldVerifySignature =
    process.env.NODE_ENV === "production" ||
    String(process.env.VERIFY_RAZORPAY_SIGNATURE || "").toLowerCase() ===
      "true";

  if (!shouldVerifySignature) {
    return true;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return expectedSignature === razorpaySignature;
};

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

  static generateOrderId() {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `REG-${datePart}-${randomPart}`;
  }

  // static async createRegistration(req, res) {
  //   try {
  //     const body = req.body || {};
  //     const {
  //       eventId,
  //       primaryGuest,
  //       roomId,
  //       registrationEnabled,
  //       emmaReg,
  //       payment,
  //     } = body;

  //     if (!eventId) {
  //       return sendError(res, "eventId is required", 400);
  //     }

  //     if (!primaryGuest) {
  //       return sendError(res, "primaryGuest is required", 400);
  //     }

  //     if (registrationEnabled === undefined) {
  //       return sendError(res, "registrationEnabled is required", 400);
  //     }

  //     if (!mongoose.Types.ObjectId.isValid(eventId)) {
  //       return sendError(res, "Invalid eventId", 400);
  //     }

  //     if (roomId && !mongoose.Types.ObjectId.isValid(roomId)) {
  //       return sendError(res, "Invalid roomId", 400);
  //     }

  //     if (!payment || typeof payment !== "object") {
  //       return sendError(res, "payment is required", 400);
  //     }

  //     const {
  //       razorpay_order_id: razorpayOrderId,
  //       razorpay_payment_id: razorpayPaymentId,
  //       razorpay_signature: razorpaySignature,
  //       totalAmount,
  //       paidToCotrav,
  //       gatewayCharges,
  //     } = payment;

  //     if (
  //       !razorpayOrderId ||
  //       !razorpayPaymentId ||
  //       !razorpaySignature ||
  //       totalAmount === undefined ||
  //       paidToCotrav === undefined ||
  //       gatewayCharges === undefined
  //     ) {
  //       return sendError(
  //         res,
  //         "payment.razorpay_order_id, payment.razorpay_payment_id, payment.razorpay_signature, payment.totalAmount, payment.paidToCotrav, and payment.gatewayCharges are required",
  //         400,
  //       );
  //     }

  //     if (
  //       !verifyRazorpaySignature({
  //         razorpayOrderId,
  //         razorpayPaymentId,
  //         razorpaySignature,
  //       })
  //     ) {
  //       return sendError(res, "Invalid payment signature", 400);
  //     }

  //     const { firstName, lastName, email, phone, company, gst } = primaryGuest;

  //     if (!firstName || !lastName || !email || !phone || !company) {
  //       return sendError(
  //         res,
  //         "primaryGuest.firstName, lastName, email, phone, and company are required",
  //         400,
  //       );
  //     }

  //     const orderId = userController.generateOrderId();
  //     const companyDoc = await addRegistrationCompany({
  //       company,
  //       gst,
  //       orderId,
  //     });

  //     if (!companyDoc?._id) {
  //       return sendError(res, "Unable to create company record", 500);
  //     }

  //     const paymentDoc = await new_Payments.create({
  //       orderId,
  //       razorpayOrderId,
  //       razorpayPaymentId,
  //       razorpaySignature,
  //       totalAmount: Number(totalAmount),
  //       paidToCotrav: Number(paidToCotrav),
  //       gatewayCharges: Number(gatewayCharges),
  //       paymentFor: "registration",
  //     });

  //     const registration = await new_Registration.create({
  //       orderId,
  //       eventId,
  //       roomId: roomId || null,
  //       paymentIds: [paymentDoc._id],
  //       registrationEnabled: Boolean(registrationEnabled),
  //       primaryGuest: {
  //         firstName: String(firstName).trim(),
  //         lastName: String(lastName).trim(),
  //         email: String(email).toLowerCase().trim(),
  //         phone: String(phone).trim(),
  //         gst: String(gst || "").trim(),
  //         company: companyDoc._id,
  //       },
  //       emmaReg: emmaReg?.memberType
  //         ? { memberType: emmaReg.memberType }
  //         : undefined,
  //     });

  //     return sendSuccess(
  //       res,
  //       "Registration and payment recorded successfully",
  //       {
  //         orderId: registration.orderId,
  //         payment: paymentDoc,
  //         registration,
  //       },
  //       201,
  //     );
  //   } catch (error) {
  //     return sendError(res, error.message, 500);
  //   }
  // }

  static async createRegistration(req, res) {
    try {
      const body = req.body || {};
      const {
        eventId,
        bookingType,
        primaryGuest,
        payment,
        roomType,
        checkIn,
        checkOut,
        memberType,
        attendees,
      } = body;

      if (!eventId) {
        return sendError(res, "eventId is required", 400);
      }

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return sendError(res, "Invalid eventId", 400);
      }

      if (!bookingType) {
        return sendError(
          res,
          'bookingType is required and must be either "registration_only" or "registration_with_room"',
          400,
        );
      }

      if (
        ![BOOKING_TYPES.REG_ONLY, BOOKING_TYPES.REG_ROOM].includes(bookingType)
      ) {
        return sendError(
          res,
          'Invalid bookingType. Use "registration_only" or "registration_with_room"',
          400,
        );
      }

      if (!primaryGuest || typeof primaryGuest !== "object") {
        return sendError(res, "primaryGuest is required", 400);
      }

      if (!payment || typeof payment !== "object") {
        return sendError(res, "payment is required", 400);
      }

      const {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        totalAmount,
        paidToCotrav,
        gatewayCharges,
      } = payment;

      if (
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature ||
        totalAmount === undefined ||
        paidToCotrav === undefined ||
        gatewayCharges === undefined
      ) {
        return sendError(
          res,
          "payment.razorpay_order_id, payment.razorpay_payment_id, payment.razorpay_signature, payment.totalAmount, payment.paidToCotrav, and payment.gatewayCharges are required",
          400,
        );
      }

      const event = await new_EventConfig.findById(eventId);

      if (!event) {
        return sendError(res, "Event not found", 404);
      }

      if (!event.guestsRegistrationEnabled) {
        return sendError(
          res,
          "Registration is currently disabled for this event",
          403,
        );
      }

      const normalizedMemberType = getMemberType(memberType);
      if (!normalizedMemberType) {
        return sendError(res, "memberType must be member or non-member", 400);
      }

      const firstName = normalizeText(primaryGuest.firstName);
      const lastName = normalizeText(primaryGuest.lastName);
      const email = normalizeEmail(primaryGuest.email);
      const phone = normalizePhone(primaryGuest.phone);
      const company = normalizeText(primaryGuest.company);
      const gst = normalizeText(primaryGuest.gst || "");

      if (!firstName || !lastName || !email || !phone || !company) {
        return sendError(
          res,
          "primaryGuest.firstName, lastName, email, phone, and company are required",
          400,
        );
      }

      if (bookingType === BOOKING_TYPES.REG_ONLY) {
        if (
          roomType ||
          checkIn ||
          checkOut ||
          (Array.isArray(attendees) && attendees.length > 0)
        ) {
          return sendError(
            res,
            "roomType, checkIn, checkOut, and attendees are not allowed for registration_only",
            400,
          );
        }
      }

      let normalizedRoomType = null;
      let roomAttendees = [];

      if (bookingType === BOOKING_TYPES.REG_ROOM) {
        if (!roomType || !checkIn || !checkOut) {
          return sendError(
            res,
            "roomType, checkIn, and checkOut are required for registration_with_room",
            400,
          );
        }

        normalizedRoomType = getRoomTypeKey(roomType);

        if (!normalizedRoomType) {
          return sendError(
            res,
            "Invalid roomType. Use single, double, or triple",
            400,
          );
        }

        if (!isRoomEnabled(event, normalizedRoomType)) {
          return sendError(
            res,
            "Selected room type is disabled for this event",
            403,
          );
        }

        try {
          const mapped = validateAndMapRoomAttendees({
            roomType: normalizedRoomType,
            primaryGuest: { firstName, lastName, email, phone, gst },
            attendees: attendees || [],
          });

          normalizedRoomType = mapped.normalizedRoomType;
          roomAttendees = mapped.mappedAttendees;
        } catch (roomValidationError) {
          return sendError(res, roomValidationError.message, 400);
        }
      }

      const pricing = calculatePricing(
        event,
        normalizedMemberType,
        bookingType,
        normalizedRoomType,
      );

      if (Number(totalAmount) !== pricing.totalAmount) {
        return sendError(
          res,
          `payment.totalAmount must be ${pricing.totalAmount} based on event pricing`,
          400,
        );
      }

      if (
        !verifyRazorpaySignature({
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        })
      ) {
        return sendError(res, "Invalid payment signature", 400);
      }

      const orderId = userController.generateOrderId();

      const companyDoc = await addRegistrationCompany({
        company,
        gst,
        orderId,
      });

      if (!companyDoc?._id) {
        return sendError(res, "Unable to create company record", 500);
      }

      let roomDoc = null;
      let attendeeDocs = [];

      if (bookingType === BOOKING_TYPES.REG_ROOM) {
        const roomCheckIn = new Date(checkIn);
        const roomCheckOut = new Date(checkOut);

        if (
          Number.isNaN(roomCheckIn.getTime()) ||
          Number.isNaN(roomCheckOut.getTime())
        ) {
          return sendError(
            res,
            "checkIn and checkOut must be valid dates",
            400,
          );
        }

        const primaryAttendeeDoc = {
          firstName,
          lastName,
          email,
          phone,
          gst,
          isprimaryGuest: true,
          primaryGuestEmail: email,
          company: companyDoc._id,
          orderId,
        };

        const roomAttendeeDocsToCreate = [
          primaryAttendeeDoc,
          ...roomAttendees.map((attendee) => ({
            firstName: attendee.firstName,
            lastName: attendee.lastName,
            email: attendee.email,
            phone: attendee.phone,
            gst: attendee.gst,
            isprimaryGuest: false,
            primaryGuestEmail: email,
            company: companyDoc._id,
            orderId,
          })),
        ];

        attendeeDocs = await new_Attendees.insertMany(roomAttendeeDocsToCreate);

        roomDoc = await new_Room.create({
          roomType: normalizedRoomType,
          checkIn: roomCheckIn,
          checkOut: roomCheckOut,
          attendees: attendeeDocs.map((doc) => doc._id),
          orderId,
        });
      }

      const paymentDoc = await new_Payments.create({
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        totalAmount: Number(totalAmount),
        paidToCotrav: Number(paidToCotrav),
        gatewayCharges: Number(gatewayCharges),
        paymentFor:
          bookingType === BOOKING_TYPES.REG_ROOM ? "both" : "registration",
      });

      const registration = await new_Registration.create({
        orderId,
        eventId,
        roomId: roomDoc?._id || null,
        paymentIds: [paymentDoc._id],
        registrationEnabled: Boolean(event.guestsRegistrationEnabled),
        primaryGuest: {
          firstName,
          lastName,
          email,
          phone,
          gst,
          company: companyDoc._id,
        },
        emmaReg: {
          memberType: normalizedMemberType,
        },
      });

      return sendSuccess(
        res,
        "Registration and payment recorded successfully",
        {
          orderId: registration.orderId,
          payment: paymentDoc,
          registration,
          room: roomDoc,
          attendees: attendeeDocs,
          pricing,
        },
        201,
      );
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  static async getRegistrationByOrderId(req, res) {
    try {
      const orderId = req.query.orderId || req.params.orderId;

      if (!orderId) {
        return sendError(res, "orderId is required", 400);
      }

      const registration = await new_Registration
        .findOne({
          orderId: String(orderId).trim(),
        })
        .populate("primaryGuest.company");

      if (!registration) {
        return sendError(res, "Registration not found", 404);
      }

      return sendSuccess(
        res,
        "Registration fetched successfully",
        registration,
      );
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }
}

export default userController;
