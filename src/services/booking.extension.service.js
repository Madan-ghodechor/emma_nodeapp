import jwt from 'jsonwebtoken';
import Room from '../models/Room.model.js';
import User from '../models/User.model.js';
import PaymentRecords from '../models/Payment.model.js';
import ExtensionRequest from '../models/ExtensionRequest.model.js';
import { sendRemainingPaymentMail } from './mailer.service.js';
import {
  ROOM_PRICES,
  ROOM_UPGRADE_RULES
} from '../constants/booking.extension.constants.js';
import { validateExtensionPayload } from '../validators/booking.extension.validator.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDateOnlyUtc = (value) => new Date(`${value}T00:00:00.000Z`);

const formatUtcDate = (value) => {
  const date = new Date(value);
  return date.toISOString().split('T')[0];
};

const calculateNights = (checkIn, checkOut) => {
  const start = parseDateOnlyUtc(checkIn);
  const end = parseDateOnlyUtc(checkOut);
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
};

const createServiceError = (message, statusCode = 400, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

const getUpgradedRoomType = (currentRoomType, requestedRoomType) => {
  const allowedUpgrades = ROOM_UPGRADE_RULES[currentRoomType] || [];

  if (allowedUpgrades.length === 0) {
    throw createServiceError(`No higher room upgrade is available for ${currentRoomType}`, 400);
  }

  if (!requestedRoomType) {
    throw createServiceError('A target room type is required for room upgrade', 400);
  }

  if (requestedRoomType === currentRoomType) {
    throw createServiceError('Please select a higher room type for upgrade', 400);
  }

  if (!allowedUpgrades.includes(requestedRoomType)) {
    throw createServiceError(`Invalid room upgrade from ${currentRoomType} to ${requestedRoomType}`, 400);
  }

  return requestedRoomType;
};

const buildRequestedChanges = (mode, currentBooking, extension) => {
  const nextRoomType = mode === 'room_upgrade' || mode === 'both'
    ? getUpgradedRoomType(currentBooking.roomType, extension.roomType)
    : currentBooking.roomType;

  const nextCheckIn = extension.checkIn || currentBooking.checkIn;
  const nextCheckOut = extension.checkOut || currentBooking.checkOut;

  if (nextCheckOut <= nextCheckIn) {
    throw createServiceError('Updated checkout must be after updated checkin', 400);
  }

  const hasRoomChange = nextRoomType !== currentBooking.roomType;
  const hasDateChange = nextCheckIn !== currentBooking.checkIn || nextCheckOut !== currentBooking.checkOut;

  if ((mode === 'stay_extend' || mode === 'both') && !hasDateChange) {
    throw createServiceError('No stay change detected for the selected extension mode', 400);
  }

  if ((mode === 'room_upgrade' || mode === 'both') && !hasRoomChange) {
    throw createServiceError('No room upgrade change detected for the selected extension mode', 400);
  }

  if (!hasRoomChange && !hasDateChange) {
    throw createServiceError('No booking change detected', 400);
  }

  return {
    passcode: extension.passcode,
    whatToExtend: mode,
    roomType: nextRoomType,
    checkIn: nextCheckIn,
    checkOut: nextCheckOut,
    hasRoomChange,
    hasDateChange
  };
};

const buildPricing = (currentBooking, requestedChanges) => {
  const currentStayNights = calculateNights(currentBooking.checkIn, currentBooking.checkOut);
  const updatedStayNights = calculateNights(requestedChanges.checkIn, requestedChanges.checkOut);

  if (currentStayNights <= 0 || updatedStayNights <= 0) {
    throw createServiceError('Night calculation produced an invalid result', 400);
  }

  const currentNightRate = ROOM_PRICES[currentBooking.roomType];
  const updatedNightRate = ROOM_PRICES[requestedChanges.roomType];

  const currentTotalAmount = currentStayNights * currentNightRate;
  const updatedTotalAmount = updatedStayNights * updatedNightRate;
  const extraPayableAmount = Math.max(0, updatedTotalAmount - currentTotalAmount);

  return {
    currentNightRate,
    updatedNightRate,
    currentStayNights,
    updatedStayNights,
    currentTotalAmount,
    updatedTotalAmount,
    extraPayableAmount
  };
};

const createExtensionPaymentToken = (data) => jwt.sign(
  {
    type: 'booking-extension-payment',
    data
  },
  process.env.JWT_SECRET || 'MadanIsSecreate',
  {
    expiresIn: '7d'
  }
);

const getPrimaryGuest = (attendees) => attendees.find((attendee) => attendee?.is_primary_user) || attendees[0] || null;

export const previewExtensionRequest = async (payload) => {
  const validationErrors = validateExtensionPayload(payload);
  if (validationErrors.length > 0) {
    throw createServiceError('Validation failed', 400, validationErrors);
  }

  const { booking, extension } = payload;

  const room = await Room.findOne({
    bulkRefId: booking.bulkRefId,
    roomId: booking.roomId
  }).lean();

  if (!room) {
    throw createServiceError('Booking not found for the provided bulkRefId and roomId', 404);
  }

  if (booking.roomType && booking.roomType !== room.roomType) {
    throw createServiceError('Provided booking.roomType does not match the current booking record', 409);
  }

  if (booking.checkIn && booking.checkIn !== formatUtcDate(room.checkIn)) {
    throw createServiceError('Provided booking.checkIn does not match the current booking record', 409);
  }

  if (booking.checkOut && booking.checkOut !== formatUtcDate(room.checkOut)) {
    throw createServiceError('Provided booking.checkOut does not match the current booking record', 409);
  }

  if (!room.passcode) {
    throw createServiceError('Booking passcode is not configured', 400);
  }

  if (room.passcode !== extension.passcode) {
    throw createServiceError('Invalid passcode', 401);
  }

  const attendeeIds = Array.isArray(room.attendees) ? room.attendees : [];
  const paymentIds = [
    ...(room.paymentId ? [room.paymentId] : []),
    ...(Array.isArray(room.paymentIds) ? room.paymentIds : [])
  ];

  const [attendees, payments] = await Promise.all([
    User.find({ _id: { $in: attendeeIds } }).lean(),
    PaymentRecords.find({ _id: { $in: paymentIds } }).lean()
  ]);

  const primaryGuest = getPrimaryGuest(attendees);
  if (!primaryGuest?.email) {
    throw createServiceError('Primary attendee email not found for booking', 400);
  }

  const primaryPayment = payments.find((payment) => String(payment._id) === String(room.paymentId))
    || payments[0]
    || null;

  if (booking.paymentId) {
    const storedPaymentId = primaryPayment?._id || room.paymentId || null;
    if (!storedPaymentId || String(storedPaymentId) !== String(booking.paymentId)) {
      throw createServiceError('Provided paymentId does not match the booking record', 409);
    }
  }

  const currentBooking = {
    bookingId: room._id,
    bulkRefId: room.bulkRefId,
    roomId: room.roomId,
    roomType: room.roomType,
    checkIn: formatUtcDate(room.checkIn),
    checkOut: formatUtcDate(room.checkOut),
    paymentId: primaryPayment?._id || room.paymentId || null,
    paymentIds: payments.map((payment) => payment._id),
    attendeeCount: attendees.length,
    primaryGuest: {
      id: primaryGuest._id,
      firstName: primaryGuest.firstName,
      lastName: primaryGuest.lastName,
      email: primaryGuest.email,
      phone: primaryGuest.phone
    }
  };

  const requestedChanges = buildRequestedChanges(extension.whatToExtend, currentBooking, extension);
  const pricing = buildPricing(currentBooking, requestedChanges);
  const paymentContext = {
    bookingId: currentBooking.bookingId,
    bulkRefId: currentBooking.bulkRefId,
    roomId: currentBooking.roomId,
    paymentId: currentBooking.paymentId,
    paymentIds: currentBooking.paymentIds,
    extension: requestedChanges,
    pricing,
    attendees: attendees.map((attendee) => ({
      id: attendee._id,
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      email: attendee.email,
      phone: attendee.phone,
      is_primary_user: attendee.is_primary_user,
      primary_user_email: attendee.primary_user_email
    })),
    attendee: currentBooking.primaryGuest
  };

  return {
    currentBooking,
    requestedChanges,
    pricing,
    paymentContext,
    notification: {
      recipientEmail: currentBooking.primaryGuest.email,
      cc: attendees
        .filter((attendee) => attendee.email && attendee.email !== currentBooking.primaryGuest.email)
        .map((attendee) => attendee.email)
    },
    validation: {
      valid: true,
      message: 'Extension request validated successfully'
    }
  };
};

export const createExtensionRequestAndSendMail = async (payload, meta = {}) => {
  const preview = await previewExtensionRequest(payload);

  const extensionRequest = await ExtensionRequest.create({
    bulkRefId: preview.currentBooking.bulkRefId,
    bookingId: preview.currentBooking.bookingId,
    roomId: preview.currentBooking.roomId,
    mode: preview.requestedChanges.whatToExtend,
    status: 'validated',
    passcodeVerified: true,
    requestedBy: meta,
    currentBooking: preview.currentBooking,
    requestedChanges: preview.requestedChanges,
    pricing: preview.pricing,
    paymentContext: preview.paymentContext
  });

  const paymentToken = createExtensionPaymentToken({
    extensionRequestId: extensionRequest._id,
    ...preview.paymentContext
  });

  const paymentPageUrl = `${process.env.COMPLETEPROCESS || ''}${paymentToken}`;

  const mailInfo = await sendRemainingPaymentMail({
    recipientEmail: preview.notification.recipientEmail,
    cc: preview.notification.cc,
    paymentPageUrl,
    subjectData: {
      guestName: `${preview.currentBooking.primaryGuest.firstName || ''} ${preview.currentBooking.primaryGuest.lastName || ''}`.trim() || preview.currentBooking.primaryGuest.email,
      bulkRefId: preview.currentBooking.bulkRefId,
      roomId: preview.currentBooking.roomId,
      whatToExtend: preview.requestedChanges.whatToExtend,
      currentRoomType: preview.currentBooking.roomType,
      updatedRoomType: preview.requestedChanges.roomType,
      currentCheckIn: preview.currentBooking.checkIn,
      currentCheckOut: preview.currentBooking.checkOut,
      updatedCheckIn: preview.requestedChanges.checkIn,
      updatedCheckOut: preview.requestedChanges.checkOut,
      currentStayNights: preview.pricing.currentStayNights,
      updatedStayNights: preview.pricing.updatedStayNights,
      currentTotalAmount: preview.pricing.currentTotalAmount,
      updatedTotalAmount: preview.pricing.updatedTotalAmount,
      extraPayableAmount: preview.pricing.extraPayableAmount
    }
  });

  extensionRequest.status = 'mail_sent';
  extensionRequest.paymentContext = {
    ...extensionRequest.paymentContext,
    extensionRequestId: extensionRequest._id,
    paymentPageUrl,
    paymentToken
  };
  extensionRequest.email = {
    sentTo: preview.notification.recipientEmail,
    cc: preview.notification.cc,
    messageId: mailInfo?.messageId || null,
    sentAt: new Date()
  };
  await extensionRequest.save();

  return {
    extensionRequestId: extensionRequest._id,
    currentBooking: preview.currentBooking,
    requestedChanges: preview.requestedChanges,
    pricing: preview.pricing,
    payment: {
      status: 'pending',
      paymentPageUrl,
      paymentToken
    },
    notification: {
      sentTo: preview.notification.recipientEmail,
      cc: preview.notification.cc,
      messageId: mailInfo?.messageId || null
    },
    validation: {
      valid: true,
      message: 'Extension payment email sent successfully'
    }
  };
};
