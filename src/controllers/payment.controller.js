// src/controllers/payment.controller.js
import razorpay from '../config/razorpay.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';


//********* Create Oder ID *********//
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount) {
      return sendError(res, 'Amount is required', 400);
    }

    const options = {
      amount: amount * 100,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    return sendSuccess(res, 'Order created successfully', order, 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
