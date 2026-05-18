
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import PaymentRecords from '../models/Payment.model.js';
import { addUsersService } from '../services/bulk.add.users.js';
import BookingLogs from '../models/Log.Booking.model.js';
import { sendEmmaRegistrationSuccessMail, sendMail } from "../services/mailer.service.js";
import EmmaRegistration from '../models/EmmaRegistration.model.js';
import EmmaRegistrationPayment from '../models/EmmaRegistrationPayment.model.js';
import {
    addRegistrationCompany,
    createRegistrationRecord,
    getRegistrationPayload,
    validateRegistrationPayload
} from './emma.registration.controller.js';


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

        const emmaOrderId = await registerEemaFromBookingLog(bulkRefId, log)
        if (emmaOrderId) {
            await PaymentRecords.findByIdAndUpdate(log._id, { emmaOrderId })
        }

        const storedData = {
            ...log._doc
        }


        let refferenceID = bulkRefId;

        const registerPrimaryData = await addUsersService(userData, log, refferenceID);
        await updatePaymentByBulkRefId(bulkRefId, log, amount, stage);


        const mails = await findPrimaryUser(userData);

        sendMail(mails, req.body, amount, 'success', registerPrimaryData?.bookings[0]?.createdAt);


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

const shouldRegisterEemaFromLog = (eemareg) => {
    return Boolean(
        eemareg?.isEmma === true ||
        eemareg?.isEmma === 1 ||
        eemareg?.isEmma === 'true' ||
        eemareg?.payload ||
        eemareg?.registrationData ||
        eemareg?.data ||
        (eemareg?.firstName && eemareg?.email && eemareg?.phone)
    );
};

const getEemaRegistrationPaymentData = (eemareg = {}) => {
    const registrationData = eemareg.payload || eemareg.registrationData || eemareg.data || eemareg;
    const baseFee = eemareg.fee ?? eemareg.baseFee ?? registrationData.fee ?? registrationData.baseFee;
    const gstAmount = eemareg.gstAmount ?? registrationData.gstAmount;
    const totalAmount = eemareg.totalAmount ?? registrationData.totalAmount;

    return {
        registrationData,
        baseFee,
        gstAmount,
        totalAmount
    };
};

const registerEemaFromBookingLog = async (bulkRefId, paymentLog) => {
    const bookingLog = await BookingLogs.findOne({ bulkRefId });
    if (!bookingLog?.eemareg || !shouldRegisterEemaFromLog(bookingLog.eemareg)) return;

    let registration = await EmmaRegistration.findOne({ orderId: bulkRefId });
    if (registration) {
        const registrationPayment = await EmmaRegistrationPayment.findOne({
            registrationId: registration._id,
            orderId: registration.orderId
        });

        if (registration.paymentStatus === 'paid' || registrationPayment) {
            return registration.orderId;
        }
    }

    const {
        registrationData,
        baseFee,
        gstAmount,
        totalAmount
    } = getEemaRegistrationPaymentData(bookingLog.eemareg);

    if (!registrationData || !baseFee || gstAmount === undefined || !totalAmount) {
        throw new Error('Invalid EEMA registration data in booking log');
    }

    const existingPayment = await EmmaRegistrationPayment.findOne({
        razorpay_payment_id: paymentLog.razorpay_payment_id
    });
    if (existingPayment) return existingPayment.orderId;

    if (!registration) {
        const validation = await validateRegistrationPayload({
            ...getRegistrationPayload(registrationData),
            fee: baseFee,
            gstAmount,
            totalAmount
        });

        if (!validation.valid) {
            throw new Error(validation.message);
        }

        registration = await createRegistrationRecord(validation.normalized, {
            orderId: bulkRefId,
            registerFrom: 1
        });
    }

    const existingRegistrationPayment = await EmmaRegistrationPayment.findOne({
        registrationId: registration._id,
        orderId: registration.orderId
    });
    if (existingRegistrationPayment) return existingRegistrationPayment.orderId;

    const payment = await EmmaRegistrationPayment.create({
        registrationId: registration._id,
        orderId: registration.orderId,
        razorpay_order_id: paymentLog.razorpay_order_id,
        razorpay_payment_id: paymentLog.razorpay_payment_id,
        razorpay_signature: paymentLog.razorpay_signature,
        baseFee,
        gstAmount,
        totalAmount,
        paymentAmount: totalAmount
    });

    registration.paymentId = payment._id;
    registration.paymentStatus = 'paid';
    await registration.save();
    await addRegistrationCompany(registration);

    try {
        sendEmmaRegistrationSuccessMail(registration, payment);
    } catch (mailError) {
        console.error('EEMA registration confirmation mail failed:', mailError);
    }

    return registration.orderId;
}
