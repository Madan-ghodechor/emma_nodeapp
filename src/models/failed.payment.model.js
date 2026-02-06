import mongoose from 'mongoose';

const FailedPayment = new mongoose.Schema(
    {
        error: {
            type: Object,
            required: true,
        },
        bulkRefId: {
            type: String,
            required: true
        },
        logId: {
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

export default mongoose.model('FailedPayment', FailedPayment);
