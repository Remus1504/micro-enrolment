import { notifications } from "../Controller/Notification/getNotification";
import { intent, order } from "../Controller/Enrolment/createEnrolment";
import {
  studentOrders,
  enrolmentId,
  instructorOrders,
} from "../Controller/Enrolment/getEnrolment";
import {
  studentApproveEnrolment,
  cancel,
  deliverEnrolment,
  deliveryDate,
  requestExtension,
} from "../Controller/Enrolment/updateEnrolment";
import { markNotificationAsRead } from "../Services/notification.service";
import express, { Router } from "express";

const router: Router = express.Router();

const enrolmentRoutes = (): Router => {
  router.get("/notification/:userTo", notifications);
  router.get("/:enrolmentId", enrolmentId);
  router.get("/instructor/:instructorId", instructorOrders);
  router.get("/student/:studentId", studentOrders);
  router.post("/", order);
  router.post("/create-payment-intent", intent);
  router.put("/cancel/:enrolmentId", cancel);
  router.put("/extension/:enrolmentId", requestExtension);
  router.put("/deliver-enrolment/:enrolmentId", deliverEnrolment);
  router.put("/approve-enrolment/:enrolmentId", studentApproveEnrolment);
  router.put("/course/:type/:enrolmentId", deliveryDate);
  router.put("/notification/mark-as-read", markNotificationAsRead);

  return router;
};

export { enrolmentRoutes };
