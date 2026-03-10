import express from "express";
import { sendVoucherController } from "../controllers/voucher.controller.js";

const router = express.Router();

router.post("/send", sendVoucherController);

export default router;