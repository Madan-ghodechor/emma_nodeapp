import express from 'express';
import multer from 'multer';
import { login, getDashboard, getPaymentByID, sendRemainingPaymentCollectionMail, sendVoucher, bulkCompaniesAdd } from '../controllers/admin.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/login', login);
router.get('/getDashboard', getDashboard)
router.get('/getPayment/:id', getPaymentByID)
router.post('/send-remaining-payment-mail', sendRemainingPaymentCollectionMail)
router.post('/send-voucher', sendVoucher)

router.post('/add-companies', upload.single('file'), bulkCompaniesAdd)

export default router;