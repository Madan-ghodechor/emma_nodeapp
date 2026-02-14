import crypto from 'crypto';
import Company from '../models/Company.model.js';
import User from '../models/User.model.js';
import Room from '../models/Room.model.js';

export const addUsersService = async (data, payment = null, bulkRefIds = null) => {
    try {

    

        const roomsPayload = data;
        const bulkRefId = bulkRefIds;



        const createdRooms = [];

        for (const room of roomsPayload) {
            const attendeeIds = [];

            for (const attendee of room.attendees) {
                // 1️⃣ Check if company exists
                let company = await Company.findOne({
                    name: attendee.organisation
                });

                if (!company) {
                    company = await Company.create({
                        name: attendee.organisation,
                        gst: attendee.gst,
                        address: attendee.city,
                        bulkRefId
                    });
                }

                // 2️⃣ Check if user exists
                let user = await User.findOne({
                    email: attendee.email
                });

                if (!user) {
                    user = await User.create({
                        firstName: attendee.firstName,
                        lastName: attendee.lastName,
                        email: attendee.email,
                        phone: attendee.phone,
                        gst: attendee.gst,
                        is_primary_user: attendee.is_primary_user,
                        primary_user_email: attendee.primary_user_email,
                        company: company._id,
                        bulkRefId
                    });
                } else {
                    // UPDATE existing user if primary appears later
                    if (
                        attendee.is_primary_user === true &&
                        user.is_primary_user === false
                    ) {
                        user.is_primary_user = true;
                        user.primary_user_email = attendee.primary_user_email;
                        await user.save();
                    }
                }

                attendeeIds.push(user._id);
            }

            const hasPayment = !!payment?._id;

            // 3️⃣ Create room
            const newRoom = await Room.create({
                roomId: room.roomId,
                roomType: room.roomtype,
                checkIn: room.checkIn,
                checkOut: room.checkOut,
                attendees: attendeeIds,
                bulkRefId,
                payment: hasPayment ? 1 : 0,
                paymentId: hasPayment ? payment._id : null
            });

            createdRooms.push(newRoom);
        }

        return {
            bulkRefId,
            bookings: createdRooms
        }

    } catch (error) {
        console.error('Bulk add service error : ', error);
        return error.message;
    }
};
