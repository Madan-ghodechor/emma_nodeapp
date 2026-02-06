import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { addUsersService } from '../services/bulk.add.users.js';


export const createRoomsWithAttendees = async (req, res) => {
    try {
        if (!Array.isArray(req.body) || req.body.length === 0) {
            return sendError(res, 'Invalid rooms payload', 400);
        }

        const roomsPayload = req.body;

        const service = await addUsersService(roomsPayload);

        return sendSuccess(
            res,
            'Rooms and attendees created successfully',
            {
                bulkRefId: service.bulkRefId,
                bookings: service.createdRooms
            }
        );
    } catch (error) {
        console.error(error);
        return sendError(res, 'Failed to create rooms', 500, error.message);
    }
};
