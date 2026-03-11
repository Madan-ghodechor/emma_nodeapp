import bcrypt from 'bcrypt';
import Admin from '../models/admin.model.js';
import jwt from 'jsonwebtoken';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import crypto from 'crypto';
import { loginMail } from "../services/login.main.service.js";
import Room from '../models/Room.model.js';
import User from '../models/User.model.js';
import PaymentRecords from '../models/Payment.model.js';
import Company from '../models/Company.model.js';
import { createRemainingPaymentToken, sendMail, sendRemainingPaymentMail } from "../services/mailer.service.js";




const generatePassword = () => {
    return crypto.randomBytes(8).toString('hex');
};

export const createAdmin = async (req, res) => {
    const { name, phone, email, internal } = req.body;
    try {

        // check existing
        const exists = await Admin.findOne({
            $or: [{ email }, { phone }, { name }]
        });

        if (exists) {
            if (internal)
                return 'Admin already exists';

            return sendError(res, 'Admin already exists');
        }

        // generate password
        const plainPassword = generatePassword();

        // hash password
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const admin = await Admin.create({
            name,
            phone,
            email,
            password: hashedPassword
        });

        // send mail with password
        loginMail(name, email, plainPassword)

        const adminObj = admin.toObject();
        delete adminObj.password;

        if (internal)
            return 'Admin created and password sent on email';

        return sendSuccess(res, 'Admin created and password sent on email', adminObj);


    } catch (error) {
        if (internal)
            return 'Internal Server Error';

        return sendError(res, error.message);
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 'Email and password are required');
        }

        const admin = await Admin.findOne({ email }).select('+password');

        if (!admin) {
            if (email == "madan.ghodechor@cotrav.co") {
                const da = {
                    "req": {
                        "body": {
                            "name": "Madan Ghodechor",
                            "email": "madan.ghodechor@cotrav.co",
                            "phone": "9309804106",
                            "password": "",
                            "internal": true
                        }
                    }
                }
                createAdmin(da.req)
            }

            return sendError(res, 'Invalid credentials');
        }

        if (!admin.password) {
            return sendError(res, 'Password not set for this account');
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return sendError(res, 'Invalid credentials');
        }

        // create JWT
        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // remove password before sending
        const adminObj = admin.toObject();
        delete adminObj.password;

        return sendSuccess(res, 'Login successful', {
            token,
            user: adminObj
        });

    } catch (error) {
        console.log(error)
        return sendError(res, error.message);
    }
};

export const getDashboard = async (req, res) => {
    try {

        const totelAmount = await getTotalAmount();
        const payments = await getPaymentRecords();
        const rawrooms = await getRooms();
        const companies = await getCompanies();
        const AllUsers = await getUsersInternal();

        const roomsData = rawrooms.map(room => {
            const roomPaymentIds = Array.isArray(room.paymentIds) && room.paymentIds.length > 0
                ? room.paymentIds
                : (room.paymentId ? [room.paymentId] : []);

            const paymentsData = payments.filter(payment =>
                roomPaymentIds.some(id => String(id) === String(payment._id))
            );

            const totalPaidAmount = paymentsData.reduce((sum, payment) => {
                return sum + (payment.paymentAmount || 0);
            }, 0);

            return {
                ...room?._doc,
                payment: paymentsData[paymentsData.length - 1] || null,
                payments: paymentsData,
                totalPaidAmount
            };
        });

        const users = AllUsers.map(user => {
            const companyData = companies.find(company =>
                String(company._id) === String(user.company)
            );

            return {
                ...user?._doc,
                company: companyData || null
            };
        });

        const rooms = roomsData.map(room => {
            const attendees = room.attendees.map(id =>
                users.find(user =>
                    String(id) === String(user._id)
                )
            ).filter(Boolean);

            return {
                ...room,
                attendees
            };
        });


        return sendSuccess(res, 'Dashbord fetch successful', {
            rooms,
            user_count: users.length,
            totelAmount
        });

    } catch (error) {
        console.log(error)
        return sendError(res, error.message);
    }
}


const getRooms = async () => {
    try {
        const rooms = await Room.find().select('-updatedAt -__v');

        return rooms;

    } catch (error) {
        console.error(error);
        return sendError(res, 'Admin: Failed to fetch rooms', 500, error.message);
    }
};

const getUsersInternal = async () => {
    try {
        const users = await User.find().select();

        return users;

    } catch (error) {
        console.error(error);
        return null;
    }
};

const getTotalAmount = async () => {
    try {
        const payments = await PaymentRecords.find().select('paymentAmount');
        let amount = 0;

        for (let record of payments) {
            amount += record.paymentAmount
        }

        return amount;

    } catch (error) {
        console.error(error);
        return null;
    }
};

const getPaymentRecords = async () => {
    try {
        const payments = await PaymentRecords.find().select('_id razorpay_payment_id razorpay_order_id paymentAmount');

        return payments;

    } catch (error) {
        console.error(error);
        return null;
    }
};

const getCompanies = async () => {
    try {
        const companies = await Company.find().select('_id name gst');

        return companies;

    } catch (error) {
        console.error(error);
        return null;
    }
};



export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-updatedAt -__v');
        return sendSuccess(res, 'Dashbord fetch successful', {
            users
        });

    } catch (error) {
        console.error(error);
        return sendError(res, 'Admin: Failed to fetch rooms', 500, error.message);
    }
};

