// src/models/RoomImportLog.model.js
import mongoose from 'mongoose';

const BookingLogs = new mongoose.Schema(
    {
        bulkRefId: {
            type: String,
            required: true,
        },
        payment: {
            type: Number,
            enum: [0, 1, 2], // pending, success, failed
            default: 0 // pending
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PaymentRecords'
        },
        paymentAmount: {
            type: Number,
            default: 0
        },

        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('BookingLogs', BookingLogs);
