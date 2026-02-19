
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import BookingLogs from '../models/Log.Booking.model.js';

import crypto from 'crypto';


export const createBookingLog = async (req, res) => {
    try {
        const userData = req.body.userdata;
        const refferenceID = req.body.bulkRefId;
        const stage = req.body.stage
        const primaryUser = req.body.primary_user;
        const singleRoom = req.body.singleroom;
        const doubleRoom = req.body.doubleroom;
        const tripleRoom = req.body.tripleroom;

        if (!Array.isArray(userData) || req.body.length === 0) {
            return sendError(res, 'Invalid payload', 400);
        }

        const generateBookingId = async () => {
            const prefix = "SF26";
            const width = 5;

            const lastRecord = await BookingLogs
                .findOne({ bulkRefId: { $regex: `^${prefix}` } })
                .sort({ bulkRefId: -1 })  // safe because padded
                .select("bulkRefId");

            let nextNumber = 1;

            if (lastRecord && lastRecord.bulkRefId) {
                const lastNumber = parseInt(lastRecord.bulkRefId.replace(prefix, ""));
                nextNumber = lastNumber + 1;
            }

            return prefix + String(nextNumber).padStart(width, "0");
        };


        const bulkRefId = refferenceID || await generateBookingId();



        const log = await BookingLogs.findOneAndUpdate(
            { bulkRefId },
            {
                $set: {
                    payload: userData,
                    primaryUser,
                    stage,
                    singleroom: singleRoom,
                    doubleroom: doubleRoom,
                    tripleroom: tripleRoom
                },
            },
            {
                new: true,
                upsert: true,
            }
        );

        return sendSuccess(res, 'Data stored successfully', {
            bulkRefId,
            logId: log._id,
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
