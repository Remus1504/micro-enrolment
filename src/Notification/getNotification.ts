import { getNotificationsById } from "../Services/notification.service";
import { IEnrolmentNotifcation } from "@remus1504/micrograde";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const notifications = async (req: Request, res: Response): Promise<void> => {
  const notifications: IEnrolmentNotifcation[] = await getNotificationsById(
    req.params.userTo
  );
  res.status(StatusCodes.OK).json({ message: "Notifications", notifications });
};

export { notifications };
