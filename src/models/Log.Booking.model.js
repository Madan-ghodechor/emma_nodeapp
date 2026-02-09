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
            default: 0
        },
        singleroom: {
            type: Number,
        },
        doubleroom: {
            type: Number,
        },
        tripleroom: {
            type: Number,
        },
        stage: {
            type: Number,
            enum: [1, 2, 3, 4, 5], // primary added, room selection, forms filling, proceed to payment, Done with payment
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PaymentRecords'
        },
        primaryUser: {
            type: mongoose.Schema.Types.Mixed,
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
