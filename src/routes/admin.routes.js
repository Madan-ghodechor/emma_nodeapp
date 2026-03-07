import express from 'express';
import { login, getDashboard, getPaymentByID, createWhiteLabel, getAllWhiteLabels } from '../controllers/admin.controller.js';
import { sendVouchers } from '../controllers/resend.voucher.cotroller.js';

const router = express.Router();

router.post('/login', login);
router.get('/getDashboard', getDashboard)
router.get('/getPayment/:id', getPaymentByID)

router.get('/sendVouchers', sendVouchers)

export default router;
