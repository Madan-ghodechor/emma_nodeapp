// src/controllers/room.controller.js
import mongoose from 'mongoose';
import crypto from 'crypto';
import Company from '../models/Company.model.js';
import User from '../models/User.model.js';
import Room from '../models/Room.model.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const createRoomsWithAttendees = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!Array.isArray(req.body) || req.body.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 'Invalid rooms payload', 400);
        }


        const roomsPayload = req.body; // Array of rooms
        const bulkRefId = `BULK_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;


        const createdRooms = [];

        for (const room of roomsPayload) {
            const attendeeIds = [];

            for (const attendee of room.attendees) {
                // 1️⃣ Check if company exists
                let company = await Company.findOne({ name: attendee.organisation }).session(session);
                if (!company) {
                    company = await Company.create([{ name: attendee.organisation, gst: attendee.gst, address: attendee.city, bulkRefId }], { session });
                    company = company[0];
                }

                // 2️⃣ Check if user exists
                let user = await User.findOne({ email: attendee.email }).session(session);
                // if (!user) {
                //   user = await User.create([{
                //     firstName: attendee.firstName,
                //     lastName: attendee.lastName,
                //     email: attendee.email,
                //     phone: attendee.phone,
                //     gst: attendee.gst,
                //     is_primary: attendee.is_primary_user,
                //     primary_user_email: attendee.primary_user_email,
                //     company: company._id
                //   }], { session });
                //   user = user[0];
                // }

                if (!user) {
                    // create new user
                    const createdUser = await User.create([{
                        firstName: attendee.firstName,
                        lastName: attendee.lastName,
                        email: attendee.email,
                        phone: attendee.phone,
                        gst: attendee.gst,
                        is_primary_user: attendee.is_primary_user,
                        primary_user_email: attendee.primary_user_email,
                        company: company._id,
                        bulkRefId
                    }], { session });

                    user = createdUser[0];
                } else {
                    // UPDATE existing user if primary appears later
                    if (attendee.is_primary_user === true && user.is_primary_user === false) {
                        user.is_primary_user = true;
                        user.primary_user_email = attendee.primary_user_email;
                        await user.save({ session });
                    }
                }

                attendeeIds.push(user._id);
            }

            // 3️⃣ Create room
            const newRoom = await Room.create([{
                roomId: room.roomId,
                roomType: room.roomtype,
                checkIn: room.checkIn,
                checkOut: room.checkOut,
                attendees: attendeeIds,
                payment: 2, // pending
                bulkRefId
            }], { session });

            createdRooms.push(newRoom[0]);
        }

        await session.commitTransaction();
        session.endSession();

        return sendSuccess(res, 'Rooms and attendees created successfully', createdRooms);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, 'Failed to create rooms', 500, error.message);
    }
};
