import express from 'express';
import { createWhiteLabel, getAllWhiteLabels, getAllWhiteLabelById } from '../controllers/white.label.controller.js';

const router = express.Router();

router.post('', createWhiteLabel)
router.get('', getAllWhiteLabels)
router.post('/getColors', getAllWhiteLabelById)


export default router;