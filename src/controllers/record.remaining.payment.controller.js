import jwt from 'jsonwebtoken';
import { sendError, sendSuccess } from '../utils/responseHandler.js';
import PaymentRecords from '../models/Payment.model.js';
import Room from '../models/Room.model.js';
import User from '../models/User.model.js';
import Company from '../models/Company.model.js';
import { sendMail } from '../services/mailer.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'MadanIsSecreate';

const allowedTokenTypes = new Set(['remaining-payment', 'booking-extension-payment']);

const resolveCompanyId = async (guest, bulkRefId) => {
  if (!guest?.organisation) {
    return null;
  }

  let company = await Company.findOne({ name: guest.organisation });

  if (!company) {
    company = await Company.create({
      name: guest.organisation,
      gst: guest.gst || '',
      address: guest.city || '',
      bulkRefId
    });
  }

  return company._id;
};

const findOrCreateAttendee = async (guest, bulkRefId) => {
  let user = await User.findOne({ email: guest.email });

  if (!user) {
    const companyId = await resolveCompanyId(guest, bulkRefId);
    user = await User.create({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      gst: guest.gst || '',
      is_primary_user: !!guest.is_primary_user,
      primary_user_email: guest.primary_user_email || '',
      company: companyId,
      bulkRefId
    });
  }

  return user._id;
};

const extractExtraGuests = (reqBody, tokenData) => {
  if (Array.isArray(reqBody.extraGuests) && reqBody.extraGuests.length > 0) {
    return reqBody.extraGuests;
  }

  if (Array.isArray(tokenData.extraGuests) && tokenData.extraGuests.length > 0) {
    return tokenData.extraGuests;
  }

  return [];
};

const findPrimaryUser = (userData) => {
  let primaryUser = '';
  const secondaryUsers = [];
  let primaryUserWhatsapp;
  let guestName;

  for (const room of userData) {
    for (const user of room.attendees || []) {
      if (user.is_primary_user) {
        primaryUser = user.email;
        primaryUserWhatsapp = user.phone;
        guestName = user.firstName;
      } else if (user.email) {
        secondaryUsers.push(user.email);
      }
    }
  }

  return {
    primaryUser,
    secondaryUsers,
    guestName,
    primaryUserWhatsapp
  };
};

const buildUserDataForMail = (reqBody, tokenData, nextRoomType, nextCheckIn, nextCheckOut, extraGuests = []) => {
  if (Array.isArray(reqBody.userData) && reqBody.userData.length > 0) {
    return reqBody.userData;
  }

  if (Array.isArray(tokenData.userData) && tokenData.userData.length > 0) {
    return tokenData.userData;
  }

  const attendees = [
    ...(Array.isArray(tokenData.attendees) ? tokenData.attendees : []),
    ...extraGuests
  ];

  return [
    {
      roomId: tokenData.roomId,
      roomtype: nextRoomType,
      checkIn: nextCheckIn,
      checkOut: nextCheckOut,
      attendees: attendees.map((guest) => ({
        id: guest.id || guest._id || null,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        organisation: guest.organisation || '',
        phone: guest.phone,
        gst: guest.gst || '',
        is_primary_user: !!guest.is_primary_user,
        primary_user_email: guest.primary_user_email || ''
      }))
    }
  ];
};

export const recordRemainingPaymentController = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      token,
      amount
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !token || !amount) {
      return sendError(res, 'Invalid payload', 400);
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return sendError(res, 'Invalid or expired token', 401);
    }

    if (!allowedTokenTypes.has(decodedToken?.type) || !decodedToken?.data) {
      return sendError(res, 'Invalid payment token type', 400);
    }

    const tokenData = decodedToken.data;
    const bookingId = tokenData.bookingId;
    const bulkRefId = tokenData.bulkRefId;
    const roomId = tokenData.roomId;
    const extension = tokenData.extension || {};

    if (!bookingId || !bulkRefId || !roomId) {
      return sendError(res, 'Token is missing booking reference data', 400);
    }

    const room = await Room.findOne({
      _id: bookingId,
      bulkRefId,
      roomId
    });

    if (!room) {
      return sendError(res, 'Room booking not found', 404);
    }

    const paymentRecord = await PaymentRecords.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentAmount: amount
    });

    const extraGuests = extractExtraGuests(req.body, tokenData);
    const extraGuestIds = [];

    for (const guest of extraGuests) {
      if (!guest?.email || !guest?.firstName) {
        continue;
      }

      const guestId = await findOrCreateAttendee(guest, bulkRefId);
      extraGuestIds.push(String(guestId));
    }

    const existingAttendeeIds = Array.isArray(room.attendees)
      ? room.attendees.map((id) => String(id))
      : [];

    const mergedAttendeeIds = Array.from(new Set([
      ...existingAttendeeIds,
      ...extraGuestIds
    ]));

    const nextRoomType = extension.roomType || room.roomType;
    const nextCheckIn = extension.checkIn ? new Date(extension.checkIn) : room.checkIn;
    const nextCheckOut = extension.checkOut ? new Date(extension.checkOut) : room.checkOut;

    await Room.updateOne(
      { _id: room._id },
      {
        $set: {
          payment: 1,
          paymentId: paymentRecord._id,
          roomType: nextRoomType,
          checkIn: nextCheckIn,
          checkOut: nextCheckOut,
          attendees: mergedAttendeeIds
        },
        $addToSet: {
          paymentIds: paymentRecord._id
        }
      }
    );

    const userData = buildUserDataForMail(
      req.body,
      tokenData,
      nextRoomType,
      nextCheckIn,
      nextCheckOut,
      extraGuests
    );

    const mails = findPrimaryUser(userData);
    sendMail(
      mails,
      {
        bulkRefId,
        razorpay_payment_id,
        razorpay_order_id,
        userData
      },
      amount,
      'success',
      room.createdAt
    );

    return sendSuccess(res, 'Remaining payment recorded successfully', {
      payment: paymentRecord,
      booking: {
        bookingId,
        bulkRefId,
        roomId,
        updatedRoomType: nextRoomType,
        updatedCheckIn: nextCheckIn,
        updatedCheckOut: nextCheckOut,
        attendeeCount: mergedAttendeeIds.length,
        previousPaymentIds: Array.isArray(room.paymentIds) ? room.paymentIds : [],
        currentPaymentId: paymentRecord._id
      }
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 'Failed to record remaining payment', 500, error.message);
  }
};
