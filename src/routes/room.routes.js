
import express from 'express';
import { createRoomsWithAttendees, getTotalRoomCount } from '../controllers/room.controller.js';

const router = express.Router();

router.post('/bulk', createRoomsWithAttendees);
router.get('/count', getTotalRoomCount);

export default router;
