import { notifications } from "../Controller/Notification/getNotification";
import { intent, order } from "../Controller/Enrolment/createEnrolment";
import {
  studentOrders,
  enrolmentId,
  instructorOrders,
} from "../Controller/Enrolment/getEnrolment";
import {
  studentApproveOrder,
  cancel,
  deliverOrder,
  deliveryDate,
  requestExtension,
} from "../Controller/Enrolment/updateEnrolment";
import { markNotificationAsRead } from "../Services/notification.service";
import express, { Router } from "express";

const router: Router = express.Router();

const orderRoutes = (): Router => {
  router.get("/notification/:userTo", notifications);
  router.get("/:e", enrolmentId);
  router.get("/instructor/:instructorId", instructorOrders);
  router.get("/student/:studentId", studentOrders);
  router.post("/", order);
  router.post("/create-payment-intent", intent);
  router.put("/cancel/:e", cancel);
  router.put("/extension/:e", requestExtension);
  router.put("/deliver-order/:e", deliverOrder);
  router.put("/approve-enrolment/:enrolmentId", studentApproveOrder);
  router.put("/course/:type/:e", deliveryDate);
  router.put("/notification/mark-as-read", markNotificationAsRead);

  return router;
};

export { orderRoutes };
