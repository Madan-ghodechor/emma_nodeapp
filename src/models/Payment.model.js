import mongoose from 'mongoose';

const PaymentRecords = new mongoose.Schema(
    {
        razorpay_order_id: {
            type: String,
            required: true,
        },
        razorpay_payment_id: {
            type: String,
            required: true
        },
        razorpay_signature: {
            type: String,
            required: true
        },
        paymentAmount: {
            type: Number,
            required: true
        }

    },
    {
        timestamps: true
    }
);

export default mongoose.model('PaymentRecords', PaymentRecords);
