import crypto from 'crypto';

import Stripe from 'stripe';
import { Request, Response } from 'express';
import { config } from '../../configuration';
import { StatusCodes } from 'http-status-codes';
import {
  approveEnrolmentDate,
  approveEnrolment,
  cancelEnrolment,
  rejectExtensionDate,
  requestEnrolmentExtension,
  instructorDeliveredEnrolment,
} from '../../Services/enrolment.service';
import { enrolmentUpdateSchema } from '../../Schema/enrolment';
import {
  BadRequestError,
  IDeliveredWork,
  IEnrolmentDocument,
  uploads,
} from '@remus1504/micrograde-shared';
import { UploadApiResponse } from 'cloudinary';

const stripe: Stripe = new Stripe(config.STRIPE_API_KEY!, {
  typescript: true,
});

const cancel = async (req: Request, res: Response): Promise<void> => {
  await stripe.refunds.create({
    payment_intent: `${req.body.paymentIntent}`,
  });
  const { enrolmentId } = req.params;
  await cancelEnrolment(enrolmentId, req.body.orderData);
  res
    .status(StatusCodes.OK)
    .json({ message: 'Enrolment cancelled successfully.' });
};

const requestExtension = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(
    enrolmentUpdateSchema.validate(req.body)
  );
  if (error?.details) {
    throw new BadRequestError(
      error.details[0].message,
      'Update requestExtension() method'
    );
  }
  const { enrolmentId } = req.params;
  console.log(enrolmentId);
  const enrolment: IEnrolmentDocument = await requestEnrolmentExtension(
    enrolmentId,
    req.body
  );
  res.status(StatusCodes.OK).json({ message: 'Enrolment request', enrolment });
};

const startDate = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(
    enrolmentUpdateSchema.validate(req.body)
  );
  if (error?.details) {
    throw new BadRequestError(
      error.details[0].message,
      'Update startDate() method'
    );
  }
  const { enrolmentId, type } = req.params;
  const enrolment: IEnrolmentDocument =
    type === 'approve'
      ? await approveEnrolmentDate(enrolmentId, req.body)
      : await rejectExtensionDate(enrolmentId);
  res
    .status(StatusCodes.OK)
    .json({ message: 'Enrolment date extension', enrolment });
};

const studentApproveEnrolment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { enrolmentId } = req.params;
  const enrolment: IEnrolmentDocument = await approveEnrolment(
    enrolmentId,
    req.body
  );
  console.log(req.body);
  res
    .status(StatusCodes.OK)
    .json({ message: 'Enrolment approved successfully.', enrolment });
};

const deliverEnrolment = async (req: Request, res: Response): Promise<void> => {
  const { enrolmentId } = req.params;
  let file: string = req.body.file;
  const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
  const randomCharacters: string = randomBytes.toString('hex');
  let result: UploadApiResponse;
  if (file) {
    result = (
      req.body.fileType === 'zip'
        ? await uploads(file, `${randomCharacters}.zip`)
        : await uploads(file)
    ) as UploadApiResponse;
    if (!result.public_id) {
      throw new BadRequestError(
        'File upload error. Try again',
        'Update deliverEnrolment() method'
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
  const enrolment: IEnrolmentDocument = await instructorDeliveredEnrolment(
    enrolmentId,
    true,
    deliveredWork
  );
  res
    .status(StatusCodes.OK)
    .json({ message: 'Enrolment delivered successfully.', enrolment });
};

export {
  cancel,
  requestExtension,
  startDate,
  studentApproveEnrolment,
  deliverEnrolment,
};
