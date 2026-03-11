import {
  EXTENSION_DATE_LIMITS,
  EXTENSION_MODES,
  ROOM_PRICES
} from '../constants/booking.extension.constants.js';

const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const hasValue = (value) => value !== undefined && value !== null && value !== '';

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const parseDateOnlyUtc = (value) => {
  if (!ISO_DATE_ONLY_REGEX.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const inRange = (value, min, max) => value >= min && value <= max;

export const validateExtensionPayload = (payload) => {
  const errors = [];

  if (!isObject(payload)) {
    return ['Payload must be an object'];
  }

  const { booking, extension } = payload;

  if (!isObject(booking)) {
    errors.push('booking is required');
  }

  if (!isObject(extension)) {
    errors.push('extension is required');
  }

  if (errors.length > 0) {
    return errors;
  }

  if (!hasValue(booking.bulkRefId)) {
    errors.push('booking.bulkRefId is required');
  }

  if (!hasValue(booking.roomId)) {
    errors.push('booking.roomId is required');
  }

  if (!hasValue(extension.passcode)) {
    errors.push('extension.passcode is required');
  }

  if (!EXTENSION_MODES.includes(extension.whatToExtend)) {
    errors.push(`extension.whatToExtend must be one of: ${EXTENSION_MODES.join(', ')}`);
  }

  const requiresRoomUpgrade = extension.whatToExtend === 'room_upgrade' || extension.whatToExtend === 'both';
  const requiresStayDates = extension.whatToExtend === 'stay_extend' || extension.whatToExtend === 'both';

  if (requiresRoomUpgrade && !hasValue(extension.roomType)) {
    errors.push('extension.roomType is required for room upgrade');
  }

  if (hasValue(extension.roomType) && !Object.prototype.hasOwnProperty.call(ROOM_PRICES, extension.roomType)) {
    errors.push(`extension.roomType must be one of: ${Object.keys(ROOM_PRICES).join(', ')}`);
  }

  if (requiresStayDates && !hasValue(extension.checkOut)) {
    errors.push('extension.checkOut is required for stay extension');
  }

  const minCheckIn = parseDateOnlyUtc(EXTENSION_DATE_LIMITS.minCheckIn);
  const maxCheckIn = parseDateOnlyUtc(EXTENSION_DATE_LIMITS.maxCheckIn);
  const minCheckOut = parseDateOnlyUtc(EXTENSION_DATE_LIMITS.minCheckOut);
  const maxCheckOut = parseDateOnlyUtc(EXTENSION_DATE_LIMITS.maxCheckOut);

  if (hasValue(extension.checkIn)) {
    const checkInDate = parseDateOnlyUtc(extension.checkIn);
    if (!checkInDate) {
      errors.push('extension.checkIn must be in YYYY-MM-DD format');
    } else if (!inRange(checkInDate, minCheckIn, maxCheckIn)) {
      errors.push(`extension.checkIn must be between ${EXTENSION_DATE_LIMITS.minCheckIn} and ${EXTENSION_DATE_LIMITS.maxCheckIn}`);
    }
  }

  if (hasValue(extension.checkOut)) {
    const checkOutDate = parseDateOnlyUtc(extension.checkOut);
    if (!checkOutDate) {
      errors.push('extension.checkOut must be in YYYY-MM-DD format');
    } else if (!inRange(checkOutDate, minCheckOut, maxCheckOut)) {
      errors.push(`extension.checkOut must be between ${EXTENSION_DATE_LIMITS.minCheckOut} and ${EXTENSION_DATE_LIMITS.maxCheckOut}`);
    }
  }

  if (hasValue(extension.checkIn) && hasValue(extension.checkOut)) {
    const checkInDate = parseDateOnlyUtc(extension.checkIn);
    const checkOutDate = parseDateOnlyUtc(extension.checkOut);

    if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
      errors.push('extension.checkOut must be after extension.checkIn');
    }
  }

  return errors;
};
