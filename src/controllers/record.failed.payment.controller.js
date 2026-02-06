
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import FailedPayment from '../models/failed.payment.model.js';
import BookingLogs from '../models/Log.Booking.model.js';
import { sendMail } from "../services/mailer.service.js";


export const recordFailedController = async (req, res) => {
    try {
        const error = req.body.error;
        const bulkRefId = req.body.bulkRefId;
        const logId = req.body.logId;
        const amount = req.body.amount;
        const userData = req.body.userData;

        if (!error || !bulkRefId || !logId || !bulkRefId || !amount || !userData) {
            return sendError(res, 'Invalid payload', 400);
        }

        const log = await FailedPayment.create({
            error,
            bulkRefId,
            logId,
            paymentAmount: amount

        });
        const storedData = {
            ...log._doc
        }

        await updatePaymentByBulkRefId(bulkRefId, log, amount);

        const mails = await findPrimaryUser(userData);

        sendMail(mails, req.body, amount, 'fail');


        return sendSuccess(res, 'Data stored successfully', {
            ...storedData,
            ...log
        });
    } catch (error) {
        console.error(error);
        return sendError(res, 'Failed to store data', 500, error.message);
    }
};

const updatePaymentByBulkRefId = async (
    bulkRefId,
    paymentId,
    paymentAmount = 0
) => {
    return await BookingLogs.updateMany(
        { bulkRefId },
        {
            $set: {
                payment: 2,              // failed
                paymentId: paymentId,    // ObjectId
                paymentAmount
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