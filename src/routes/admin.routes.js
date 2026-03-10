import express from 'express';
import { login, getDashboard, getPaymentByID, createWhiteLabel, getAllWhiteLabels } from '../controllers/admin.controller.js';
import { sendVouchers } from '../controllers/resend.voucher.cotroller.js';
import { sendVoucherController } from '../controllers/voucher.controller.js';

const router = express.Router();

router.post('/login', login);
router.get('/getDashboard', getDashboard)
router.get('/getPayment/:id', getPaymentByID)

router.post('/sendVouchers', sendVoucherController)

export default router;
