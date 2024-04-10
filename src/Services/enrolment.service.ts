import { config } from '../configuration';
import { EnrolmentModel } from '../Modals/enrolmentModal';
import { publishDirectMessage } from '../Queues/enrolment.producer';
import { enrolmentChannel } from '../server';
import {
  IDeliveredWork,
  IExtendedEnrolment,
  IEnrolmentDocument,
  IEnrolmentMessage,
  IReviewMessageDetails,
  lowerCase,
} from '@remus1504/micrograde-shared';
import { sendNotification } from '../Services/notification.service';

export const getEnrolmentByEnrolmentId = async (
  enrolmentId: string
): Promise<IEnrolmentDocument> => {
  const enrolment: IEnrolmentDocument[] = (await EnrolmentModel.aggregate([
    { $match: { enrolmentId } },
  ])) as IEnrolmentDocument[];
  return enrolment[0];
};

export const getEnrolmentsByInstructorId = async (
  instructorId: string
): Promise<IEnrolmentDocument[]> => {
  const orders: IEnrolmentDocument[] = (await EnrolmentModel.aggregate([
    { $match: { instructorId } },
  ])) as IEnrolmentDocument[];
  return orders;
};

export const getEnrolmentsByStudentId = async (
  studentId: string
): Promise<IEnrolmentDocument[]> => {
  const orders: IEnrolmentDocument[] = (await EnrolmentModel.aggregate([
    { $match: { studentId } },
  ])) as IEnrolmentDocument[];
  return orders;
};

export const createEnrolment = async (
  data: IEnrolmentDocument
): Promise<IEnrolmentDocument> => {
  const enrolment: IEnrolmentDocument = await EnrolmentModel.create(data);
  const messageDetails: IEnrolmentMessage = {
    instructorId: data.instructorId,
    onGoingTasks: 1,
    type: 'create-enrolment',
  };
  // update instructor info
  await publishDirectMessage(
    enrolmentChannel,
    'micrograde-instructor-update',
    'user-instructor',
    JSON.stringify(messageDetails),
    'Details sent to users service'
  );
  const emailMessageDetails: IEnrolmentMessage = {
    enrolmentId: data.enrolmentId,
    invoiceId: data.invoiceId,
    enrolmentDue: `${data.offer.newStartDate}`,
    amount: `${data.price}`,
    studentUsername: lowerCase(data.studentUsername),
    instructorUsername: lowerCase(data.instructorUsername),
    title: data.offer.courseTitle,
    description: data.offer.description,
    requirements: data.requirements,
    serviceFee: `${enrolment.serviceFee}`,
    total: `${enrolment.price + enrolment.serviceFee!}`,
    enrolmentUrl: `${config.CLIENT_URL}/enrolments/${data.enrolmentId}/activities`,
    template: 'orderPlaced',
  };
  // send email
  await publishDirectMessage(
    enrolmentChannel,
    'micrograde-enrolment-notification',
    'enrolment-email',
    JSON.stringify(emailMessageDetails),
    'Enrolment email sent to notification service.'
  );
  sendNotification(
    enrolment,
    data.instructorUsername,
    'placed an enrolment for your course.'
  );
  return enrolment;
};

