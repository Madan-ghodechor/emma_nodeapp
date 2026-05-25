import express from 'express';
import admin from '../../controllers/v2/admin/admin.controller.js'

const router = express.Router();

router.post('/login', admin.login);


export default router;