
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import BookingLogs from '../models/Log.Booking.model.js';

import crypto from 'crypto';


export const createBookingLog = async (req, res) => {
    try {
        if (!Array.isArray(req.body) || req.body.length === 0) {
            return sendError(res, 'Invalid payload', 400);
        }

        const bulkRefId = `CTXEHB_${Date.now()}_${crypto
            .randomBytes(3)
            .toString('hex')}`;

        // ✅ STORE DATA EXACTLY AS RECEIVED
        const log = await BookingLogs.create({
            bulkRefId,
            payload: req.body
        });

        return sendSuccess(res, 'Data stored successfully', {
            bulkRefId,
            logId: log._id
        });
    } catch (error) {
        console.error(error);
        return sendError(res, 'Failed to store data', 500, error.message);
    }
};

export const getBookingLog = async (req, res) => {
    try {

        const { refID } = req.query;

        if (!refID) {
            return res.status(400).json({
                success: false,
                message: 'refID is required'
            });
        }
        const data = await BookingLogs.find({ "bulkRefId": refID })

        return res.status(200).json({
            success: true,
            refID,
            data
        });
    } catch (error) {
        console.error(error);
        return sendError(res, 'Failed to get data', 500, error.message);
    }
};
