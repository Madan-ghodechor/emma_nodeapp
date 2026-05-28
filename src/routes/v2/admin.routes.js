import express from 'express';
import admin from '../../controllers/v2/admin/admin.controller.js';
import AdminValidator from "../../validators/v2/admin.validator.js";
import adminAuth from "../../middlewares/v2/adminAuth.middleware.js";

const router = express.Router();


router.post(
  "/create-admin",
  adminAuth,
  AdminValidator.validateCreateAdmin,
  admin.createAdmin,
);
router.post("/login", AdminValidator.validateAdminLogin, admin.login);
router.post(
  "/create-event",
  adminAuth,
  AdminValidator.validateCreateEvent,

  admin.createEvent,
);
router.put("/update-event/:id", adminAuth,AdminValidator.validateUpdateEvent, admin.updateEvent);
router.get("/events", adminAuth, admin.getEvents);




export default router;
