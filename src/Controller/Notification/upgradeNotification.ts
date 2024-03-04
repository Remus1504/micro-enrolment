import { markNotificationAsRead } from "../../Services/notification.service";
import { IEnrolmentNotifcation } from "@remus1504/micrograde-shared";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const markSingleNotificationAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { notificationId } = req.body;
  const notification: IEnrolmentNotifcation =
    await markNotificationAsRead(notificationId);
  res
    .status(StatusCodes.OK)
    .json({ message: "Notification updated successfully.", notification });
};

export { markSingleNotificationAsRead };
