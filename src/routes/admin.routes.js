import express from 'express';
import { login, getDashboard, getPaymentByID } from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', login);
router.get('/getDashboard', getDashboard)
router.get('/getPayment/:id', getPaymentByID)

export default router;
