
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import User from '../models/User.model.js';

export const verify = (req, res) => {
    Promise.all([
        makeCalculation(req.body.userData),
        checkDuplicate(req.body.userData)
    ])
        .then(([data, duplicateDetails]) => {
            // console.log(duplicateDetails);

            return sendSuccess(
                res,
                'Amount Calculated successfully',
                {
                    duplicateDetails,
                    ...data
                },
                201
            );
        })
        .catch(error => {
            return sendError(res, error.message, 400);
        });
};


const makeCalculation = async (data) => {
    try {
        let single_room_price = process.env.SINGLE_ROOM_PRICE;
        let double_room_price = process.env.DOUBLE_ROOM_PRICE;
        let triple_room_price = process.env.TRIPLE_ROOM_PRICE;


        let rooms = {};
        let totalAmount = 0;

        for (let room of data) {
            const type = room?.roomtype;
            if (!type) continue;

            rooms[type] = (rooms[type] || 0) + getDateDifferenceInDays(room?.checkIn, room?.checkOut);
        }

        for (let type in rooms) {

            if (type == "single") {
                totalAmount += rooms?.[type] * Number(single_room_price);
            }
            if (type == "double") {
                totalAmount += rooms?.[type] * Number(double_room_price);
            }
            if (type == "triple") {
                totalAmount += rooms?.[type] * Number(triple_room_price);
            }
        }

        return { totalAmount };

    } catch (error) {
        return error;
    }
}

function getDateDifferenceInDays(checkIn, checkOut) {
    if (!checkIn || !checkOut) {
        throw new Error('Both checkIn and checkOut dates are required');
    }

    // Parse as UTC to avoid timezone issues
    const start = new Date(`${checkIn}T00:00:00Z`);
    const end = new Date(`${checkOut}T00:00:00Z`);

    if (isNaN(start) || isNaN(end)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const diff = (end - start) / MS_PER_DAY;

    return Math.round(diff);
}

const checkDuplicate = async (data) => {
    const emails = [];
    const phones = [];

    for (let room of data) {
        for (let guest of room.attendees) {
            emails.push(guest?.email);
            phones.push(guest?.phone);
        }
    }

    return await User.find(
        {
            $or: [
                { email: { $in: emails } },
                { phone: { $in: phones } }
            ]
        },
        {
            email: 1,
            phone: 1
        }
    );

}
