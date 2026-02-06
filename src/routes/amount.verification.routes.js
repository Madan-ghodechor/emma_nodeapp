import express from 'express';
import { verify } from '../controllers/amount.controller.js';

const router = express.Router();

router.post('/', verify);

export default router;
