import EmmaRegistration from '../models/EmmaRegistration.model.js';
import EmmaRegistrationPayment from '../models/EmmaRegistrationPayment.model.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

const normalizePhone = (phone = '') => String(phone).replace(/\s+/g, '').trim();
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phoneSpacingRegex = (phone = '') => {
  const normalizedPhone = normalizePhone(phone);
  return new RegExp(`^${normalizedPhone.split('').map(escapeRegex).join('\\s*')}$`);
};

const generateOrderId = async () => {
  const prefix = 'EMMA26';
  const width = 5;

  const lastRegistration = await EmmaRegistration
    .findOne({ orderId: { $regex: `^${prefix}` } })
    .sort({ orderId: -1 })
    .select('orderId');

  let nextNumber = 1;

  if (lastRegistration?.orderId) {
    const lastNumber = Number.parseInt(lastRegistration.orderId.replace(prefix, ''), 10);
    nextNumber = Number.isNaN(lastNumber) ? 1 : lastNumber + 1;
  }

  return prefix + String(nextNumber).padStart(width, '0');
};

const getRegistrationPayload = (body = {}) => {
  const {
    memberType = 'emma',
    firstName,
    lastName,
    email,
    phone,
    company,
    gst,
    fee,
    gstAmount,
    totalAmount
  } = body;

  return {
    memberType,
    firstName,
    lastName,
    email,
    phone,
    company,
    gst,
    fee,
    gstAmount,
    totalAmount
  };
};

const validateRegistrationPayload = async (payload) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    company,
    fee
  } = payload;

  if (!firstName || !lastName || !email || !phone || !company || !fee) {
    return {
      valid: false,
      statusCode: 400,
      message: 'Missing required registration details'
    };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const rawPhone = String(phone).trim();
  const normalizedPhone = normalizePhone(phone);
  const existingRegistration = await EmmaRegistration.findOne({
    $or: [
      { email: normalizedEmail },
      { phone: rawPhone },
      { phone: normalizedPhone },
      { phone: phoneSpacingRegex(normalizedPhone) }
    ]
  });

  if (existingRegistration) {
    const field = existingRegistration.email === normalizedEmail ? 'email' : 'phone number';

    return {
      valid: false,
      statusCode: 409,
      message: `Registration already exists with this ${field}`,
      data: {
        id: existingRegistration._id,
        orderId: existingRegistration.orderId,
        registration: existingRegistration
      }
    };
  }

  return {
    valid: true,
    normalized: {
      ...payload,
      email: normalizedEmail,
      phone: normalizedPhone,
      gstAmount: payload.gstAmount ?? Math.round(Number(fee) * 0.18),
      totalAmount: payload.totalAmount ?? Math.round(Number(fee) * 1.18)
    }
  };
};

const createRegistrationRecord = async (payload) => {
  return EmmaRegistration.create({
    memberType: payload.memberType,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    company: payload.company,
    gst: payload.gst,
    fee: payload.fee,
    gstAmount: payload.gstAmount,
    totalAmount: payload.totalAmount,
    orderId: await generateOrderId()
  });
};

export const validateEmmaRegistration = async (req, res) => {
  try {
    const validation = await validateRegistrationPayload(getRegistrationPayload(req.body));

    if (!validation.valid) {
      return sendError(res, validation.message, validation.statusCode, validation.data || null);
    }

    return sendSuccess(res, 'Registration details are valid');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createEmmaRegistration = async (req, res) => {
  try {
    const validation = await validateRegistrationPayload(getRegistrationPayload(req.body));

    if (!validation.valid) {
      return sendError(res, validation.message, validation.statusCode, validation.data || null);
    }

    const registration = await createRegistrationRecord(validation.normalized);

    return sendSuccess(res, 'Registration created successfully', {
      id: registration._id,
      orderId: registration.orderId,
      registration
    }, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'Registration already exists', 409);
    }

    return sendError(res, error.message, 500);
  }
};

export const getEmmaRegistration = async (req, res) => {
  try {
    const id = req.query.id || req.body?.id;
    const orderId = req.query.orderId || req.body?.orderId;

    if (!id || !orderId) {
      return sendError(res, 'Registration id and orderId are required', 400);
    }

    const registration = await EmmaRegistration.findOne({
      _id: id,
      orderId: String(orderId).trim()
    });

    if (!registration) {
      return sendError(res, 'Registration not found', 404);
    }

    return sendSuccess(res, 'Registration fetched successfully', {
      id: registration._id,
      orderId: registration.orderId,
      registration
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const recordEmmaRegistrationPaymentSuccess = async (req, res) => {
  try {
    const {
      registrationData,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      baseFee,
      gstAmount,
      totalAmount,
      amount
    } = req.body;

    if (
      !registrationData ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !baseFee ||
      gstAmount === undefined ||
      !totalAmount
    ) {
      return sendError(res, 'Invalid payment payload', 400);
    }

    const validation = await validateRegistrationPayload({
      ...getRegistrationPayload(registrationData),
      fee: baseFee,
      gstAmount,
      totalAmount
    });

    if (!validation.valid) {
      return sendError(res, validation.message, validation.statusCode, validation.data || null);
    }

    const existingPayment = await EmmaRegistrationPayment.findOne({ razorpay_payment_id });
    if (existingPayment) {
      return sendSuccess(res, 'Payment already recorded', {
        paymentId: existingPayment._id,
        payment: existingPayment
      });
    }

    const registration = await createRegistrationRecord(validation.normalized);
    const paymentAmount = amount ?? totalAmount;

    const payment = await EmmaRegistrationPayment.create({
      registrationId: registration._id,
      orderId: registration.orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      baseFee,
      gstAmount,
      totalAmount,
      paymentAmount
    });

    registration.paymentId = payment._id;
    registration.paymentStatus = 'paid';
    await registration.save();

    return sendSuccess(res, 'EMMA registration payment recorded successfully', {
      paymentId: payment._id,
      payment,
      registration
    }, 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 'Payment already recorded', 409);
    }

    return sendError(res, error.message, 500);
  }
};
