import express from "express";
import userController from "../../../controllers/v2/user/user.controller.js";


const router = express.Router();

router.get("/event/:id", userController.getEventById);
router.post("/logs", userController.logs);

router.post("/registration", userController.createRegistration);
router.get("/registration/:orderId", userController.getRegistrationByOrderId);




export default router;