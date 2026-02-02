import express from 'express';
import { createUser, getUsers, getUserEmails } from '../controllers/user.controller.js';

const router = express.Router();

router.post('/', createUser);
router.get('/', getUsers);
router.get('/emails', getUserEmails);

export default router;
