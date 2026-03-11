import express from 'express';
import { login, getDashboard, getPaymentByID, sendRemainingPaymentCollectionMail, sendVoucher } from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', login);
router.get('/getDashboard', getDashboard)
router.get('/getPayment/:id', getPaymentByID)
router.post('/send-remaining-payment-mail', sendRemainingPaymentCollectionMail)
router.post('/send-voucher', sendVoucher)

export default router;


