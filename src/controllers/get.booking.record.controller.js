
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import BookingLogs from '../models/Log.Booking.model.js';
import Company from '../models/Company.model.js';
import PaymentRecords from '../models/Payment.model.js';
import User from '../models/User.model.js';
import Room from '../models/Room.model.js';



export const getRecordController = async (req, res) => {
    try {
        const { refID } = req.query;


        if (!refID) {
            return sendError(res, 'Invalid payload', 400);
        }
        const rooms = await Room.find({ bulkRefId: refID }).lean();

        const attendeeIds = rooms.flatMap(r => r.attendees);
        const paymentIds = rooms.map(r => r.paymentId);

        const [users, payments] = await Promise.all([
            User.find({ _id: { $in: attendeeIds } }).lean(),
            PaymentRecords.find({ _id: { $in: paymentIds } }).lean()
        ]);

        const userMap = new Map(users.map(u => [u._id.toString(), u]));
        const paymentMap = new Map(payments.map(p => [p._id.toString(), p]));

        const userData = rooms.map(room => {
            const payment = paymentMap.get(room.paymentId?.toString());
            console.log(payment)

            return {
                roomId: room.roomId,
                roomtype: room.roomType,
                checkIn: room.checkIn.toISOString().split('T')[0],
                checkOut: room.checkOut.toISOString().split('T')[0],

                payment: payment ? payment : '',

                attendees: room.attendees.map(id => {
                    const u = userMap.get(id.toString());
                    if (!u) return null;

                    return {
                        id: u._id,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        email: u.email,
                        organisation: u.organisation,
                        phone: u.phone,
                        gst: u.gst,
                        is_primary_user: u.is_primary_user,
                        primary_user_email: u.primary_user_email
                    };
                }).filter(Boolean)
            };
        });



        return sendSuccess(res, 'Data stored successfully', {
            userData
        });
    } catch (error) {
        console.error(error);
        return sendError(res, 'Failed to store data', 500, error.message);
    }
};

const updatePaymentByBulkRefId = async (
    bulkRefId,
    paymentId,
    paymentAmount = 0,
    stage
) => {
    return await BookingLogs.updateMany(
        { bulkRefId },
        {
            $set: {
                payment: 1,              // success
                paymentId: paymentId,    // ObjectId
                paymentAmount,
                stage
            }
        }
    );
};

const findPrimaryUser = async (userdata) => {
    let primaryUser = '';
    const secondaryUsers = [];

    for (let room of userdata) {
        for (let user of room.attendees) {
            if (user.is_primary_user) {
                primaryUser = user.email;
            } else {
                secondaryUsers.push(user.email);
            }
        }
    }

    return {
        primaryUser,
        secondaryUsers
    }
}