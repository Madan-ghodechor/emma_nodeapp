import express from 'express';
import { recordController } from '../controllers/record.payment.controller.js';
import { recordFailedController } from '../controllers/record.failed.payment.controller.js';

const router = express.Router();

router.post('/', recordController);
router.post('/failed', recordFailedController)

export default router;