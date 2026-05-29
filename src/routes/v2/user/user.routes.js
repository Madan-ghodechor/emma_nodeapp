import express from "express";
import userController from "../../../controllers/v2/user/user.controller.js";


const router = express.Router();

router.get("/event/:id", userController.getEventById);




export default router;