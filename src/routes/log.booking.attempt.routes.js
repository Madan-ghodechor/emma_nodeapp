import express from 'express';
import { createBookingLog, getBookingLog } from '../controllers/log.booking.controller.js';

const router = express.Router();

router.post('/', createBookingLog);
router.get('/', getBookingLog);

export default router;
