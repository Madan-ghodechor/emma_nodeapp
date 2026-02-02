
import express from 'express';
import { importEmployees } from '../controllers/employee.controller.js';
import { upload } from '../middlewares/upload.middleware.js'; // multer middleware for Excel

const router = express.Router();

// Single endpoint handles both
router.post('/import-employees', upload.single('file'), importEmployees);

export default router;