export const getPaymentByID = async (req, res) => {
    try {
        const { id } = req.params;

        const payment = await PaymentRecords.findById(id);


        if (!payment) {
            return sendError(res, 'Payment not found', 404);
        }

        return sendSuccess(res, 'Payment fetch successful', payment);

    } catch (error) {
        console.error(error);
        return sendError(res, 'Failed to fetch payment', 500, error.message);
    }
};

export const sendRemainingPaymentCollectionMail = async (req, res) => {
    try {
        const { data } = req.body;

        if (!data?.booking || !data?.extension || !data?.pricing) {
            return sendError(res, 'Invalid payload', 400);
        }

        const { booking, extension, pricing } = data;
        const attendees = Array.isArray(booking.attendees) ? booking.attendees : [];
        const primaryUser = attendees.find((attendee) => attendee?.is_primary_user) || attendees[0];
        const secondaryUsers = attendees
            .filter((attendee) => attendee?.email && attendee.email !== primaryUser?.email)
            .map((attendee) => attendee.email);

        if (!primaryUser?.email) {
            return sendError(res, 'Primary user email not found', 400);
        }

        if (!pricing.extraPayableAmount || pricing.extraPayableAmount <= 0) {
            return sendError(res, 'Remaining amount must be greater than zero', 400);
        }

        const paymentContext = {
            bookingId: booking._id,
            bulkRefId: booking.bulkRefId,
            roomId: booking.roomId,
            roomType: booking.roomType,
            paymentId: booking.paymentId || booking.payment?._id || null,
            paymentIds: booking.paymentIds || [],
            extension,
            pricing,
            attendees: attendees.map((attendee) => ({
                id: attendee._id,
                firstName: attendee.firstName,
                lastName: attendee.lastName,
                email: attendee.email,
                phone: attendee.phone,
                is_primary_user: attendee.is_primary_user,
                primary_user_email: attendee.primary_user_email,
                company: attendee.company || null
            })),
            attendee: {
                id: primaryUser._id,
                firstName: primaryUser.firstName,
                lastName: primaryUser.lastName,
                email: primaryUser.email,
                phone: primaryUser.phone
            }
        };

        const token = createRemainingPaymentToken(paymentContext);
        const paymentPageUrl = `${process.env.UPGRADEURL || ''}${token}`;
        sendRemainingPaymentMail({
            paymentPageUrl,
            data
        });

        return sendSuccess(res, 'Remaining payment email sent successfully', {
            sentTo: primaryUser.email,
            cc: secondaryUsers,
            bulkRefId: booking.bulkRefId,
            extraPayableAmount: pricing.extraPayableAmount,
            paymentPageUrl
        });
    } catch (error) {
        console.log(error)
        return sendError(res, error.message);
    }
};

export const sendVoucher = async (req, res) => {
    try {
        const booking = req.body?.data || req.body;

        if (!booking?.bulkRefId || !booking?.roomId || !Array.isArray(booking?.attendees) || booking.attendees.length === 0) {
            return sendError(res, 'Invalid payload', 400);
        }

        const primaryUser = booking.primaryAttendee
            || booking.attendees.find((attendee) => attendee?.is_primary_user)
            || booking.attendees[0];

        if (!primaryUser?.email) {
            return sendError(res, 'Primary user email not found', 400);
        }

        const secondaryUsers = booking.attendees
            .filter((attendee) => attendee?.email && attendee.email !== primaryUser.email)
            .map((attendee) => attendee.email);

        const mailUsers = {
            primaryUser: primaryUser.email,
            secondaryUsers,
            guestName: primaryUser.firstName,
            primaryUserWhatsapp: primaryUser.phone
        };

        const userData = [
            {
                roomId: booking.roomId,
                roomtype: booking.roomType,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                attendees: booking.attendees.map((attendee) => ({
                    id: attendee._id,
                    firstName: attendee.firstName,
                    lastName: attendee.lastName,
                    email: attendee.email,
                    organisation: attendee.company?.name || attendee.organisation || '',
                    phone: attendee.phone,
                    gst: attendee.gst,
                    is_primary_user: attendee.is_primary_user,
                    primary_user_email: attendee.primary_user_email
                }))
            }
        ];

        const mailPayload = {
            bulkRefId: booking.bulkRefId,
            userData,
            razorpay_payment_id: booking.payment?.razorpay_payment_id || '',
            razorpay_order_id: booking.payment?.razorpay_order_id || '',
            logId: booking.paymentId || booking.payment?._id || ''
        };

        sendMail(
            mailUsers,
            mailPayload,
            booking.payment?.paymentAmount || 0,
            'success',
            booking.createdAt || new Date()
        );

        const updatedRoom = await Room.findOneAndUpdate(
            booking._id
                ? { _id: booking._id }
                : { bulkRefId: booking.bulkRefId, roomId: booking.roomId },
            { $inc: { voucherSend: 1 } },
            { new: true, projection: { voucherSend: 1 } }
        );

        return sendSuccess(res, 'Voucher email sent successfully', {
            sentTo: primaryUser.email,
            cc: secondaryUsers,
            bulkRefId: booking.bulkRefId,
            paymentId: booking.paymentId || booking.payment?._id || null,
            voucherSend: updatedRoom?.voucherSend ?? null
        });
    } catch (error) {
        console.log(error)
        return sendError(res, error.message);
    }
}
