import express from 'express';
import admin from '../../../controllers/v2/admin/admin.controller.js';
import AdminValidator from "../../../validators/v2/admin.validator.js";
import adminAuth from "../../../middlewares/v2/adminAuth.middleware.js";

const router = express.Router();

//=========================================================================================//
//================================= Authentication Routes =================================//
//=========================================================================================//

//________ Authorization ________ //
router.post(
  "/login",
  AdminValidator.validateAdminLogin,
  admin.login
);

//________ Create new Authority ________ //
router.post(
  "/create-admin",
  adminAuth,
  AdminValidator.validateCreateAdmin,
  admin.createAdmin
);

//=========================================================================================//
//=============================== End Authentication Routes ===============================//
//=========================================================================================//





//=========================================================================================//
//====================================== Event Routes ======================================//
//=========================================================================================//

//________ Create New Event, Dynamic Voucher, site banner's etc data ________ //
router.post(
  "/create-event",
  adminAuth,
  AdminValidator.validateCreateAndUpdateEvent,
  admin.createEvent,
);

//________ Update Existing Event  ________ //
router.put(
  "/update-event/:id",
  adminAuth,
  AdminValidator.validateCreateAndUpdateEvent,
  admin.updateEvent,
);
 
//________ Get All Event's List ________ //
router.get(
  "/events", 
  adminAuth, 
  admin.getEvents
);

//=========================================================================================//
//=================================== End Event Routes ====================================//
//=========================================================================================//


export default router;
