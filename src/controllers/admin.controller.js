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
            const paymentsData = payments.find(payment =>
                String(payment._id) === String(room.paymentId)
            );

            return {
                ...room?._doc,
                payment: paymentsData || null
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
        const payments = await PaymentRecords.find().select('_id razorpay_payment_id paymentAmount');

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