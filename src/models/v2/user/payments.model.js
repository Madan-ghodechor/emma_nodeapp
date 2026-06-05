import mongoose from 'mongoose';

const paymentsSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
    },

    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
    },
    razorpaySignature: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },

    paidToCotrav: {
      type: Number,
      required: true,
    },

    gatewayCharges: {
      type: Number,
      required: true,
    },

    paymentFor: {
      type: String,
      required: true,
      enum: ["registration", "booking", "both"], 
      default: "registration",
    },
  },
  { timestamps: true },
);
    
export default mongoose.model('new_Payments', paymentsSchema);