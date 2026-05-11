import express from 'express';
import {
  createEmmaRegistration,
  getEmmaRegistration,
  recordEmmaRegistrationPaymentSuccess
} from '../controllers/emma.registration.controller.js';

const router = express.Router();

router.post('/', createEmmaRegistration);
router.get('/', getEmmaRegistration);
router.post('/payment-success', recordEmmaRegistrationPaymentSuccess);

export default router;
