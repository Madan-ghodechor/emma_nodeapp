import express from 'express';
import {
  createEmmaRegistration,
  getEmmaRegistration,
  recordEmmaRegistrationPaymentSuccess,
  validateEmmaRegistration
} from '../controllers/emma.registration.controller.js';

const router = express.Router();

router.post('/', createEmmaRegistration);
router.get('/', getEmmaRegistration);
router.post('/validate', validateEmmaRegistration);
router.post('/payment-success', recordEmmaRegistrationPaymentSuccess);

export default router;
