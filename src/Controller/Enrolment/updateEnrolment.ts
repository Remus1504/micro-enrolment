import crypto from "crypto";

import Stripe from "stripe";
import { Request, Response } from "express";
import { config } from "../../configuration";
import { StatusCodes } from "http-status-codes";
import {
  approveDeliveryDate,
  approveEnrolment,
  cancelOrder,
  rejectEnrolementStartDate,
  requestDeliveryExtension,
  instrcutorAcceptEnrolmentOrder,
} from "../../Services/enrolment.service";
import { enrolmentUpdateSchema } from "../../Schema/enrolment";
import {
  BadRequestError,
  IDeliveredWork,
  IEnrolmentDocument,
  uploads,
} from "@remus1504/micrograde";
import { UploadApiResponse } from "cloudinary";

const stripe: Stripe = new Stripe(config.STRIPE_API_KEY!, {
  typescript: true,
});

const cancel = async (req: Request, res: Response): Promise<void> => {
  await stripe.refunds.create({
    payment_intent: `${req.body.paymentIntent}`,
  });
  const { enrolmentOrderId } = req.params;
  await cancelOrder(enrolmentOrderId, req.body.orderData);
  res
    .status(StatusCodes.OK)
    .json({ message: "Enrolment cancelled successfully." });
};

const requestExtension = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(
    enrolmentUpdateSchema.validate(req.body)
  );
  if (error?.details) {
    throw new BadRequestError(
      error.details[0].message,
      "Update requestExtension() method"
    );
  }
  const { enrolmentOrderId } = req.params;
  const order: IEnrolmentDocument = await requestDeliveryExtension(
    enrolmentOrderId,
    req.body
  );
  res
    .status(StatusCodes.OK)
    .json({ message: "Enrolment delivery request", order });
};

const deliveryDate = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(
    enrolmentUpdateSchema.validate(req.body)
  );
  if (error?.details) {
    throw new BadRequestError(
      error.details[0].message,
      "Update deliveryDate() method"
    );
  }
  const { enrolmentOrderId, type } = req.params;
  const order: IEnrolmentDocument =
    type === "approve"
      ? await approveDeliveryDate(enrolmentOrderId, req.body)
      : await rejectEnrolementStartDate(enrolmentOrderId);
  res
    .status(StatusCodes.OK)
    .json({ message: "Enrolment delivery date extension", order });
};

const studentApproveOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { enrolmentOrderId } = req.params;
  const order: IEnrolmentDocument = await approveEnrolment(
    enrolmentOrderId,
    req.body
  );
  res
    .status(StatusCodes.OK)
    .json({ message: "Enrolment approved successfully.", order });
};

const deliverOrder = async (req: Request, res: Response): Promise<void> => {
  const { enrolmentOrderId } = req.params;
  let file: string = req.body.file;
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString("hex");
  let result: UploadApiResponse;
  if (file) {
    result = (
      req.body.fileType === "zip"
        ? await uploads(file, `${randomCharacters}.zip`)
        : await uploads(file)
    ) as UploadApiResponse;
    if (!result.public_id) {
      throw new BadRequestError(
        "File upload error. Try again",
        "Update deliverOrder() method"
      );
    }
    file = result?.secure_url;
  }
  const deliveredWork: IDeliveredWork = {
    message: req.body.message,
    file,
    fileType: req.body.fileType,
    fileName: req.body.fileName,
    fileSize: req.body.fileSize,
  };
  const order: IEnrolmentDocument = await instrcutorAcceptEnrolmentOrder(
    enrolmentOrderId,
    true,
    deliveredWork
  );
  res
    .status(StatusCodes.OK)
    .json({ message: "Enrolment delivered successfully.", order });
};

export {
  cancel,
  requestExtension,
  deliveryDate,
  studentApproveOrder,
  deliverOrder,
};
