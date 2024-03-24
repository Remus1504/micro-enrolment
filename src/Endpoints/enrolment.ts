import { notifications } from '../Controller/Notification/getNotification';
import { intent, enrolment } from '../Controller/Enrolment/createEnrolment';
import {
  studentOrders,
  enrolmentId,
  instructorOrders,
} from '../Controller/Enrolment/getEnrolment';
import {
  studentApproveEnrolment,
  cancel,
  deliverEnrolment,
  startDate,
  requestExtension,
} from '../Controller/Enrolment/updateEnrolment';
import { markNotificationAsRead } from '../Services/notification.service';
import express, { Router } from 'express';

const router: Router = express.Router();

const enrolmentRoutes = (): Router => {
  router.get('/notification/:userTo', notifications);
  router.get('/:enrolmentId', enrolmentId);
  router.get('/instructor/:instructorId', instructorOrders);
  router.get('/student/:studentId', studentOrders);
  router.post('/', enrolment);
  router.post('/create-payment-intent', intent);
  router.put('/cancel/:enrolmentId', cancel);
  router.put('/extension/:enrolmentId', requestExtension);
  router.put('/deliver-enrolment/:enrolmentId', deliverEnrolment);
  router.put('/approve-enrolment/:enrolmentId', studentApproveEnrolment);
  router.put('/course/:type/:enrolmentId', startDate);
  router.put('/notification/mark-as-read', async (req, res, next) => {
    try {
      // Assuming the notification ID is sent in the request body; adjust if it's in params or elsewhere
      const { notificationId } = req.body;
      if (!notificationId) {
        return res.status(400).send('Notification ID is required');
      }
      const notification = await markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error(error);
      next(error);
    }
  });

  return router;
};

export { enrolmentRoutes };
