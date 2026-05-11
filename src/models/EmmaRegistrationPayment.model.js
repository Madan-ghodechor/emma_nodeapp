import mongoose from 'mongoose';

const emmaRegistrationPaymentSchema = new mongoose.Schema(
  {
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmmaRegistration',
      required: true,
      index: true
    },
    orderId: { type: String, required: true, trim: true, index: true },
    razorpay_order_id: { type: String, required: true, trim: true },
    razorpay_payment_id: { type: String, required: true, trim: true, unique: true },
    razorpay_signature: { type: String, required: true, trim: true },
    baseFee: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['paid'],
      default: 'paid'
    }
  },
  { timestamps: true }
);

export default mongoose.model('EmmaRegistrationPayment', emmaRegistrationPaymentSchema);
