import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

import Admin from "../../../models/v2/admin/admin.model.js";
import EventConfig from "../../../models/v2/admin/event.model.js";
import { sendSuccess, sendError } from "../../../utils/responseHandler.js";

const uploadDir = path.join(process.cwd(), "src", "uploads", "events");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const toBool = (value) => value === true || value === "true";

const toNum = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const saveFile = async (file, eventName) => {
  if (!file) return null;

  const safeEventName = (eventName || "event")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "");

  const safeName = file.name.replace(/\s+/g, "-");
  const fileName = `${safeEventName}-${Date.now()}-${safeName}`;
  const filePath = path.join(uploadDir, fileName);

  await file.mv(filePath);

  return `events/${fileName}`;
};

class admin {
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, "Email and password are required", 400);
      }

      const adminUser = await Admin.findOne({ email }).select("+password");

      if (!adminUser) {
        return sendError(res, "Invalid credentials", 401);
      }

      if (!adminUser.password) {
        return sendError(res, "Password not set for this account", 400);
      }

      const isMatch = await bcrypt.compare(password, adminUser.password);

      if (!isMatch) {
        return sendError(res, "Invalid credentials", 401);
      }

      const token = jwt.sign(
        {
          id: adminUser._id,
          email: adminUser.email,
          adminType: adminUser.adminType,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      const adminObj = adminUser.toObject();
      delete adminObj.password;

      const user = {
        id: adminObj._id,
        firstName: adminObj.firstName,
        lastName: adminObj.lastName,
        fullName: `${adminObj.firstName} ${adminObj.lastName}`.trim(),
        phone: adminObj.phone,
        email: adminObj.email,
        adminType: adminObj.adminType,
      };

      return sendSuccess(res, "Login successful", {
        token,
        user,
      });
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  static async createEvent(req, res) {
    try {
      const body = req.body || {};
      const files = req.files || {};

      const eventName = body.eventName || "event";

      const headerBanner = await saveFile(files.headerBanner, eventName);
      const voucherHeaderImage = await saveFile(
        files.voucherHeaderImage,
        eventName,
      );

      const eventData = {
        eventName,
        termsEventName: body.termsEventName || "",
        guestsRegistrationEnabled: toBool(body.guestsRegistrationEnabled),
        memberPrice: toNum(body.memberPrice),
        nonMemberPrice: toNum(body.nonMemberPrice),

        roomPricingExcludingGst: toBool(body.roomPricingExcludingGst),
        gstPercentage: toNum(body.gstPercentage),

        singleSharingRoomEnabled: toBool(body.singleSharingRoomEnabled),
        singleSharingPrice: toNum(body.singleSharingPrice),

        doubleSharingRoomEnabled: toBool(body.doubleSharingRoomEnabled),
        doubleSharingPrice: toNum(body.doubleSharingPrice),

        tripleSharingRoomEnabled: toBool(body.tripleSharingRoomEnabled),
        tripleSharingPrice: toNum(body.tripleSharingPrice),

        resortName: body.resortName || "",
        resortAddress: body.resortAddress || "",
        hotelSupportContact: body.hotelSupportContact || "",
        hotelSupportEmail: body.hotelSupportEmail || "",
        googleLocation: body.googleLocation || "",
        standardCheckIn: body.standardCheckIn || "",
        standardCheckOut: body.standardCheckOut || "",
        cotravSupportContact: body.cotravSupportContact || "",
        cotravSupportEmail: body.cotravSupportEmail || "",

        headerBanner,
        voucherHeaderImage,
      };

      const createdEvent = await EventConfig.create(eventData);

      return sendSuccess(res, "Event created successfully", createdEvent);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  static async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};
      const files = req.files || {};

      const existingEvent = await EventConfig.findById(id);
      if (!existingEvent) {
        return sendError(res, "Event not found", 404);
      }

      const eventName = body.eventName || existingEvent.eventName || "event";

      const headerBanner = files.headerBanner
        ? await saveFile(files.headerBanner, eventName)
        : existingEvent.headerBanner;

      const voucherHeaderImage = files.voucherHeaderImage
        ? await saveFile(files.voucherHeaderImage, eventName)
        : existingEvent.voucherHeaderImage;

      const updatedData = {
        eventName:
          body.eventName !== undefined
            ? body.eventName
            : existingEvent.eventName,
        termsEventName:
          body.termsEventName !== undefined
            ? body.termsEventName
            : existingEvent.termsEventName,

        guestsRegistrationEnabled:
          body.guestsRegistrationEnabled !== undefined
            ? toBool(body.guestsRegistrationEnabled)
            : existingEvent.guestsRegistrationEnabled,
        memberPrice:
          body.memberPrice !== undefined
            ? toNum(body.memberPrice)
            : existingEvent.memberPrice,
        nonMemberPrice:
          body.nonMemberPrice !== undefined
            ? toNum(body.nonMemberPrice)
            : existingEvent.nonMemberPrice,

        roomPricingExcludingGst:
          body.roomPricingExcludingGst !== undefined
            ? toBool(body.roomPricingExcludingGst)
            : existingEvent.roomPricingExcludingGst,
        gstPercentage:
          body.gstPercentage !== undefined
            ? toNum(body.gstPercentage)
            : existingEvent.gstPercentage,

        singleSharingRoomEnabled:
          body.singleSharingRoomEnabled !== undefined
            ? toBool(body.singleSharingRoomEnabled)
            : existingEvent.singleSharingRoomEnabled,
        singleSharingPrice:
          body.singleSharingPrice !== undefined
            ? toNum(body.singleSharingPrice)
            : existingEvent.singleSharingPrice,

        doubleSharingRoomEnabled:
          body.doubleSharingRoomEnabled !== undefined
            ? toBool(body.doubleSharingRoomEnabled)
            : existingEvent.doubleSharingRoomEnabled,
        doubleSharingPrice:
          body.doubleSharingPrice !== undefined
            ? toNum(body.doubleSharingPrice)
            : existingEvent.doubleSharingPrice,

        tripleSharingRoomEnabled:
          body.tripleSharingRoomEnabled !== undefined
            ? toBool(body.tripleSharingRoomEnabled)
            : existingEvent.tripleSharingRoomEnabled,
        tripleSharingPrice:
          body.tripleSharingPrice !== undefined
            ? toNum(body.tripleSharingPrice)
            : existingEvent.tripleSharingPrice,

        resortName:
          body.resortName !== undefined
            ? body.resortName
            : existingEvent.resortName,
        resortAddress:
          body.resortAddress !== undefined
            ? body.resortAddress
            : existingEvent.resortAddress,
        hotelSupportContact:
          body.hotelSupportContact !== undefined
            ? body.hotelSupportContact
            : existingEvent.hotelSupportContact,
        hotelSupportEmail:
          body.hotelSupportEmail !== undefined
            ? body.hotelSupportEmail
            : existingEvent.hotelSupportEmail,
        googleLocation:
          body.googleLocation !== undefined
            ? body.googleLocation
            : existingEvent.googleLocation,
        standardCheckIn:
          body.standardCheckIn !== undefined
            ? body.standardCheckIn
            : existingEvent.standardCheckIn,
        standardCheckOut:
          body.standardCheckOut !== undefined
            ? body.standardCheckOut
            : existingEvent.standardCheckOut,
        cotravSupportContact:
          body.cotravSupportContact !== undefined
            ? body.cotravSupportContact
            : existingEvent.cotravSupportContact,
        cotravSupportEmail:
          body.cotravSupportEmail !== undefined
            ? body.cotravSupportEmail
            : existingEvent.cotravSupportEmail,

        headerBanner,
        voucherHeaderImage,
      };

      const updatedEvent = await EventConfig.findByIdAndUpdate(
        id,
        updatedData,
        {
          new: true,
        },
      );

      return sendSuccess(res, "Event updated successfully", updatedEvent);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  static async getEvents(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        EventConfig.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        EventConfig.countDocuments(),
      ]);

      return sendSuccess(res, "Events fetched successfully", {
        events,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }

  static async createAdmin(req, res) {
    try {
      const { firstName, lastName, phone, email, password, adminType } =
        req.body;

      if (
        !firstName ||
        !lastName ||
        !phone ||
        !email ||
        !password ||
        !adminType
      ) {
        return sendError(res, "All fields are required", 400);
      }

      const existingAdmin = await Admin.findOne({
        $or: [{ email }, { phone }],
      });

      if (existingAdmin) {
        return sendError(res, "Admin already exists", 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const createdAdmin = await Admin.create({
        firstName,
        lastName,
        phone,
        email,
        password: hashedPassword,
        adminType,
      });

      const adminObj = createdAdmin.toObject();
      delete adminObj.password;

      return sendSuccess(res, "Admin created successfully", adminObj);
    } catch (error) {
      return sendError(res, error.message, 500);
    }
  }
}

export default admin;

// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import path from "path";
// import fs from "fs";

// import Admin from "../../../models/v2/admin/admin.model.js";
// import EventConfig from "../../../models/v2/admin/event.model.js";
// import { sendSuccess, sendError } from "../../../utils/responseHandler.js";

// const uploadDir = path.join(process.cwd(), "src", "uploads");

// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const toBool = (value) => value === true || value === "true";

// const toNum = (value) => {
//   if (value === undefined || value === null || value === "") return null;
//   const n = Number(value);
//   return Number.isNaN(n) ? null : n;
// };

// const saveFile = async (file, prefix) => {
//   if (!file) return null;

//   const safeName = file.name.replace(/\s+/g, "-");
//   const fileName = `${prefix}-${Date.now()}-${safeName}`;
//   const filePath = path.join(uploadDir, fileName);

//   await file.mv(filePath);
//   return fileName;
// };

// class admin {
//   static async login(req, res) {
//     try {
//       const { email, password } = req.body;

//       const adminUser = await Admin.findOne({ email }).select("+password");

//       if (!adminUser) {
//         return sendError(res, "Invalid credentials", 401);
//       }

//       if (!adminUser.password) {
//         return sendError(res, "Password not set for this account", 400);
//       }

//       const isMatch = await bcrypt.compare(password, adminUser.password);

//       if (!isMatch) {
//         return sendError(res, "Invalid credentials", 401);
//       }

//       const token = jwt.sign(
//         {
//           id: adminUser._id,
//           email: adminUser.email,
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: "1d" },
//       );

//       const adminObj = adminUser.toObject();
//       delete adminObj.password;

//       return sendSuccess(res, "Login successful", {
//         token,
//         user: adminObj,
//       });
//     } catch (error) {
//       return sendError(res, error.message, 500);
//     }
//   }

//   static async createEvent(req, res) {
//     try {
//       const body = req.body || {};
//       const files = req.files || {};

//       const headerBanner = await saveFile(files.headerBanner, "headerBanner");
//       const voucherHeaderImage = await saveFile(
//         files.voucherHeaderImage,
//         "voucherHeaderImage",
//       );

//       const eventData = {
//         eventName: body.eventName || "",
//         guestsRegistrationEnabled: toBool(body.guestsRegistrationEnabled),
//         memberPrice: toNum(body.memberPrice),
//         nonMemberPrice: toNum(body.nonMemberPrice),

//         roomPricingExcludingGst: toBool(body.roomPricingExcludingGst),
//         gstPercentage: toNum(body.gstPercentage),

//         singleSharingRoomEnabled: toBool(body.singleSharingRoomEnabled),
//         singleSharingPrice: toNum(body.singleSharingPrice),

//         doubleSharingRoomEnabled: toBool(body.doubleSharingRoomEnabled),
//         doubleSharingPrice: toNum(body.doubleSharingPrice),

//         tripleSharingRoomEnabled: toBool(body.tripleSharingRoomEnabled),
//         tripleSharingPrice: toNum(body.tripleSharingPrice),

//         resortName: body.resortName || "",
//         resortAddress: body.resortAddress || "",
//         hotelSupportContact: body.hotelSupportContact || "",
//         hotelSupportEmail: body.hotelSupportEmail || "",
//         googleLocation: body.googleLocation || "",
//         standardCheckIn: body.standardCheckIn || "",
//         standardCheckOut: body.standardCheckOut || "",
//         termsEventName: body.termsEventName || "",
//         cotravSupportContact: body.cotravSupportContact || "",
//         cotravSupportEmail: body.cotravSupportEmail || "",

//         headerBanner,
//         voucherHeaderImage,
//       };

//       const createdEvent = await EventConfig.create(eventData);

//       return sendSuccess(res, "Event created successfully", createdEvent);
//     } catch (error) {
//       return sendError(res, error.message, 500);
//     }
//   }

//   static async updateEvent(req, res) {
//     try {
//       const { id } = req.params;
//       const body = req.body || {};
//       const files = req.files || {};

//       const existingEvent = await EventConfig.findById(id);
//       if (!existingEvent) {
//         return sendError(res, "Event not found", 404);
//       }

//       const headerBanner = files.headerBanner
//         ? await saveFile(files.headerBanner, "headerBanner")
//         : existingEvent.headerBanner;

//       const voucherHeaderImage = files.voucherHeaderImage
//         ? await saveFile(files.voucherHeaderImage, "voucherHeaderImage")
//         : existingEvent.voucherHeaderImage;

//       const updatedData = {
//         eventName:
//           body.eventName !== undefined
//             ? body.eventName
//             : existingEvent.eventName,
//         guestsRegistrationEnabled:
//           body.guestsRegistrationEnabled !== undefined
//             ? toBool(body.guestsRegistrationEnabled)
//             : existingEvent.guestsRegistrationEnabled,
//         memberPrice:
//           body.memberPrice !== undefined
//             ? toNum(body.memberPrice)
//             : existingEvent.memberPrice,
//         nonMemberPrice:
//           body.nonMemberPrice !== undefined
//             ? toNum(body.nonMemberPrice)
//             : existingEvent.nonMemberPrice,

//         roomPricingExcludingGst:
//           body.roomPricingExcludingGst !== undefined
//             ? toBool(body.roomPricingExcludingGst)
//             : existingEvent.roomPricingExcludingGst,
//         gstPercentage:
//           body.gstPercentage !== undefined
//             ? toNum(body.gstPercentage)
//             : existingEvent.gstPercentage,

//         singleSharingRoomEnabled:
//           body.singleSharingRoomEnabled !== undefined
//             ? toBool(body.singleSharingRoomEnabled)
//             : existingEvent.singleSharingRoomEnabled,
//         singleSharingPrice:
//           body.singleSharingPrice !== undefined
//             ? toNum(body.singleSharingPrice)
//             : existingEvent.singleSharingPrice,

//         doubleSharingRoomEnabled:
//           body.doubleSharingRoomEnabled !== undefined
//             ? toBool(body.doubleSharingRoomEnabled)
//             : existingEvent.doubleSharingRoomEnabled,
//         doubleSharingPrice:
//           body.doubleSharingPrice !== undefined
//             ? toNum(body.doubleSharingPrice)
//             : existingEvent.doubleSharingPrice,

//         tripleSharingRoomEnabled:
//           body.tripleSharingRoomEnabled !== undefined
//             ? toBool(body.tripleSharingRoomEnabled)
//             : existingEvent.tripleSharingRoomEnabled,
//         tripleSharingPrice:
//           body.tripleSharingPrice !== undefined
//             ? toNum(body.tripleSharingPrice)
//             : existingEvent.tripleSharingPrice,

//         resortName:
//           body.resortName !== undefined
//             ? body.resortName
//             : existingEvent.resortName,
//         resortAddress:
//           body.resortAddress !== undefined
//             ? body.resortAddress
//             : existingEvent.resortAddress,
//         hotelSupportContact:
//           body.hotelSupportContact !== undefined
//             ? body.hotelSupportContact
//             : existingEvent.hotelSupportContact,
//         hotelSupportEmail:
//           body.hotelSupportEmail !== undefined
//             ? body.hotelSupportEmail
//             : existingEvent.hotelSupportEmail,
//         googleLocation:
//           body.googleLocation !== undefined
//             ? body.googleLocation
//             : existingEvent.googleLocation,
//         standardCheckIn:
//           body.standardCheckIn !== undefined
//             ? body.standardCheckIn
//             : existingEvent.standardCheckIn,
//         standardCheckOut:
//           body.standardCheckOut !== undefined
//             ? body.standardCheckOut
//             : existingEvent.standardCheckOut,
//         termsEventName:
//           body.termsEventName !== undefined
//             ? body.termsEventName
//             : existingEvent.termsEventName,
//         cotravSupportContact:
//           body.cotravSupportContact !== undefined
//             ? body.cotravSupportContact
//             : existingEvent.cotravSupportContact,
//         cotravSupportEmail:
//           body.cotravSupportEmail !== undefined
//             ? body.cotravSupportEmail
//             : existingEvent.cotravSupportEmail,

//         headerBanner,
//         voucherHeaderImage,
//       };

//       const updatedEvent = await EventConfig.findByIdAndUpdate(
//         id,
//         updatedData,
//         {
//           new: true,
//         },
//       );

//       return sendSuccess(res, "Event updated successfully", updatedEvent);
//     } catch (error) {
//       return sendError(res, error.message, 500);
//     }
//   }
// }

// export default admin;

// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
// import Admin from '../../../models/v2/admin/admin.model.js';
// import { sendSuccess, sendError } from '../../../utils/responseHandler.js';

// class admin {
//   static async login(req, res) {
//     try {
//       const { email, password } = req.body;

//       const adminUser = await Admin.findOne({ email }).select('+password');
//       // console.log(adminUser);

//       if (!adminUser) {
//         return sendError(res, 'Invalid credentials', 401);
//       }

//       if (!adminUser.password) {
//         return sendError(res, 'Password not set for this account', 400);
//       }

//       const isMatch = await bcrypt.compare(password, adminUser.password);

//       if (!isMatch) {
//         return sendError(res, 'Invalid credentials', 401);
//       }

//       const token = jwt.sign(
//         {
//           id: adminUser._id,
//           email: adminUser.email
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: '1d' }
//       );

//       const adminObj = adminUser.toObject();
//       delete adminObj.password;

//       return sendSuccess(res, 'Login successful', {
//         token,
//         user: adminObj
//       });
//     } catch (error) {
//       return sendError(res, error.message, 500);
//     }
//   }
// }

// export default admin;

// import bcrypt from "bcrypt";
// // import Admin from '../models/admin.model.js';
// import jwt from "jsonwebtoken";
// // import { sendSuccess, sendError } from '../utils/responseHandler.js';
// import crypto from "crypto";

// class admin {
//   static async login() {
//     return "hello";
//   }
// }
// export default admin;

// // const generatePassword = () => {
// //     return crypto.randomBytes(8).toString('hex');
// // };

// // export const createAdmin = async (req, res) => {
// //     const { name, phone, email, internal } = req.body;
// //     try {

// //         // check existing
// //         const exists = await Admin.findOne({
// //             $or: [{ email }, { phone }, { name }]
// //         });

// //         if (exists) {
// //             if (internal)
// //                 return 'Admin already exists';

// //             return sendError(res, 'Admin already exists');
// //         }

// //         // generate password
// //         const plainPassword = generatePassword();

// //         // hash password
// //         const hashedPassword = await bcrypt.hash(plainPassword, 10);

// //         const admin = await Admin.create({
// //             name,
// //             phone,
// //             email,
// //             password: hashedPassword
// //         });

// //         // send mail with password
// //         loginMail(name, email, plainPassword)

// //         const adminObj = admin.toObject();
// //         delete adminObj.password;

// //         if (internal)
// //             return 'Admin created and password sent on email';

// //         return sendSuccess(res, 'Admin created and password sent on email', adminObj);

// //     } catch (error) {
// //         if (internal)
// //             return 'Internal Server Error';

// //         return sendError(res, error.message);
// //     }
// // };

// // export const login = async (req, res) => {
// //     try {
// //         const { email, password } = req.body;

// //         if (!email || !password) {
// //             return sendError(res, 'Email and password are required');
// //         }

// //         const admin = await Admin.findOne({ email }).select('+password');

// //         if (!admin) {
// //             if (
// //                 email == "madan.ghodechor@cotrav.co" ||
// //                 email == "basant.bhagat@cotrav.co"
// //             ) {
// //                 const da = {
// //                     "req": {
// //                         "body": {
// //                             "name": "Madan Ghodechor",
// //                             "email": "madan.ghodechor@cotrav.co",
// //                             "phone": "9309804106",
// //                             "password": "",
// //                             "internal": true
// //                         }
// //                     }
// //                 }
// //                 createAdmin(da.req)
// //             }

// //             return sendError(res, 'Invalid credentials');
// //         }

// //         if (!admin.password) {
// //             return sendError(res, 'Password not set for this account');
// //         }

// //         const isMatch = await bcrypt.compare(password, admin.password);

// //         if (!isMatch) {
// //             return sendError(res, 'Invalid credentials');
// //         }

// //         // create JWT
// //         const token = jwt.sign(
// //             {
// //                 id: admin._id,
// //                 email: admin.email
// //             },
// //             process.env.JWT_SECRET,
// //             { expiresIn: '1d' }
// //         );

// //         // remove password before sending
// //         const adminObj = admin.toObject();
// //         delete adminObj.password;

// //         return sendSuccess(res, 'Login successful', {
// //             token,
// //             user: adminObj
// //         });

// //     } catch (error) {
// //         console.log(error)
// //         return sendError(res, error.message);
// //     }
// // };
