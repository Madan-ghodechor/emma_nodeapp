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

export const createEmmaRegistration = async (req, res) => {
  try {
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
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !company || !fee) {
      return sendError(res, 'Missing required registration details', 400);
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

      return sendError(res, `Registration already exists with this ${field}`, 409, {
        id: existingRegistration._id,
        orderId: existingRegistration.orderId,
        registration: existingRegistration
      });
    }

    const registration = await EmmaRegistration.create({
      memberType,
      firstName,
      lastName,
      email: normalizedEmail,
      phone: normalizedPhone,
      company,
      gst,
      fee,
      gstAmount: gstAmount ?? Math.round(Number(fee) * 0.18),
      totalAmount: totalAmount ?? Math.round(Number(fee) * 1.18),
      orderId: await generateOrderId()
    });

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
      registrationId,
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      baseFee,
      gstAmount,
      totalAmount,
      amount
    } = req.body;

    if (
      !registrationId ||
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !baseFee ||
      gstAmount === undefined ||
      !totalAmount
    ) {
      return sendError(res, 'Invalid payment payload', 400);
    }

    const registration = await EmmaRegistration.findOne({
      _id: registrationId,
      orderId: String(orderId).trim()
    });

    if (!registration) {
      return sendError(res, 'Registration not found', 404);
    }

    const existingPayment = await EmmaRegistrationPayment.findOne({ razorpay_payment_id });

    if (existingPayment) {
      if (!registration.paymentId || String(registration.paymentId) !== String(existingPayment._id)) {
        registration.paymentId = existingPayment._id;
        registration.paymentStatus = 'paid';
        await registration.save();
      }

      return sendSuccess(res, 'Payment already recorded', {
        paymentId: existingPayment._id,
        payment: existingPayment,
        registration
      });
    }

    const paymentAmount = amount ?? totalAmount;

    const payment = await EmmaRegistrationPayment.create({
      registrationId,
      orderId: String(orderId).trim(),
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
