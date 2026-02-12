import express from 'express';
import { login, createAdmin } from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', login);

export default router;
