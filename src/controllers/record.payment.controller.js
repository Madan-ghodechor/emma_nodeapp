
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import PaymentRecords from '../models/Payment.model.js';
import { addUsersService } from '../services/bulk.add.users.js';
import BookingLogs from '../models/Log.Booking.model.js';
import { sendMail } from "../services/mailer.service.js";


export const recordController = async (req, res) => {
    try {
        const razorpay_order_id = req.body.razorpay_order_id;
        const razorpay_payment_id = req.body.razorpay_payment_id;
        const razorpay_signature = req.body.razorpay_signature;
        const bulkRefId = req.body.bulkRefId;
        const userData = req.body.userData;
        const amount = req.body.amount;
        const stage = 5;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bulkRefId || !userData || !amount) {
            return sendError(res, 'Invalid payload', 400);
        }

        const log = await PaymentRecords.create({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paymentAmount: amount

        });
        const storedData = {
            ...log._doc
        }


        const generateBookingId = async () => {
            const prefix = "SF26";
            const width = 5;

            const lastRecord = await BookingLogs
                .findOne({ bulkRefId: { $regex: `^${prefix}` } })
                .sort({ bulkRefId: -1 })
                .select("bulkRefId");

            let nextNumber = 1;

            if (lastRecord && lastRecord.bulkRefId) {
                const lastNumber = parseInt(lastRecord.bulkRefId.replace(prefix, ""));
                nextNumber = lastNumber + 1;
            }

            return prefix + String(nextNumber).padStart(width, "0");
        };





        let refferenceID = bulkRefId;
        if (!!bulkRefId) {
            refferenceID = await generateBookingId()
        }


        const registerPrimaryData = await addUsersService(userData, log, refferenceID);
        await updatePaymentByBulkRefId(bulkRefId, log, amount, stage);


        const mails = await findPrimaryUser(userData);

        sendMail(mails, req.body, amount, 'success');


        return sendSuccess(res, 'Data stored successfully', {
            ...storedData,
            ...registerPrimaryData
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
    let primaryUserWhatsapp;
    let guestName;

    for (let room of userdata) {
        for (let user of room.attendees) {
            if (user.is_primary_user) {
                primaryUser = user.email;
                primaryUserWhatsapp = user.phone;
                guestName = user.firstName
            } else {
                secondaryUsers.push(user.email);
            }
        }
    }

    return {
        primaryUser,
        secondaryUsers,
        guestName,
        primaryUserWhatsapp
    }
}