import bcrypt from 'bcrypt';
import Admin from '../models/admin.model.js';
import jwt from 'jsonwebtoken';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import crypto from 'crypto';
import { loginMail } from "../services/login.main.service.js";




const generatePassword = () => {
    return crypto.randomBytes(8).toString('hex');
    // 16 char random password
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

