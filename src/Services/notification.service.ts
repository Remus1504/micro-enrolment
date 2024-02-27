import { OrderNotificationModel } from "../Modals/notificationSchema";
import { socketIOOrderObject } from "../server";
import {
  IEnrolmentDocument,
  IEnrolmentNotifcation,
} from "@remus1504/micrograde";
import { getEnrolmentByEnrolmentId } from "../Services/enrolment.service";

const createNotification = async (
  data: IEnrolmentNotifcation
): Promise<IEnrolmentNotifcation> => {
  const notification: IEnrolmentNotifcation =
    await OrderNotificationModel.create(data);
  return notification;
};

const getNotificationsById = async (
  userToId: string
): Promise<IEnrolmentNotifcation[]> => {
  const notifications: IEnrolmentNotifcation[] =
    await OrderNotificationModel.aggregate([{ $match: { userTo: userToId } }]);
  return notifications;
};

const markNotificationAsRead = async (
  notificationId: string
): Promise<IEnrolmentNotifcation> => {
  const notification: IEnrolmentNotifcation =
    (await OrderNotificationModel.findOneAndUpdate(
      { _id: notificationId },
      {
        $set: {
          isRead: true,
        },
      },
      { new: true }
    )) as IEnrolmentNotifcation;
  const order: IEnrolmentDocument = await getEnrolmentByEnrolmentId(
    notification.orderId
  );
  socketIOOrderObject.emit("order notification", order, notification);
  return notification;
};

const sendNotification = async (
  data: IEnrolmentDocument,
  userToId: string,
  message: string
): Promise<void> => {
  const notification: IEnrolmentNotifcation = {
    userTo: userToId,
    senderUsername: data.instructorUsername,
    senderPicture: data.instructorImage,
    receiverUsername: data.studentUsername,
    receiverPicture: data.studentImage,
    message,
    orderId: data.orderId,
  } as IEnrolmentNotifcation;
  const orderNotification: IEnrolmentNotifcation = await createNotification(
    notification
  );
  socketIOOrderObject.emit("order notification", data, orderNotification);
};

export {
  createNotification,
  getNotificationsById,
  markNotificationAsRead,
  sendNotification,
};
