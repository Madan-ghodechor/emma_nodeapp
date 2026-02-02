
import express from 'express';
import { createRoomsWithAttendees } from '../controllers/room.controller.js';

const router = express.Router();

router.post('/bulk', createRoomsWithAttendees);

export default router;