export const cancelEnrolment = async (
  enrolmentId: string,
  data: IEnrolmentMessage
): Promise<IEnrolmentDocument> => {
  const enrolment: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { enrolmentId },
    {
      $set: {
        cancelled: true,
        status: 'Cancelled',
        approvedAt: new Date(),
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  // update instructor info
  await publishDirectMessage(
    enrolmentChannel,
    'micrograde-instructor-update',
    'user-instructor',
    JSON.stringify({
      type: 'cancel-enrolment',
      instructorId: data.instructorId,
    }),
    'Cancelled enrolment details sent to users service.'
  );
  // update student info
  await publishDirectMessage(
    enrolmentChannel,
    'micrograde-student-update',
    'user-student',
    JSON.stringify({
      type: 'cancel-enrolment',
      studentId: data.studentId,
      purchasedCourses: data.purchasedCourses,
    }),
    'Cancelled enrolment details sent to users service.'
  );
  sendNotification(
    enrolment,
    enrolment.instructorUsername,
    'cancelled your enrolment.'
  );
  return enrolment;
};

export const approveEnrolment = async (
  enrolmentId: string,
  data: IEnrolmentMessage
): Promise<IEnrolmentDocument> => {
  const enrolment: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { enrolmentId },
    {
      $set: {
        approved: true,
        status: 'Completed',
        approvedAt: new Date(),
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  const messageDetails: IEnrolmentMessage = {
    instructorId: data.instructorId,
    studentId: data.studentId,
    onGoingTasks: data.onGoingTasks,
    completedTasks: data.completedTasks,
    totalEarnings: data.totalEarnings, // this is the price the instructor earned for lastest enrolment delivered
    recentDelivery: `${new Date()}`,
    type: 'approve-enrolment',
  };
  // update instructor info
  await publishDirectMessage(
    enrolmentChannel,
    'micrograde-instructor-update',
    'user-instructor',
    JSON.stringify(messageDetails),
    'Approved enrolment details sent to users service.'
  );
  // update student info
  await publishDirectMessage(
    enrolmentChannel,
    'micrograde-student-update',
    'user-student',
    JSON.stringify({
      type: 'purchased-courses',
      studentId: data.studentId,
      purchasedCourses: data.purchasedCourses,
    }),
    'Approved enrolment details sent to users service.'
  );
  sendNotification(
    enrolment,
    enrolment.instructorUsername,
    'approved your enrolment delivery.'
  );
  return enrolment;
};

export const instructorDeliveredEnrolment = async (
  enrolmentId: string,
  delivered: boolean,
  deliveredWork: IDeliveredWork
): Promise<IEnrolmentDocument> => {
  const enrolment: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { enrolmentId },
    {
      $set: {
        delivered,
        status: 'Delivered',
        ['events.enrolmentDelivered']: new Date(),
      },
      $push: {
        deliveredWork,
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  if (enrolment) {
    const messageDetails: IEnrolmentMessage = {
      enrolmentId,
      studentUsername: lowerCase(enrolment.studentUsername),
      instructorUsername: lowerCase(enrolment.instructorUsername),
      title: enrolment.offer.courseTitle,
      description: enrolment.offer.description,
      enrolmentUrl: `${config.CLIENT_URL}/enrolments/${enrolmentId}/activities`,
      template: 'orderDelivered',
    };
    // send email
    await publishDirectMessage(
      enrolmentChannel,
      'micrograde-enrolment-notification',
      'enrolment-email',
      JSON.stringify(messageDetails),
      'Enrolment sucessful message sent to notification service.'
    );
    sendNotification(
      enrolment,
      enrolment.studentUsername,
      'sucessful enrolment.'
    );
  }
  return enrolment;
};

export const requestEnrolmentExtension = async (
  enrolmentId: string,
  data: IExtendedEnrolment
): Promise<IEnrolmentDocument> => {
  const { newDate, days, reason, originalDate } = data;
  const enrolment: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { enrolmentId },
    {
      $set: {
        ['requestExtension.originalDate']: originalDate,
        ['requestExtension.newDate']: newDate,
        ['requestExtension.days']: days,
        ['requestExtension.reason']: reason,
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  if (enrolment) {
    const messageDetails: IEnrolmentMessage = {
      studentUsername: lowerCase(enrolment.studentUsername),
      instructorUsername: lowerCase(enrolment.instructorUsername),
      originalDate: enrolment.offer.oldStartDate,
      newDate: enrolment.offer.newStartDate,
      reason: enrolment.offer.reason,
      enrolmentUrl: `${config.CLIENT_URL}/enrolments/${enrolmentId}/activities`,
      template: 'orderExtension',
    };
    // send email
    await publishDirectMessage(
      enrolmentChannel,
      'micrograde-enrolment-notification',
      'enrolment-email',
      JSON.stringify(messageDetails),
      'Enrolment delivered message sent to notification service.'
    );
    sendNotification(
      enrolment,
      enrolment.studentUsername,
      'requested for an enrolment delivery date extension.'
    );
  }
  return enrolment;
};

export const approveEnrolmentDate = async (
  enrolmentId: string,
  data: IExtendedEnrolment
): Promise<IEnrolmentDocument> => {
  const { newDate, days, reason, startDateUpdate } = data;
  const enrolment: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { enrolmentId },
    {
      $set: {
        ['offer.durationInDays']: days,
        ['offer.newStartDate']: newDate,
        ['offer.reason']: reason,
        ['events.startDateUpdate']: new Date(`${startDateUpdate}`),
        requestExtension: {
          originalDate: '',
          newDate: '',
          days: 0,
          reason: '',
        },
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  if (enrolment) {
    const messageDetails: IEnrolmentMessage = {
      subject: 'Congratulations: Your extension request was approved',
      studentUsername: lowerCase(enrolment.studentUsername),
      instructorUsername: lowerCase(enrolment.instructorUsername),
      header: 'Request Accepted',
      type: 'accepted',
      message: 'You can continue working on the enrolment.',
      enrolmentUrl: `${config.CLIENT_URL}/enrolments/${enrolmentId}/activities`,
      template: 'orderExtensionApproval',
    };
    // send email
    await publishDirectMessage(
      enrolmentChannel,
      'micrograde-enrolment-notification',
      'enrolment-email',
      JSON.stringify(messageDetails),
      'Enrolment request extension approval message sent to notification service.'
    );
    sendNotification(
      enrolment,
      enrolment.instructorUsername,
      'approved your enrolment start date extension request.'
    );
  }
  return enrolment;
};

export const rejectExtensionDate = async (
  enrolmentId: string
): Promise<IEnrolmentDocument> => {
  const enrolment: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { enrolmentId },
    {
      $set: {
        requestExtension: {
          originalDate: '',
          newDate: '',
          days: 0,
          reason: '',
        },
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  if (enrolment) {
    const messageDetails: IEnrolmentMessage = {
      subject: 'Sorry: Your extension request was rejected',
      studentUsername: lowerCase(enrolment.studentUsername),
      instructorUsername: lowerCase(enrolment.instructorUsername),
      header: 'Request Rejected',
      type: 'rejected',
      message: 'You can contact the student for more information.',
      enrolmentUrl: `${config.CLIENT_URL}/enrolments/${enrolmentId}/activities`,
      template: 'orderExtensionApproval',
    };
    // send email
    await publishDirectMessage(
      enrolmentChannel,
      'micrograde-enrolment-notification',
      'enrolment-email',
      JSON.stringify(messageDetails),
      'Enrolment request extension rejection message sent to notification service.'
    );
    sendNotification(
      enrolment,
      enrolment.instructorUsername,
      'rejected your enrolment delivery date extension request.'
    );
  }
  return enrolment;
};

export const updateEnrolmentReview = async (
  data: IReviewMessageDetails
): Promise<IEnrolmentDocument> => {
  const enrolment: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { enrolmentId: data.enrolmentId },
    {
      $set:
        data.type === 'student-review'
          ? {
              studentReview: {
                rating: data.rating,
                review: data.review,
                created: new Date(`${data.createdAt}`),
              },
              ['events.studentReview']: new Date(`${data.createdAt}`),
            }
          : {
              instructorReview: {
                rating: data.rating,
                review: data.review,
                created: new Date(`${data.createdAt}`),
              },
              ['events.instructorReview']: new Date(`${data.createdAt}`),
            },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  sendNotification(
    enrolment,
    data.type === 'student-review'
      ? enrolment.instructorUsername
      : enrolment.studentUsername,
    `left you a ${data.rating} star review`
  );
  return enrolment;
};
