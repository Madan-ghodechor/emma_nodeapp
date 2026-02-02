// src/controllers/payment.controller.js
import razorpay from '../config/razorpay.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount) {
      return sendError(res, 'Amount is required', 400);
    }

    // Razorpay expects amount in paise
    const options = {
      amount: amount * 100, // ₹100 => 10000 paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1 // auto capture
    };

    const order = await razorpay.orders.create(options);

    return sendSuccess(res, 'Order created successfully', order, 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
